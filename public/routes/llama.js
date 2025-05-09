// routes/llama.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.LLAMA_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://topup.eu.org/',
    'X-Title': 'MaticAPI',
  }
});

// Simpan sesi sementara di memori
const sessions = {};

// Endpoint POST
router.post('/', async (req, res) => {
  const { prompt, session } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt wajib diisi' });
  }

  const sessionId = session || uuidv4();

  // Buat sesi jika belum ada
  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  // Tambahkan prompt user ke riwayat
  sessions[sessionId].push({ role: 'user', content: prompt });

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'meta-llama/llama-4-maverick:free',
      messages: sessions[sessionId],
    });

    const reply = chatCompletion.choices[0]?.message?.content || '';

    // Tambahkan respons dari LLaMA ke sesi
    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({
      success: true,
      response: reply,
      session: sessionId,
    });

  } catch (error) {
    console.error('Gagal dari OpenRouter (LLaMA):', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Terjadi kesalahan tak dikenal',
    });
  }
});

module.exports = router;
