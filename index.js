import dns from "dns";
import chalk from "chalk";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

// Logging helper
function log(level, color, message) {
  const now = new Date();
  const time = now.toTimeString().split(" ")[0];
  const pad = (str, len = 8) => (str + " ".repeat(len)).slice(0, len);
  console.log(
    chalk[color](`[${pad(level.toUpperCase())}${time}]`) +
      chalk.reset(" ") +
      message
  );
}

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
  // Test internet connection
  

  const getPublicIP = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return false;
    }
  };

  let publicIP = await getPublicIP();
  if (publicIP == false) {
    log("ERROR", "red", "Could not fetch public IP");
    return;
  }
  log("INFO", "blue", `Public IP for ${edomain}: ${publicIP}`);

  let prodDNS = await new Promise((resolve, reject) => {
    dns.resolve4(edomain, (err, addresses) => {
      if (err) reject(err);
      resolve(addresses);
    });
  });
  log("INFO", "blue", `DNS A Record: ${prodDNS[0]}`);

  if (publicIP === prodDNS[0]) {
    log("INFO", "green", "Public IP and DNS match");
  } else {
    log("WARNING", "yellow", "Public IP and DNS do not match");

    const apiKey = eapi;
    if (!(await verifyKey(apiKey))) {
      log("ERROR", "red", "Invalid API Key");
      return;
    } else {
      log("INFO", "green", "Valid API Key");
    }

    const listURL = `https://api.cloudflare.com/client/v4/zones/${ezone}/dns_records`;
    const listHeaders = {
      Authorization: `Bearer ${apiKey}`,
    };
    const listResponse = await axios.get(listURL, { headers: listHeaders });

    for (let record of listResponse.data.result) {
      if (record.name === edomain && record.type === "A") {
        log("INFO", "blue", `Cloudflare DNS A Record: ${record.content}`);
        if (record.content !== publicIP) {
          log("WARNING", "yellow", "Updating DNS Record");
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
          log("INFO", "green", "DNS Record Updated");
        } else {
          log(
            "INFO",
            "green",
            "DNS Record is already up to date. Please wait for DNS propagation."
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
  const testInternet = async () => {
    try {
      await axios.get("https://one.one.one.one");
      return true;
    } catch (error) {
      return false;
    }
  };

  const internet = await testInternet();
  if (!internet) {
    log("ERROR", "red", "Internet is not reachable");
    return;
  }
  log("INFO", "green", "Internet is reachable");


  if (!(await verifyKey(process.env.CLOUDFLARE_API_KEY))) {
    log("ERROR", "red", "Invalid API Key");
    throw new Error("Invalid API Key");
  } else {
    log("INFO", "green", "Valid API Key");
  }

  await dnse(
    process.env.DOMAIN,
    process.env.ZONE,
    process.env.CLOUDFLARE_API_KEY
  );

  await dnse(
    process.env.DOMAIN2,
    process.env.ZONE2,
    process.env.CLOUDFLARE_API_KEY
  );
}

main();

setInterval(main, 300000);