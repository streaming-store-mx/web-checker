const express = require('express');
const cors = require('cors');
const imapSimple = require('imap-simple');
const app = express();

app.use(express.json());
app.use(cors());

function obtenerImapHost(email) {
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominio) return null;
    if (dominio.includes('gmail')) return 'imap.gmail.com';
    if (dominio.includes('outlook') || dominio.includes('hotmail') || dominio.includes('live')) return 'outlook.office365.com';
    if (dominio.includes('yahoo')) return 'imap.mail.yahoo.com';
    return null;
}

app.post('/api/verificar', async (req, res) => {
    const { email, password } = req.body;
    const hostConfig = obtenerImapHost(email);
    if (!hostConfig) {
        return res.json({ status: 'invalid', message: 'Dominio no soportado automáticamente' });
    }

    const config = {
        imap: {
            user: email,
            password: password,
            host: hostConfig,
            port: 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000
        }
    };

    try {
        const connection = await imapSimple.connect(config);
        connection.end();
        return res.json({ status: 'success', message: 'Credenciales válidas' });
    } catch (error) {
        return res.json({ status: 'invalid', message: 'Credenciales incorrectas o acceso denegado' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
