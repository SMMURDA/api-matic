const axios = require('axios');
require('dotenv').config();

module.exports = async function (req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Parameter URL diperlukan' });
  }

  try {
    const response = await axios.post(
      'https://api-ssl.bitly.com/v4/shorten',
      { long_url: url },
      {
        headers: {
          Authorization: `Bearer ${process.env.BITLY_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      original_url: url,
      short_url: response.data.link
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Gagal memendekkan URL' });
  }
};
