const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const ip = req.query.ip;

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);

    const response = {
      ip: data.ip,
      version: data.version || (ip.includes(":") ? "IPv6" : "IPv4"),
      city: data.city,
      region: data.region,
      region_code: data.region_code,
      country_code: data.country_code,
      country_code_iso3: data.country_code_iso3,
      country_name: data.country_name,
      country_capital: data.country_capital,
      country_tld: data.country_tld,
      continent_code: data.continent_code,
      in_eu: data.in_eu,
      postal: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      utc_offset: data.utc_offset,
      country_calling_code: data.country_calling_code,
      currency: data.currency,
      currency_name: data.currency_name,
      languages: data.languages,
      country_area: data.country_area,
      country_population: data.country_population,
      asn: data.asn,
      org: data.org,
      hostname: data.hostname
    };

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IP data' });
  }
});

module.exports = router;
