import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
const [,, listFile, outDir, width='1440'] = process.argv;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new','--remote-debugging-port=9333','--user-data-dir=/tmp/cdp-prof','--hide-scrollbars','about:blank'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,6000));
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json();
const ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.onopen=r);
let id=0; const pend=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.result?.value;
const extract = readFileSync(new URL('./extract.js', import.meta.url),'utf8');
const pages = JSON.parse(readFileSync(listFile,'utf8'));
const mobile = +width < 500;
for (const [name,url] of pages) {
  await send('Emulation.setDeviceMetricsOverride',{width:+width,height:900,deviceScaleFactor:1,mobile});
  await send('Page.navigate',{url});
  await new Promise(r=>setTimeout(r,4000));
  // scroll through to trigger lazy images + entrance animations
  await ev(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);document.querySelectorAll('.elementor-invisible').forEach(e=>e.classList.remove('elementor-invisible'));await new Promise(r=>setTimeout(r,800));})()`);
  const h = await ev('document.documentElement.scrollHeight');
  { const data = await ev(extract); writeFileSync(`${outDir}/${name}${mobile?'-m':''}.json`, data); }
  // screenshot in slices (full-page capture can be huge); capped at 14000px
  const H=Math.min(h,14000);
  const shot = await send('Page.captureScreenshot',{format:'jpeg',quality:60,captureBeyondViewport:true,clip:{x:0,y:0,width:+width,height:H,scale:1}});
  writeFileSync(`${outDir}/${name}${mobile?'-m':''}.jpg`, Buffer.from(shot.result.data,'base64'));
  console.log(name,h);
}
chrome.kill(); process.exit(0);
