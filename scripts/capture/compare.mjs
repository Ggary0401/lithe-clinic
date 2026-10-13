// node compare.mjs <path> [width] [maxRows] → cmp/<name>.jpg（左：原站，右：本機）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const [,, path='/', width='1440', maxRows='6'] = process.argv;
const W=+width, H= W<500?812:900;
const name = (path.replace(/[^\w-]/g,'_')||'home')+'_'+W;
const dir = new URL('../../.cmp/', import.meta.url).pathname; mkdirSync(dir,{recursive:true});
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=9334','--user-data-dir=/tmp/cdp-prof2','--hide-scrollbars','about:blank'],{stdio:'ignore'});
let tabs; for(let i=0;i<40;i++){ try{ tabs=await (await fetch('http://127.0.0.1:9334/json')).json(); break }catch{ await new Promise(r=>setTimeout(r,500)) } }
const ws = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pend=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>(await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true})).result?.result?.value;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sides=[['o','https://lithe-med.com'+path],['l','http://localhost:4173'+path]];
const shots={o:[],l:[]}; let heights={};
for(const [k,url] of sides){
  await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:1,mobile:W<500});
  await send('Page.navigate',{url}); await sleep(4000);
  await ev(`document.documentElement.style.scrollBehavior='auto'`);
  const h=await ev('document.documentElement.scrollHeight'); heights[k]=h;
  const rows=Math.min(+maxRows,Math.ceil(h/H));
  for(let r=0;r<rows;r++){
    await ev(`scrollTo(0,${r*H});0`); await sleep(1100);
    const s=await send('Page.captureScreenshot',{format:'jpeg',quality:55});
    const f=`${dir}${name}_${k}${r}.jpg`; writeFileSync(f,Buffer.from(s.result.data,'base64')); shots[k].push(f);
  }
}
const rows=Math.max(shots.o.length,shots.l.length);
const tw= W<500?190:560, th=Math.round(tw*H/W);
let html=`<body style="margin:0;background:#222;font:12px sans-serif;color:#fff"><div>orig h=${heights.o} | local h=${heights.l}</div><table style="border-collapse:collapse">`;
for(let r=0;r<rows;r++) html+=`<tr>${['o','l'].map(k=>`<td style="padding:2px">${shots[k][r]?`<img src="file://${shots[k][r]}" width="${tw}" height="${th}">`:''}</td>`).join('')}</tr>`;
html+='</table></body>';
const hp=dir+name+'.html'; writeFileSync(hp,html);
await send('Emulation.setDeviceMetricsOverride',{width:tw*2+20,height:100,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file://'+hp}); await sleep(1500);
const hh=await ev('document.documentElement.scrollHeight');
const s=await send('Page.captureScreenshot',{format:'jpeg',quality:70,captureBeyondViewport:true,clip:{x:0,y:0,width:tw*2+20,height:hh,scale:1}});
writeFileSync(dir+name+'.jpg',Buffer.from(s.result.data,'base64'));
console.log(dir+name+'.jpg',heights);
chrome.kill(); process.exit(0);
