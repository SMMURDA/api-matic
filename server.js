const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Import semua route
const whoisRoute = require('./public/routes/whois');
const embedRoute = require('./public/routes/embed');
const shortenRoute = require('./public/routes/shorten');
const randomUserRoute = require('./public/routes/randomUser');
const ipLocatorRoute = require('./public/routes/iplocator');
const docParserRoute = require('./public/routes/docparser');
const qrCodeRoute = require('./public/routes/qrcode');
const deepseekRoute = require('./public/routes/deepseek');
const geminiRoute = require('./public/routes/gemini');
const llamaRoute = require('./public/routes/llama');
const microsoftRoute = require('./public/routes/microsoft');
const nvidiaRoute = require('./public/routes/nvidia');
const sslRoute = require('./public/routes/ssl');
const metadataRoute = require('./public/routes/metadata');
const dnsRoute = require('./public/routes/dns');
const translateRoute = require('./public/routes/translate');
const currencyRoute = require('./public/routes/currency');
const asciiartRoute = require('./public/routes/asciiart');
const hashRoute = require('./public/routes/hash');
const leetRoute = require('./public/routes/leet'); // Import route Leet Speak yang baru

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.set('trust proxy', 1); // Mempercayai proxy pertama (Nginx)
app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Daftarkan semua route API
app.use('/api/whois', whoisRoute);
app.use('/api/embed', embedRoute);
app.use('/api/shorten', shortenRoute);
app.use('/api/randomuser', randomUserRoute);
app.use('/api/iplocator', ipLocatorRoute);
app.use('/api/docparser', docParserRoute);
app.use('/api/qrcode', qrCodeRoute);
app.use('/api/deepseek', deepseekRoute);
app.use('/api/gemini', geminiRoute);
app.use('/api/llama', llamaRoute);
app.use('/api/microsoft', microsoftRoute);
app.use('/api/nvidia', nvidiaRoute);
app.use('/api/ssl', sslRoute);
app.use('/api/metadata', metadataRoute);
app.use('/api/dns', dnsRoute);
app.use('/api/translate', translateRoute);
app.use('/api/currency', currencyRoute);
app.use('/api/asciiart', asciiartRoute);
app.use('/api/hash', hashRoute);
app.use('/api/leet', leetRoute); // Daftarkan route Leet Speak

// Route Home
app.get('/', (req, res) => {
    res.send('Selamat datang di API server');
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

