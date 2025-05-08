// public/routes/docparser.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const { parse } = require('csv-parse/sync');
const { JSDOM } = require('jsdom');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'File tidak ditemukan.' });
  }

  try {
    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (ext === '.docx') {
      const data = await mammoth.extractRawText({ path: file.path });
      text = data.value;
    } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const result = await Tesseract.recognize(file.path, 'eng');
      text = result.data.text;
    } else if (ext === '.txt' || ext === '.md') {
      text = fs.readFileSync(file.path, 'utf-8');
    } else if (ext === '.json') {
      const raw = fs.readFileSync(file.path, 'utf-8');
      text = JSON.stringify(JSON.parse(raw), null, 2);
    } else if (ext === '.csv') {
      const raw = fs.readFileSync(file.path, 'utf-8');
      const records = parse(raw, { columns: true });
      text = JSON.stringify(records, null, 2);
    } else if (ext === '.html') {
      const raw = fs.readFileSync(file.path, 'utf-8');
      const dom = new JSDOM(raw);
      text = dom.window.document.body.textContent || '';
    } else {
      return res.status(400).json({ error: 'Format file tidak didukung.' });
    }

    res.json({
      filename: file.originalname,
      mimetype: file.mimetype,
      text: text.trim()
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses file.', detail: err.message });
  } finally {
    fs.unlinkSync(file.path); // hapus file sementara
  }
});

module.exports = router;
