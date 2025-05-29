const express = require('express');
const router = express.Router();
// const fs = require('fs'); // Tidak digunakan di sini, bisa dihapus jika tidak ada keperluan lain
// const path = require('path'); // Tidak digunakan di sini, bisa dihapus jika tidak ada keperluan lain
const fetch = require('node-fetch');
const multer = require('multer'); // Import multer

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
// Pastikan URL ini benar dan modelnya tersedia untuk API key Anda
const GOOGLE_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'; // Menggunakan model gemini-1.5-flash-latest sebagai contoh, pastikan ini sesuai

const sessions = {};

// Konfigurasi Multer
// Kita akan menyimpan file di memory buffer untuk kemudian dikonversi ke base64
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Batas ukuran file 10MB, sesuaikan jika perlu
});

// Terapkan middleware multer di sini
// 'image' adalah nama field dari FormData di index.html: formData.append('image', imageFile);
router.post('/', upload.single('image'), async (req, res) => {
    // Setelah multer, req.body akan berisi field teks, dan req.file akan berisi info file
    const prompt = req.body.prompt;
    const imageFile = req.file; // req.file akan diisi oleh multer jika ada file 'image'
    const sessionId = req.body.session || createUniqueSessionId();

    // Baris 14 Anda yang error ('const prompt = req.body.prompt;') sekarang seharusnya bekerja
    // karena req.body sudah diparsing oleh multer (untuk field teks)

    if (!prompt && !imageFile) {
        return res.status(400).json({ success: false, message: 'Prompt atau image wajib diisi.' });
    }

    if (!GOOGLE_GEMINI_API_KEY) {
        console.error('GOOGLE_GEMINI_API_KEY tidak diatur dalam environment variables.');
        return res.status(500).json({ success: false, message: 'Kesalahan konfigurasi server: Google Gemini API key tidak ditemukan.' });
    }

    let currentMessages = sessions[sessionId] || [];
    let userParts = [];

    if (prompt) {
        userParts.push({ text: prompt });
    }

    if (imageFile) {
        // Pastikan imageFile ada dan memiliki buffer
        if (!imageFile.buffer || !imageFile.mimetype) {
            return res.status(400).json({ success: false, message: 'Data gambar tidak valid atau tidak lengkap.' });
        }
        const base64Image = imageFile.buffer.toString('base64');
        const mimeType = imageFile.mimetype;
        userParts.push({ inlineData: { mimeType: mimeType, data: base64Image } });
    }

    if (userParts.length > 0) {
        currentMessages.push({ role: 'user', parts: userParts });
    } else {
        // Seharusnya tidak terjadi jika validasi di awal sudah benar
        return res.status(400).json({ success: false, message: 'Tidak ada input yang bisa diproses.' });
    }


    // Struktur 'contents' untuk Google API
    const googleApiContents = currentMessages.map(msg => {
        if (msg.role === 'user') {
            return { role: 'user', parts: msg.parts };
        } else if (msg.role === 'assistant' || msg.role === 'model') { // API mengharapkan 'model' bukan 'assistant'
            return { role: 'model', parts: [{ text: msg.content }] };
        }
        return msg; // Sebaiknya filter atau pastikan semua message punya struktur yang benar
    }).filter(msg => msg && msg.parts && msg.parts.length > 0); // Pastikan parts tidak kosong

    if (googleApiContents.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada konten yang valid untuk dikirim ke API.' });
    }

    try {
        const payload = {
            contents: googleApiContents,
            // Anda bisa menambahkan generationConfig di sini jika perlu
            // generationConfig: {
            //   temperature: 0.7,
            //   topK: 1,
            //   topP: 1,
            //   maxOutputTokens: 2048,
            // },
        };

        const apiResponse = await fetch(`${GOOGLE_GEMINI_API_URL}?key=${GOOGLE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json();

        if (apiResponse.ok) {
            // Struktur respons Gemini bisa bervariasi, pastikan Anda mengaksesnya dengan benar
            if (responseData.candidates && responseData.candidates.length > 0 &&
                responseData.candidates[0].content && responseData.candidates[0].content.parts &&
                responseData.candidates[0].content.parts.length > 0 && responseData.candidates[0].content.parts[0].text) {

                const reply = responseData.candidates[0].content.parts[0].text;

                currentMessages.push({ role: 'model', content: reply }); // Simpan sebagai 'model'
                sessions[sessionId] = currentMessages;

                res.json({
                    success: true,
                    response: reply,
                    session: sessionId,
                    // full_response: responseData // Bisa berguna untuk debugging, tapi opsional untuk klien
                });
            } else {
                console.warn('Google Gemini API merespons tanpa kandidat yang valid atau teks balasan:', responseData);
                res.status(500).json({ success: false, message: 'Google Gemini API tidak mengembalikan kandidat yang valid.', details: responseData.error || responseData });
            }
        } else {
            console.error('Google Gemini API Error (Status: ' + apiResponse.status + '):', responseData);
            res.status(apiResponse.status).json({
                success: false,
                message: responseData.error?.message || 'Gagal mendapatkan respons dari Google Gemini API.',
                error_details: responseData.error || responseData
            });
        }
    } catch (error) {
        console.error('Error memanggil Google Gemini API:', error);
        res.status(500).json({ success: false, message: 'Kesalahan server internal saat memanggil Google Gemini API.', error: error.message });
    }
});

function createUniqueSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 16;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

module.exports = router;
