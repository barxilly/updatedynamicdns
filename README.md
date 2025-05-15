# UpdateDynamicDNS

A Node.js script to automatically update a Cloudflare-managed domain's DNS A record with your current public IP address (ideal for dynamic home internet connections).

> [!IMPORTANT]
> This script is for Cloudflare-managed domains only. If your DNS is with another provider, you can transfer your domain's nameservers to Cloudflare for free.

---

## Features

- Detects your current public IP address
- Checks if your DNS A record matches your public IP
- Updates the DNS record via Cloudflare API if needed
- Supports multiple domains/zones
- Logs status and errors with colored output
- Designed for easy automation (e.g., with pm2 or cron)

---

## Prerequisites

- Node.js (v16+ recommended)
- [yarn](https://yarnpkg.com/) or npm
- A Cloudflare account
- A Cloudflare API token with:
  - **Zone:Read**
  - **DNS:Edit**
- Your Cloudflare **Zone ID** and **Domain name(s)**

---

## Installation

1. **Clone this repository:**
   ```bash
   git clone https://github.com/yourusername/UpdateDynamicDNS.git
   cd UpdateDynamicDNS
   ```

2. **Install dependencies:**
   ```bash
   yarn
   # or
   npm install
   ```

3. **Create a `.env` file in the root directory:**
   ```env
   CLOUDFLARE_API_KEY=your-api-token
   ZONE=your-zone-id
   DOMAIN=your-domain.com
   # (Optional) For a second domain:
   ZONE2=your-second-zone-id
   DOMAIN2=your-second-domain.com
   ACCOUNT=your-cloudflare-account-id
   ```

   - `CLOUDFLARE_API_KEY`: Your Cloudflare API token  
   - `ZONE`: Zone ID for your domain  
   - `DOMAIN`: The domain/subdomain to update  
   - `ZONE2`/`DOMAIN2`: (Optional) Second domain support  
   - `ACCOUNT`: Your Cloudflare account ID (required for API key verification)

4. **Run the script:**
   ```bash
   yarn start
   # or
   npm start
   ```

---

## Automation

To run the script at regular intervals, use [pm2](https://pm2.keymetrics.io/) or a cron job.

**With pm2:**
```bash
pm2 start yarn --name update-dynamic-dns -- start
pm2 startup
pm2 save
```

---

## Troubleshooting

- Ensure your API token has the correct permissions.
- Double-check your `.env` values (especially `ZONE`, `DOMAIN`, and `ACCOUNT`).
- Check the console output for error messages.

---

## License

[ZLIB](LICENSE)