const express = require('express');
const cors = require('cors');
const { ImapFlow } = require('imapflow');
const app = express();

app.use(express.json());
app.use(cors());

// Función para detectar el servidor IMAP correcto según el correo
function getImapHost(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') {
        return 'imap.gmail.com';
    } else if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) {
        return 'outlook.office365.com';
    }
    return null;
}

app.post('/api/verificar', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ status: 'invalid', message: 'Faltan datos' });
    }

    const host = getImapHost(email);
    if (!host) {
        return res.json({ status: 'invalid', message: 'Dominio no soportado' });
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
        return res.json({ status: 'invalid', message: 'Credenciales incorrectas o bloqueo de seguridad' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor IMAP corriendo en el puerto ${PORT}`);
});
