const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

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
const microsoftRoute = require('./public/routes/microsoft'); // <- Tambahkan ini

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // untuk form data

// API routes
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
app.use('/api/microsoft', microsoftRoute); // <- Rute Microsoft

// Home
app.get('/', (req, res) => {
  res.send('Selamat datang di API server');
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
