/*const dns = require("dns");
const chalk = require("chalk");*/

import dns from "dns";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

async function main() {
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
    dns.resolve4(process.env.DOMAIN, (err, addresses) => {
      if (err) reject(err);
      resolve(addresses);
    });
  });
  console.log(chalk.blue("DNS A Record:"), prodDNS[0]);

  if (publicIP === prodDNS[0]) {
    console.log(chalk.green("Public IP and DNS match"));
  } else {
    console.log(chalk.yellow("Public IP and DNS do not match"));
    // Update DNS using Cloudflare API
    const apiKey = process.env.CLOUDFLARE_API_KEY;
  }
}

main();
