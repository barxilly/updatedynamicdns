# UpdateDynamicDNS

Script to update a Cloudflare-managed domain with a dynamic IP address (e.g. from a home internet connection).

> [!IMPORTANT]
> This script is intended for Cloudflare-managed domains only. If you are using a different DNS provider, you can transfer your domain's nameservers to Cloudflare for free.

## Prerequisites

- Node.js
- yarn
- A Cloudflare account
- A Cloudflare API token with the following permissions:
  - Zone:Read
  - DNS:Edit

## Installation

1. Clone this repository
2. Run:

```bash
yarn
```

3. Create a `.env` file in the root directory with the following content:

```text
CLOUDFLARE_API_TOKEN=your-api-token
ZONE=your-zone-id
DOMAIN=your-domain
```

4. Run the script:

```bash
yarn start
```

5. (Optional) Set up pm2 to run the script at regular intervals. _Requires pm2 to be installed globally._

```bash
pm2 start yarn --name update-dynamic-dns -- start
pm2 startup
pm2 save
```

## License

[ZLIB](LICENSE)
