const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://topup.eu.org',
    'X-Title': 'Matic API'
  }
});

const sessions = {};

router.post('/', upload.single('image'), async (req, res) => {
  const { prompt, session } = req.body;
  const imageFile = req.file;

  if (!prompt && !imageFile) {
    return res.status(400).json({ success: false, message: 'Prompt atau gambar diperlukan.' });
  }

  let base64Image;
  if (imageFile) {
    const filePath = path.join(__dirname, '../../', imageFile.path);
    const buffer = fs.readFileSync(filePath);
    base64Image = buffer.toString('base64');
    fs.unlinkSync(filePath); // Hapus setelah dibaca
  }

  const sessionId = session || uuidv4();
  const messages = sessions[sessionId] || [];

  const userMessage = {
    role: 'user',
    content: [
      ...(prompt ? [{ type: 'text', text: prompt }] : []),
      ...(base64Image ? [{
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`
        }
      }] : [])
    ]
  };

  messages.push(userMessage);

  try {
    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-exp:free',
      messages,
    });

    const reply = completion.choices?.[0]?.message?.content || 'Tidak ada respons.';
    messages.push({ role: 'assistant', content: reply });

    sessions[sessionId] = messages;

    res.json({
      success: true,
      response: reply,
      session: sessionId
    });
  } catch (error) {
    console.error('Gemini Error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Gagal menghasilkan respons dari Gemini.' });
  }
});

module.exports = router;
