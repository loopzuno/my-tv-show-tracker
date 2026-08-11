
const grid=document.querySelector("#showGrid");
let summaries=[];
let currentSort="manual";

function looksLikeIntendedShow(config, show){
  if(!config.qualifier) return true;
  const haystack=[
    show.premiered, show.ended, show.name,
    show.network?.name, show.webChannel?.name, show.officialSite,
    ...(show.genres||[])
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(config.qualifier.toLowerCase());
}

async function resolveShow(config){
  const r=await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(config.query)}&embed=episodes`);
  if(!r.ok) throw new Error(`Could not resolve ${config.display}`);
  let show=await r.json();

  if(config.qualifier && !looksLikeIntendedShow(config,show)){
    const sr=await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(config.query)}`);
    if(sr.ok){
      const options=await sr.json();
      const found=options.map(x=>x.show).find(s=>looksLikeIntendedShow(config,s));
      if(found){
        const full=await fetch(`https://api.tvmaze.com/shows/${found.id}?embed=episodes`);
        if(full.ok) show=await full.json();
      }
    }
  }

  return {config,show,episodes:show._embedded?.episodes||[]};
}

async function loadLibrary(){
  grid.innerHTML='<div class="loading">Loading your library…</div>';
  const items=[];

  for(let i=0;i<TVT.SHARED_SHOWS.length;i+=5){
    const batch=TVT.SHARED_SHOWS.slice(i,i+5);
    const done=await Promise.all(batch.map(async config=>{
      try{return await resolveShow(config)}
      catch{return {config,show:null,episodes:[],failed:true}}
    }));
    items.push(...done);
    if(i+5<TVT.SHARED_SHOWS.length) await new Promise(r=>setTimeout(r,350));
  }

  summaries=items.map(({config,show,episodes,failed})=>{
    if(failed||!show) return {config,failed:true};

    const tracked=TVT.filterTrackedEpisodes(episodes,config);
    const aired=tracked.filter(TVT.isAired);
    const p=TVT.getProgress(show.id);
    const done=aired.filter(e=>p[String(e.id)]).length;

    return {config,show,aired,done,total:aired.length};
  });

  renderLibrary();
}

function sortedSummaries(){
  const arr=[...summaries];

  if(currentSort==="manual") return arr;

  return arr.sort((a,b)=>{
    if(a.failed && !b.failed) return 1;
    if(!a.failed && b.failed) return -1;
    if(a.failed && b.failed) return a.config.display.localeCompare(b.config.display);

    const aPct=a.total ? a.done/a.total : 0;
    const bPct=b.total ? b.done/b.total : 0;
    const aLeft=Math.max(0,a.total-a.done);
    const bLeft=Math.max(0,b.total-b.done);

    if(currentSort==="closest"){
      if(bPct!==aPct) return bPct-aPct;
      return aLeft-bLeft;
    }
    if(currentSort==="least"){
      if(aPct!==bPct) return aPct-bPct;
      return bLeft-aLeft;
    }
    if(currentSort==="fewest"){
      if(aLeft!==bLeft) return aLeft-bLeft;
      return bPct-aPct;
    }
    if(currentSort==="most"){
      if(bLeft!==aLeft) return bLeft-aLeft;
      return aPct-bPct;
    }
    if(currentSort==="az"){
      return a.show.name.localeCompare(b.show.name);
    }
    return 0;
  });
}

function renderLibrary(){
  grid.innerHTML="";

  sortedSummaries().forEach(s=>{
    if(s.failed){
      const card=document.createElement("div");
      card.className="show-card";
      card.innerHTML=`<div class="card-poster poster-fallback">${s.config.display}</div>
        <div class="card-body"><div class="card-title">${s.config.display}</div>
        <div class="card-meta">Could not load TV data</div></div>`;
      grid.appendChild(card);
      return;
    }

    const {show,done,total,config}=s;
    const pct=total?Math.round(done/total*100):0;
    const caught=total>0&&done===total;
    const left=Math.max(0,total-done);
    const tracking=config.startSeason?` · from S${config.startSeason}`:"";

    const a=document.createElement("a");
    a.className="show-card";
    a.href=`show.html?id=${show.id}`;
    a.innerHTML=`
      ${show.image?.medium?`<img src="${show.image.medium}" alt="${show.name} poster">`:`<div class="card-poster poster-fallback">${show.name}</div>`}
      <div class="card-body">
        <div class="card-title">${show.name}</div>
        <div class="card-meta">${caught?"Caught up!":`${done} / ${total} aired episodes · ${pct}% · ${left} left`}${tracking}</div>
        <div class="card-progress"><span style="width:${pct}%"></span></div>
      </div>`;
    grid.appendChild(a);
  });

  document.querySelector("#libraryStats").textContent=`${TVT.SHARED_SHOWS.length} shows`;
}

function randomShow(){
  const out=document.querySelector("#randomResult");
  const usable=summaries.filter(s=>!s.failed&&s.total);
  if(!usable.length){out.textContent="The library is still loading.";return;}

  let pool=usable.filter(s=>s.done<s.total);
  if(!pool.length) pool=usable;

  const pick=pool[Math.floor(Math.random()*pool.length)];
  const p=TVT.getProgress(pick.show.id);
  const next=pick.aired.find(e=>!p[String(e.id)]);

  out.innerHTML=`🎲 <strong>${pick.show.name}</strong>${next?` — next up: S${next.season}E${next.number}, ${next.name}`:" — you're caught up!"} <a href="show.html?id=${pick.show.id}">Open tracker →</a>`;
}

document.querySelector("#randomBtn").addEventListener("click",randomShow);
document.querySelector("#sortShows").addEventListener("change",e=>{
  currentSort=e.target.value;
  renderLibrary();
});
loadLibrary();
