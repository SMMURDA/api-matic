const express = require('express');
const puppeteer = require('puppeteer');
const tesseract = require('node-tesseract-ocr');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/', async (req, res) => {
  const imei = req.query.imei;
  if (!imei) {
    return res.status(400).json({ error: 'IMEI is required' });
  }

  const captchaPath = path.join(__dirname, 'captcha.png');

  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Added --no-sandbox to avoid root issues
    });
    const page = await browser.newPage();

    await page.goto('https://www.beacukai.go.id/cek-imei.html', { waitUntil: 'networkidle2' });

    // Tunggu captcha muncul
    await page.waitForSelector('#captcha-img');

    // Screenshot captcha
    const captchaElement = await page.$('#captcha-img');
    await captchaElement.screenshot({ path: captchaPath });

    // OCR captcha
    const captchaText = await tesseract.recognize(captchaPath, {
      lang: 'eng',
      tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    });

    const cleanCaptcha = captchaText.replace(/[^a-zA-Z0-9]/g, '').trim();

    // Masukkan data form
    await page.type('#search-imei', imei);
    await page.type('#captcha-form', cleanCaptcha);
    await page.click('#search-btn');

    // Tunggu hasil muncul
    await page.waitForSelector('#result');

    const result = await page.$eval('#result', el => el.innerText);

    return res.json({
      imei,
      captcha: cleanCaptcha,
      result,
    });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: 'Gagal memproses data', detail: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
    if (fs.existsSync(captchaPath)) {
      fs.unlinkSync(captchaPath); // Hapus captcha setelah digunakan
    }
  }
});

module.exports = router;
