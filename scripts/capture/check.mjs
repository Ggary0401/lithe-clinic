import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const pages = JSON.parse(readFileSync(fileURLToPath(new URL('../../content/pages.json', import.meta.url)),'utf8'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9335','--user-data-dir=/tmp/cdp-prof3','about:blank'],{stdio:'ignore'});
let tabs; for(let i=0;i<40;i++){ try{ tabs=await (await fetch('http://127.0.0.1:9335/json')).json(); break }catch{ await new Promise(r=>setTimeout(r,500)) } }
const ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pend=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>(await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const bad=[]; const links=new Set();
for (const W of [375, 800, 1440]) {
  await send('Emulation.setDeviceMetricsOverride',{width:W,height:800,deviceScaleFactor:1,mobile:W<500});
  for (const p of pages) {
    const url='http://localhost:4173/'+p.path.split('/').map(encodeURIComponent).join('/')+(p.path?'/':'');
    await send('Page.navigate',{url}); await sleep(1200);
    const r = await ev(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,40))}await new Promise(r=>setTimeout(r,500));
      const imgs=[...document.querySelectorAll('img')].filter(i=>i.offsetParent!==null||i.getClientRects().length);
      return JSON.stringify({sw:document.documentElement.scrollWidth,iw:innerWidth,broken:imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))})})()`);
    const d=JSON.parse(r);
    if (d.sw>d.iw+1) bad.push(`${W} ${p.path||'/'} 橫向捲軸 sw=${d.sw}`);
    if (d.broken.length) bad.push(`${W} ${p.path||'/'} 破圖 ${d.broken.slice(0,3).join(' ')}`);
    if (W===1440) d.links.forEach(l=>links.add(l));
  }
}
// 站內連結
const have=new Set(pages.map(p=>'/'+p.path.split('/').map(encodeURIComponent).join('/')+(p.path?'/':'')));
const missing=[...links].filter(l=>l.startsWith('/')&&!l.startsWith('//')).map(l=>l.split('#')[0]).filter(l=>l&&!have.has(l));
console.log('問題：',bad.length?bad.join('\n'):'無'); console.log('失效站內連結：',[...new Set(missing)].join(', ')||'無');
console.log('外部連結：',[...links].filter(l=>/^https?:|^mailto|^tel/.test(l)).join('\n'));
chrome.kill(); process.exit(0);
