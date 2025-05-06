const axios = require('axios');
const cheerio = require('cheerio');
const whois = require('whois');
const { URL } = require('url');

module.exports = async function(req, res) {
  const inputUrl = req.query.url;
  if (!inputUrl) {
    return res.status(400).json({ error: 'Parameter URL diperlukan' });
  }

  let domain;
  try {
    domain = new URL(inputUrl).hostname;
  } catch {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    // Ambil metadata dari halaman web
    const { data: html } = await axios.get(inputUrl, { timeout: 10000 });
    const $ = cheerio.load(html);

    const title = $('head > title').text() || null;
    const description = $('meta[name="description"]').attr('content') || null;
    const keywords = $('meta[name="keywords"]').attr('content') || null;

    whois.lookup(domain, (err, rawData) => {
      if (err || !rawData) {
        return res.status(500).json({ error: 'Gagal mengambil data WHOIS' });
      }

      const response = {
        success: true,
        url: inputUrl,
        title,
        description,
        keywords,
        whois: {
          domainName: rawData.match(/Domain Name:\s*(.+)/i)?.[1] || null,
          registrar: rawData.match(/Registrar:\s*(.+)/i)?.[1] || null,
          creationDate: rawData.match(/Creation Date:\s*(.+)/i)?.[1] || null,
          updateDate: rawData.match(/Updated Date:\s*(.+)/i)?.[1] || null,
          expirationDate: rawData.match(/(Registry Expiry|Expiration) Date:\s*(.+)/i)?.[2] || null,
          nameServers: (rawData.match(/Name Server:\s*(.+)/gi) || []).map(line => line.split(':')[1]?.trim()),
          status: (rawData.match(/Domain Status:\s*(.+)/gi) || []).map(s => s.replace('Domain Status:', '').trim()),
          contactEmail: rawData.match(/Registrant Email:\s*(.+)/i)?.[1] || null,
          contactPhone: rawData.match(/Registrant Phone:\s*(.+)/i)?.[1] || null
        }
      };

      res.json(response);
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Gagal memproses permintaan' });
  }
};
