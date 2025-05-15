// Import required modules
import dns from "dns";
import chalk from "chalk";
import dotenv from "dotenv";
import axios from "axios";

// Load environment variables from .env file
dotenv.config();

/**
 * Verifies the provided Cloudflare API key.
 * @param {string} apiKey - The API key to verify.
 * @returns {Promise<boolean>} - True if the key is valid, false otherwise.
 */
async function verifyKey(apiKey) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.ACCOUNT}/tokens/verify`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };
  try {
    const response = await axios.get(url, { headers });
    return response.data.success;
  } catch (error) {
    return false;
  }
}

/**
 * Checks and updates the DNS A record for a domain if it doesn't match the current public IP.
 * @param {string} edomain - The domain to check.
 * @param {string} ezone - The Cloudflare zone ID.
 * @param {string} eapi - The Cloudflare API key.
 */
async function dnse(edomain, ezone, eapi) {
  // Helper to get the current public IP address
  const getPublicIP = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error(chalk.red(error));
    }
  };

  // Get Public IP
  let publicIP = await getPublicIP();
  console.log(chalk.blue(`Public IP for ${edomain}:`), publicIP);

  // Get A Records for the domain
  let prodDNS = await new Promise((resolve, reject) => {
    dns.resolve4(edomain, (err, addresses) => {
      if (err) reject(err);
      resolve(addresses);
    });
  });
  console.log(chalk.blue("DNS A Record:"), prodDNS[0]);

  // Compare public IP with DNS A record
  if (publicIP === prodDNS[0]) {
    console.log(chalk.green("Public IP and DNS match"));
  } else {
    console.log(chalk.yellow("Public IP and DNS do not match"));

    // Verify API Key before making changes
    const apiKey = eapi;
    if (!(await verifyKey(apiKey))) {
      console.log(chalk.red("Invalid API Key"));
      return;
    } else {
      console.log(chalk.green("Valid API Key"));
    }

    // List DNS Records from Cloudflare
    const listURL = `https://api.cloudflare.com/client/v4/zones/${ezone}/dns_records`;
    const listHeaders = {
      Authorization: `Bearer ${apiKey}`,
    };
    const listResponse = await axios.get(listURL, { headers: listHeaders });

    // Find and update the A record if needed
    for (let record of listResponse.data.result) {
      if (record.name === edomain && record.type === "A") {
        console.log(chalk.blue("Cloudflare DNS A Record:"), record.content);
        if (record.content !== publicIP) {
          console.log(chalk.yellow("Updating DNS Record"));
          const updateURL = `https://api.cloudflare.com/client/v4/zones/${ezone}/dns_records/${record.id}`;
          const updateHeaders = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          };
          const updateData = {
            type: "A",
            name: edomain,
            content: publicIP,
            ttl: 1,
            proxied: false,
          };
          await axios.put(updateURL, updateData, { headers: updateHeaders });
          console.log(chalk.green("DNS Record Updated"));
        } else {
          console.log(
            chalk.green(
              "DNS Record is already up to date. Please wait for DNS propagation."
            )
          );
        }
      }
    }
  }
}

/**
 * Main function to verify API key and check/update DNS for configured domains.
 */
async function main() {
  // Verify API Key before proceeding
  if (!(await verifyKey(process.env.CLOUDFLARE_API_KEY))) {
    console.error(chalk.red("Invalid API Key"));
    throw new Error("Invalid API Key");
  } else {
    console.log(chalk.green("Valid API Key"));
  }

  // Check and update DNS for the first domain
  await dnse(
    process.env.DOMAIN,
    process.env.ZONE,
    process.env.CLOUDFLARE_API_KEY
  );

  // Check and update DNS for the second domain
  await dnse(
    process.env.DOMAIN2,
    process.env.ZONE2,
    process.env.CLOUDFLARE_API_KEY
  );
}

// Run main once at startup
main();

// Schedule main to run every 5 minutes
setInterval(main, 300000);
