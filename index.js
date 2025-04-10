/*const dns = require("dns");
const chalk = require("chalk");*/

import dns from "dns";
import chalk from "chalk";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

async function verifyKey(apiKey) {
  const url = "https://api.cloudflare.com/client/v4/user/tokens/verify";
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

async function dnse(edomain,ezone,eapi){
  try {
    // Get Public IP
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
    console.log(chalk.blue("Public IP:"), publicIP);

    // Get A Records for play.divergence.live
    let prodDNS = await new Promise((resolve, reject) => {
      dns.resolve4(edomain, (err, addresses) => {
        if (err) reject(err);
        resolve(addresses);
      });
    });
    console.log(chalk.blue("DNS A Record:"), prodDNS[0]);

    if (publicIP === prodDNS[0]) {
      console.log(chalk.green("Public IP and DNS match"));
    } else {
      console.log(chalk.yellow("Public IP and DNS do not match"));
      const apiKey = eapi;
      if (!(await verifyKey(apiKey))) {
        console.error(chalk.red("Invalid API Key"));
        return;
      } else {
        console.log(chalk.green("Valid API Key"));
      }
      // List DNS Records
      const listURL = `https://api.cloudflare.com/client/v4/zones/${ezone}/dns_records`;
      const listHeaders = {
        Authorization: `Bearer ${apiKey}`,
      };
      const listResponse = await axios.get(listURL, { headers: listHeaders });
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
            const updateResponse = await axios.put(updateURL, updateData, {
              headers: updateHeaders,
            });
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
  } catch (error) {
    console.log(chalk.red(error));
    return;
  }
}

async function main() {
  dnse(
    process.env.DOMAIN,
    process.env.ZONE,
    process.env.CLOUDFLARE_API_KEY
  );
}

main();
// Check once every 5 minutes
setInterval(main, 300000);
