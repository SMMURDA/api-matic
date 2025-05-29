const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const multer = require('multer');

const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GOOGLE_GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const sessions = {};

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt;
    const imageFile = req.file;
    const sessionId = req.body.session || createUniqueSessionId();

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
        return res.status(400).json({ success: false, message: 'Tidak ada input yang bisa diproses.' });
    }

    const googleApiContents = currentMessages.map(msg => {
        if (msg.role === 'user') {
            return { role: 'user', parts: msg.parts };
        } else if (msg.role === 'assistant' || msg.role === 'model') {
            return { role: 'model', parts: [{ text: msg.content }] };
        }
        return msg;
    }).filter(msg => msg && msg.parts && msg.parts.length > 0);

    if (googleApiContents.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada konten yang valid untuk dikirim ke API.' });
    }

    try {
        const payload = {
            contents: googleApiContents,
        };

        const apiResponse = await fetch(`${GOOGLE_GEMINI_API_URL}?key=${GOOGLE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseData = await apiResponse.json();

        if (apiResponse.ok) {
            if (responseData.candidates && responseData.candidates.length > 0 &&
                responseData.candidates[0].content && responseData.candidates[0].content.parts &&
                responseData.candidates[0].content.parts.length > 0 && responseData.candidates[0].content.parts[0].text) {

                const reply = responseData.candidates[0].content.parts[0].text;

                currentMessages.push({ role: 'model', content: reply });
                sessions[sessionId] = currentMessages;

                res.json({
                    success: true,
                    response: reply,
                    session: sessionId,
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
