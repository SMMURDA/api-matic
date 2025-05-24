const express = require('express');
const router = express.Router();

// Frankfurter API tidak memerlukan API Key
const BASE_URL = `https://api.frankfurter.dev/v1`;

/**
 * @route GET /
 * @desc Mengkonversi jumlah uang dari satu mata uang ke mata uang lain menggunakan Frankfurter API.
 * @param {number} amount - Jumlah uang yang akan dikonversi.
 * @param {string} from - Kode mata uang sumber (misal: "USD", "IDR").
 * @param {string} to - Kode mata uang tujuan (misal: "EUR", "JPY").
 * @returns {object} - Hasil konversi.
 *
 * Catatan: Karena router ini dipasang di '/api/currency' di server.js,
 * endpoint ini akan dapat diakses di '/api/currency'.
 */
router.get('/', async (req, res) => { // <== Endpoint diubah dari '/convert' menjadi '/'
    const { amount, from, to } = req.query; // Menggunakan req.query karena ini GET request

    if (!amount || !from || !to) {
        return res.status(400).json({
            success: false,
            message: 'Parameter "amount", "from", dan "to" wajib diisi.'
        });
    }

    // Validasi amount harus berupa angka
    if (isNaN(parseFloat(amount))) {
        return res.status(400).json({
            success: false,
            message: 'Parameter "amount" harus berupa angka yang valid.'
        });
    }

    try {
        // Frankfurter API menggunakan format: /latest?amount=10&from=USD&to=IDR
        const response = await fetch(`${BASE_URL}/latest?amount=${amount}&from=${from.toUpperCase()}&to=${to.toUpperCase()}`);
        const data = await response.json();

        if (response.status !== 200 || data.error) {
            // Tangani error dari Frankfurter API
            return res.status(response.status).json({
                success: false,
                message: `Error dari Frankfurter API: ${data.error || 'Terjadi kesalahan tidak dikenal.'}`,
                details: data
            });
        }

        const exchangeRate = data.rates[to.toUpperCase()];
        if (!exchangeRate) {
            return res.status(404).json({
                success: false,
                message: `Nilai tukar untuk mata uang tujuan (${to.toUpperCase()}) tidak ditemukan.`,
                details: data
            });
        }
        
        const convertedAmount = parseFloat(amount) * exchangeRate;

        res.status(200).json({
            success: true,
            originalAmount: parseFloat(amount),
            fromCurrency: from.toUpperCase(),
            toCurrency: to.toUpperCase(),
            exchangeRate: exchangeRate,
            convertedAmount: parseFloat(convertedAmount.toFixed(2)) // Pembulatan 2 desimal
        });

    } catch (error) {
        console.error('Error saat melakukan konversi mata uang dengan Frankfurter:', error.message);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server internal saat konversi mata uang.',
            error: error.message
        });
    }
});

/**
 * @route GET /supported
 * @desc Mengambil daftar kode mata uang yang didukung oleh Frankfurter API.
 * @returns {object} - Daftar kode mata uang.
 *
 * Catatan: Karena router ini dipasang di '/api/currency' di server.js,
 * endpoint ini akan dapat diakses di '/api/currency/supported'.
 */
router.get('/supported', async (req, res) => { // <== Endpoint tetap '/supported'
    try {
        const response = await fetch(`${BASE_URL}/currencies`); // Endpoint untuk daftar mata uang
        const data = await response.json();

        if (response.status !== 200) {
            return res.status(response.status).json({
                success: false,
                message: `Error dari Frankfurter API: ${data.error || 'Terjadi kesalahan tidak dikenal.'}`,
                details: data
            });
        }
        
        // Frankfurter mengembalikan objek { "USD": "United States Dollar", ... }
        // Kita ubah menjadi array of objects { code: "USD", name: "United States Dollar" }
        const supportedCurrencies = Object.keys(data).map(code => ({
            code: code,
            name: data[code]
        }));

        res.status(200).json({
            success: true,
            currencies: supportedCurrencies
        });

    } catch (error) {
        console.error('Error saat mengambil daftar mata uang yang didukung dari Frankfurter:', error.message);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server internal saat mengambil daftar mata uang.',
            error: error.message
        });
    }
});

module.exports = router;

