(()=>{
// 手風琴（toggle）收合中的內文原本是 display:none：先記下哪些原本展開，再強制全部展開才抓得到內文
document.querySelectorAll('.elementor-tab-content').forEach(e=>{if(getComputedStyle(e).display!=='none')e.dataset.open='1'});
{const st=document.createElement('style');st.textContent='.elementor-tab-content{display:block!important}';document.head.appendChild(st)}
const root=document.querySelector('[data-elementor-type="wp-page"]')||document.querySelector('main')||document.body;
const KEEP=['display','flex-direction','flex-wrap','justify-content','align-items','align-content','row-gap','column-gap','flex-grow','flex-shrink','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','background-color','background-size','background-position','background-repeat','border-top','border-right','border-bottom','border-left','border-radius','box-shadow','opacity','position','overflow','text-align','color','font-size','font-weight','font-family','font-style','line-height','letter-spacing','text-transform','text-decoration-line','grid-template-columns','object-fit','aspect-ratio','top','right','bottom','left','z-index','transform','mix-blend-mode','background-blend-mode','filter','backdrop-filter','flex-basis','align-self','order','justify-self','white-space','text-shadow','background-attachment','list-style-type','vertical-align','word-break','grid-template-rows','justify-items','place-items'];
const INH=new Set(['text-align','color','font-size','font-weight','font-family','font-style','line-height','letter-spacing','text-transform']);
const DEF={'display':'block','flex-direction':'row','flex-wrap':'nowrap','justify-content':'normal','align-items':'normal','align-content':'normal','row-gap':'normal','column-gap':'normal','flex-grow':'0','flex-shrink':'1','padding-top':'0px','padding-right':'0px','padding-bottom':'0px','padding-left':'0px','margin-top':'0px','margin-right':'0px','margin-bottom':'0px','margin-left':'0px','background-color':'rgba(0, 0, 0, 0)','background-size':'auto','background-position':'0% 0%','background-repeat':'repeat','border-radius':'0px','box-shadow':'none','opacity':'1','position':'static','overflow':'visible','text-decoration-line':'none','grid-template-columns':'none','object-fit':'fill','top':'auto','right':'auto','bottom':'auto','left':'auto','z-index':'auto','transform':'none','mix-blend-mode':'normal','background-blend-mode':'normal','filter':'none','backdrop-filter':'none','flex-basis':'auto','align-self':'auto','order':'0','justify-self':'auto','white-space':'normal','text-shadow':'none','background-attachment':'scroll','list-style-type':'disc','vertical-align':'baseline','word-break':'normal','grid-template-rows':'none','justify-items':'legacy','place-items':'normal','aspect-ratio':'auto','font-style':'normal','text-transform':'none'};
const SKIP=new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','LINK','META','SVG','PATH']);
const abs=u=>{try{return new URL(u,location.href).href}catch(e){return u}};
function vis(el){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return false;if(el.closest('.swiper-slide-duplicate'))return false;if(cs.opacity==='0'&&!el.closest('.elementor-widget-image'))return false;return true}
function bg(cs){const m=cs.backgroundImage;if(!m||m==='none')return null;const u=[...m.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(x=>abs(x[1]));return {urls:u,grad:/gradient/.test(m)?m:null}}
function walk(el,par){
 if(SKIP.has(el.tagName.toUpperCase())||!vis(el))return null;
 const cs=getComputedStyle(el),pcs=par?getComputedStyle(par):null,r=el.getBoundingClientRect();
 const n={t:el.tagName.toLowerCase()};
 if(el.className&&typeof el.className==='string'){const c=el.className.split(/\s+/).filter(x=>/^elementor-widget-|^elementor-heading|^elementor-button|^elementor-icon-list|^elementor-accordion|^elementor-tab|^e-con|^swiper|^elementor-image-carousel|^elementor-testimonial/.test(x));if(c.length)n.cls=c.join(' ')}
 const s={};
 for(const k of KEEP){const v=cs.getPropertyValue(k);if(!v)continue;if(INH.has(k)){if(!pcs||pcs.getPropertyValue(k)!==v)s[k]=v}else if(DEF[k]!==v)s[k]=v}
 const b=bg(cs);if(b){if(b.urls.length)n.bgImg=b.urls[0];if(b.grad)s['background-image']=b.grad}
 // sizes
 const pr=par?par.getBoundingClientRect():{width:innerWidth};
 if(n.t!=='img'&&n.t!=='span'&&n.t!=='a'||cs.display!=='inline'){s.w=Math.round(r.width);s.h=Math.round(r.height);s.pw=Math.round(pr.width)}
 if(cs.maxWidth!=='none')s['max-width']=cs.maxWidth;
 if(cs.minHeight!=='0px'&&cs.minHeight!=='auto')s['min-height']=cs.minHeight;
 n.s=s;
 if(el.dataset&&el.dataset.open)n.open=1;
 for(const [ps,key] of [['::before','pb'],['::after','pa']]){const q=getComputedStyle(el,ps);if(q.content!=='none'&&q.content!=='normal'&&q.display!=='none'&&q.position==='absolute'){const bgc=q.backgroundColor,bgi=q.backgroundImage;if(bgc!=='rgba(0, 0, 0, 0)'||bgi!=='none'){n[key]={bg:bgc,img:bgi!=='none'?bgi:null,op:q.opacity,blend:q.mixBlendMode,br:q.borderRadius,w:q.width,h:q.height,top:q.top,left:q.left,right:q.right,bottom:q.bottom,size:q.backgroundSize,pos:q.backgroundPosition,rep:q.backgroundRepeat}}}}
 if(n.t==='img'){n.src=abs(el.currentSrc||el.getAttribute('data-src')||el.src);n.alt=el.alt;n.nw=Math.round(r.width);n.nh=Math.round(r.height);return n}
 if(n.t==='a'){n.href=el.href}
 if(n.t==='iframe'){n.src=el.src||el.getAttribute('data-src');return n}
 if(n.t==='video'){n.src=el.currentSrc||el.src;n.poster=el.poster;return n}
 if(n.t==='svg'){n.svg=el.outerHTML.slice(0,3000);return n}
 const kids=[];
 for(const c of el.childNodes){
  if(c.nodeType===3){const t=c.textContent.replace(/\s+/g,' ');if(t.trim()||(kids.length&&t===' '))kids.push(t)}
  else if(c.nodeType===1){
   if(c.tagName.toLowerCase()==='svg'){ if(vis(c)){const rr=c.getBoundingClientRect();const cl=c.cloneNode(true);const src=[c,...c.querySelectorAll('*')],dst=[cl,...cl.querySelectorAll('*')];src.forEach((e,i)=>{const q=getComputedStyle(e);if(i>0){dst[i].setAttribute('fill',q.fill);if(q.stroke!=='none')dst[i].setAttribute('stroke',q.stroke)};dst[i].removeAttribute('class')});kids.push({t:'svg',svg:cl.outerHTML.replace(/\s+/g,' ').slice(0,6000),s:{w:Math.round(rr.width),h:Math.round(rr.height),color:getComputedStyle(c).color,fill:getComputedStyle(c).fill}})} continue}
   const k=walk(c,el);if(k)kids.push(k)}
 }
 if(kids.length)n.c=kids;
 // pseudo bg on empty containers
 return n;
}
const out=walk(root,null);const ft=document.querySelector('footer,#colophon,[data-elementor-type=footer]');const fo=ft?walk(ft,null):null;
return JSON.stringify({title:document.title,desc:document.querySelector('meta[name=description]')?.content||'',og:document.querySelector('meta[property="og:image"]')?.content||'',h:document.documentElement.scrollHeight,tree:out,footer:fo});
})()
