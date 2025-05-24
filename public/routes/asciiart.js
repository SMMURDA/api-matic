const express = require('express');
const router = express.Router();
const figlet = require('figlet'); // Import library figlet

/**
 * @route GET /
 * @desc Mengkonversi teks menjadi ASCII Art dan mengembalikan hasilnya sebagai teks biasa.
 * @param {string} text - Teks yang akan dikonversi menjadi ASCII Art.
 * @param {string} [font] - Nama font ASCII Art (opsional, default: 'Standard').
 * @returns {string} - Hasil ASCII Art sebagai teks biasa.
 *
 * Catatan: Karena router ini dipasang di '/api/asciiart' di server.js,
 * endpoint ini akan dapat diakses di '/api/asciiart'.
 */
router.get('/', async (req, res) => {
    const inputText = req.query.text;
    const font = req.query.font || 'Standard'; // Default font 'Standard'

    if (!inputText) {
        // Mengirim error sebagai teks biasa juga
        return res.status(400).send('Parameter "text" wajib diisi.');
    }

    // Menggunakan figlet untuk menghasilkan ASCII Art
    figlet.text(inputText, {
        font: font
    }, function(err, data) {
        if (err) {
            console.error('Error saat membuat ASCII Art:', err);
            // Mengirim error sebagai teks biasa
            if (err.message && err.message.includes('font')) {
                 return res.status(400).send(`Error: Font '${font}' tidak ditemukan atau tidak valid.`);
            }
            return res.status(500).send('Terjadi kesalahan server internal saat membuat ASCII Art.');
        }
        
        // Mengirim hasil ASCII Art sebagai teks biasa
        res.status(200).set('Content-Type', 'text/plain').send(data);
    });
});

/**
 * @route GET /fonts
 * @desc Mengambil daftar font yang tersedia untuk ASCII Art.
 * @returns {object} - Daftar font ASCII Art yang didukung oleh Figlet.
 *
 * Catatan: Karena router ini dipasang di '/api/asciiart' di server.js,
 * endpoint ini akan dapat diakses di '/api/asciiart/fonts'.
 */
router.get('/fonts', (req, res) => {
    figlet.fonts(function(err, fonts) {
        if (err) {
            console.error('Error saat mengambil daftar font Figlet:', err);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server internal saat mengambil daftar font.',
                error: err.message
            });
        }
        // Endpoint ini tetap mengembalikan JSON karena ini adalah daftar data
        res.status(200).json({
            success: true,
            fonts: fonts
        });
    });
});

module.exports = router;

