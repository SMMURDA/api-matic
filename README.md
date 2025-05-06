
# API-MATIC
![API-Matic Screenshot](screenshot/API-Matic-1.jpg)
![API-Matic Screenshot](screenshot/API-Matic-2.jpg)
API-MATIC is a simple public API collection for tasks like video embedding, domain WHOIS lookup, URL shortening, and generating fake user data.

## Endpoints

| Endpoint          | Method | Description                                      |
|-------------------|--------|--------------------------------------------------|
| `/api/embed`      | GET    | Extract video metadata from supported sites      |
| `/api/whois`      | GET    | Fetch WHOIS information for a domain             |
| `/api/shorten`    | GET    | Shorten a long URL using Bitly                   |
| `/api/randomuser` | GET    | Generate a random fake user profile              |

## Usage Examples

**Embed:**

- GET /api/embed?url=https://www.p*rnh*b.com/view_video.php?viewkey=ph5e3c2f8d9148d

> **Note:** The `/api/embed` endpoint currently supports limited sites like:
> - `*videos.com`
> - `xn*x.com`
> - `p*rnh*b.com`

**WHOIS:**

- GET /api/whois?url=https://example.com

**Shorten URL:**

- GET /api/shorten?url=https://example.com
> **Note:** The `/api/shorten` needed apikey on bitly:
> - `change .env`

**Random User:**

- GET /api/randomuser

## Notes

- Required API for Shorten (bitly) change on '.env'
- Video embed only works with specific domains.
- Make sure URLs are valid and accessible.
