const express = require('express');
const path = require('path');
const whoisRoute = require('./public/routes/whois');
const embedRoute = require('./public/routes/embed');
const shortenRoute = require('./public/routes/shorten');
const randomUserRoute = require('./public/routes/randomUser');
const ipLocatorRoute = require('./public/routes/iplocator');
const imeiRoute = require('./public/routes/imei'); // Tambahkan route IMEI

const app = express();
const PORT = process.env.PORT || 3000;

// Static files (untuk dokumentasi API)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/whois', whoisRoute);
app.use('/api/embed', embedRoute);
app.use('/api/shorten', shortenRoute);
app.use('/api/randomuser', randomUserRoute);
app.use('/api/iplocator', ipLocatorRoute);
app.use('/api/imei', imeiRoute); // Aktifkan endpoint IMEI

// Home route
app.get('/', (req, res) => {
  res.send('Selamat datang di API server');
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
