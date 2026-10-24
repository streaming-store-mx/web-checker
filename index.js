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

    const host = getImapHost(email);

    if (!host) {
        return res.json({ status: 'invalid', message: 'Dominio de correo no soportado' });
    }

    const client = new ImapFlow({
        host: host,
        port: 993,
        secure: true,
        auth: {
            user: email,
            pass: password
        },
        logger: false
    });

    try {
        await client.connect();
        await client.logout();
        return res.json({ status: 'success', message: 'Credenciales válidas' });
    } catch (error) {
        return res.json({ 
            status: 'invalid', 
            message: 'Credenciales incorrectas o la cuenta requiere contraseña de aplicación / 2FA' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor con Puppeteer corriendo en el puerto ${PORT}`);
});
