const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

router.get('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  const videoRequests = [];
  let allVideos = [];

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    page.on('request', req => {
      const url = req.url();
      if (url.match(/\.(mp4|m3u8|webm|mov)(\?|$)/i)) {
        videoRequests.push({ type: 'request', src: url });
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 0 });

    await page.waitForSelector('video, video source', { timeout: 5000 });

    const pageVideos = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('video, video source').forEach(el => {
        if (el.src && !el.src.startsWith('blob:')) {
          results.push({ tag: el.tagName.toLowerCase(), src: el.src });
        }
      });
      return results;
    });

    allVideos = [...pageVideos, ...videoRequests];
    await browser.close();

    res.json({ items: allVideos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal memproses halaman.' });
  }
});

module.exports = router;
