const express = require('express');
const dns = require('dns').promises;
const fetch = require('node-fetch');
const router = express.Router();

const RR_TYPES = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT', 'SOA', 'SRV', 'PTR', 'CAA', 'DS', 'DNSKEY', 'TLSA', 'HTTPS', 'SVCB'];

function getTypeName(type) {
  const types = {
    1: 'A', 28: 'AAAA', 15: 'MX', 5: 'CNAME', 2: 'NS',
    16: 'TXT', 6: 'SOA', 33: 'SRV', 12: 'PTR', 257: 'CAA',
    43: 'DS', 48: 'DNSKEY', 52: 'TLSA', 65: 'HTTPS', 64: 'SVCB'
  };
  return types[type] || `TYPE${type}`;
}

router.get('/', async (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Missing domain parameter' });

  const results = {};
  let googleFlags = {};
  const lowerDomain = domain.toLowerCase();

  await Promise.all(RR_TYPES.map(async type => {
    const record = { type };

    // Local DNS lookup
    try {
      const localData = await dns.resolve(lowerDomain, type);
      record.local = localData;
    } catch {
      record.local = [];
    }

    // Google DNS lookup
    try {
      const resp = await fetch(`https://dns.google/resolve?name=${lowerDomain}&type=${type}`);
      const json = await resp.json();

      if (!googleFlags.tc) {
        googleFlags = {
          status: json.Status,
          tc: json.TC,
          rd: json.RD,
          ra: json.RA,
          ad: json.AD,
          cd: json.CD
        };
      }

      if (json.Answer) {
        record.google = json.Answer.map(r => ({
          name: r.name,
          type: getTypeName(r.type),
          TTL: r.TTL,
          data: r.data
        }));
      } else {
        record.google = [];
      }

      // DNSSEC Detail
      if (json.Comment) {
        record.dnssec_detail = json.Comment;
      }
    } catch {
      record.google = [];
    }

    results[type] = record;
  }));

  return res.json({
    domain: lowerDomain,
    dns_flags: googleFlags,
    records: results
  });
});

module.exports = router;
