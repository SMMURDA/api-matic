# API-MATIC

<p align="center">
  <img src="screenshot/API-Matic-1.jpg" alt="Screenshot 1" width="45%" style="margin-right: 10px;">
  <img src="screenshot/API-Matic-2.jpg" alt="Screenshot 2" width="45%">
</p>

**API-MATIC** is a simple public API collection for tasks like video embedding, domain WHOIS lookup, URL shortening, IP geolocation, and generating fake user data.

## Endpoints

| Endpoint           | Method | Description                                       | Example Usage                                                                 |
|--------------------|--------|---------------------------------------------------|--------------------------------------------------------------------------------|
| `/api/embed`       | GET    | Extract video metadata from supported sites       | `/api/embed?url=https://www.p*rnh*b.com/view_video.php?viewkey=ph5e3c2f8d9148d` |
| `/api/whois`       | GET    | Fetch WHOIS information for a domain              | `/api/whois?url=https://example.com`                                          |
| `/api/shorten`     | GET    | Shorten a long URL using Bitly                    | `/api/shorten?url=https://example.com`                                        |
| `/api/randomuser`  | GET    | Generate a random fake user profile               | `/api/randomuser`                                                             |
| `/api/iplocator`   | GET    | Get detailed geolocation info from an IP address  | `/api/iplocator?ip=8.8.8.8`                                                   |

## Notes

- Bitly shortening requires API key configuration in `.env`
- Video embedding supports limited domains:
  - `*videos.com`
  - `xn*x.com`
  - `p*rnh*b.com`
- Ensure all URLs or IPs are valid and publicly accessible
