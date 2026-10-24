const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/api/verificar', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.json({ status: 'invalid', message: 'Faltan datos' });
    }

    let browser;
    try {
        // Lanzamos el navegador en modo headless
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        
        // Simulamos un agente de usuario real para evitar bloqueos básicos
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Entramos al login de Outlook / Microsoft
        await page.goto('https://login.live.com/', { waitUntil: 'networkidle2', timeout: 30000 });

        // Escribir correo
        await page.waitForSelector('#i0116', { timeout: 15000 });
        await page.type('#i0116', email, { delay: 50 });
        await page.click('#idSIButton9');

        // Esperar a que aparezca el campo de contraseña
        await page.waitForSelector('#i0119', { timeout: 15000 });
        await page.type('#i0119', password, { delay: 50 });
        await page.click('#idSIButton9');

        // Esperamos un momento para ver si entra o si arroja error de credenciales
        await new Promise(resolve => setTimeout(resolve, 5000));

        const urlActual = page.url();
        await browser.close();

        // Si la URL cambia al panel principal o pide verificación de 2FA/mantener sesión, la contraseña fue correcta.
        // Si sigue en la pantalla de error de contraseña, es incorrecta.
        if (urlActual.includes('account.microsoft.com') || urlActual.includes('myapps.microsoft.com') || urlActual.includes('proofs') || urlActual.includes('consent')) {
            return res.json({ status: 'success', message: 'Credenciales válidas' });
        } else {
            return res.json({ status: 'invalid', message: 'Credenciales incorrectas o bloqueo de seguridad' });
        }

    } catch (error) {
        if (browser) await browser.close();
        return res.json({ status: 'invalid', message: 'Error en el proceso del navegador: ' + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor con Puppeteer corriendo en el puerto ${PORT}`);
});
