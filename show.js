
const params=new URLSearchParams(location.search);
const SHOW_ID=Number(params.get("id")||123);
let episodes=[], show=null, watched=TVT.getProgress(SHOW_ID);
const seasonsEl=document.querySelector("#seasons");

function updateStats(){
  const regular=episodes.filter(e=>e.season&&e.number);
  const aired=regular.filter(TVT.isAired);
  const upcoming=regular.filter(e=>!TVT.isAired(e));
  const done=aired.filter(e=>watched[String(e.id)]).length;
  const pct=aired.length?Math.round(done/aired.length*100):0;
  document.querySelector("#episodeStat").textContent=`${done} / ${aired.length} aired episodes`;
  document.querySelector("#percentStat").textContent=done===aired.length&&aired.length?"Caught up!":`${pct}% caught up`;
  document.querySelector("#progressBar").style.width=`${pct}%`;
  const remaining=aired.filter(e=>!watched[String(e.id)]).reduce((s,e)=>s+(e.runtime||0),0);
  document.querySelector("#timeStat").textContent=remaining?`${TVT.formatMinutes(remaining)} remaining`:"";
  const next=aired.find(e=>!watched[String(e.id)]);
  const nextUpcoming=upcoming[0];
  document.querySelector("#nextBox").innerHTML=next
    ? `<strong>Up next</strong><span>S${next.season}E${next.number} · ${next.name}</span>`
    : nextUpcoming
      ? `<strong>You're caught up!</strong><span>Next announced episode: S${nextUpcoming.season}E${nextUpcoming.number} · ${nextUpcoming.name}${nextUpcoming.airdate?` · airs ${nextUpcoming.airdate}`:""}</span>`
      : `<strong>Complete!</strong><span>You've watched every aired episode.</span>`;
  document.querySelectorAll(".season").forEach(section=>{
    const sn=Number(section.dataset.season), eps=aired.filter(e=>e.season===sn);
    const checked=eps.filter(e=>watched[String(e.id)]).length;
    const future=upcoming.filter(e=>e.season===sn).length;
    section.querySelector(".season-count").textContent=`${checked} / ${eps.length} watched${future?` · ${future} upcoming`:""}`;
  });
}

function applyFilters(){
  const term=document.querySelector("#episodeSearch").value.trim().toLowerCase();
  const filter=document.querySelector("#filter").value;
  document.querySelectorAll(".episode").forEach(row=>{
    const watchedRow=row.dataset.watched==="true", upcoming=row.dataset.upcoming==="true";
    const text=row.dataset.search.includes(term);
    const match=filter==="all"||(filter==="watched"&&watchedRow)||(filter==="unwatched"&&!watchedRow&&!upcoming)||(filter==="upcoming"&&upcoming);
    row.classList.toggle("hidden",!(text&&match));
  });
  document.querySelectorAll(".season").forEach(section=>{
    const any=[...section.querySelectorAll(".episode")].some(r=>!r.classList.contains("hidden"));
    section.classList.toggle("hidden",!any);
  });
}

function render(){
  seasonsEl.innerHTML="";
  const grouped={};
  episodes.filter(e=>e.season&&e.number).forEach(ep=>(grouped[ep.season]||=[]).push(ep));
  Object.entries(grouped).forEach(([sn,eps])=>{
    const section=document.createElement("section"); section.className="season"; section.dataset.season=sn;
    const header=document.createElement("div"); header.className="season-header";
    header.innerHTML=`<div class="season-title">Season ${sn}</div><div class="season-count"></div>`;
    const body=document.createElement("div"); body.className="episodes";
    eps.forEach(ep=>{
      const aired=TVT.isAired(ep), checked=!!watched[String(ep.id)];
      const row=document.createElement("label");
      row.className="episode"+(checked?" watched":"")+(!aired?" upcoming":"");
      row.dataset.watched=checked?"true":"false"; row.dataset.upcoming=aired?"false":"true";
      row.dataset.search=`season ${ep.season} episode ${ep.number} s${ep.season}e${ep.number} ${ep.name}`.toLowerCase();
      row.innerHTML=`
        <input type="checkbox" ${checked?"checked":""} ${aired?"":"disabled"}>
        <span class="epnum">S${String(ep.season).padStart(2,"0")}E${String(ep.number).padStart(2,"0")}</span>
        <span class="epname">${ep.name}</span>
        <span class="runtime">${aired?(ep.runtime?ep.runtime+" min":""):(ep.airdate?"Airs "+ep.airdate:"Upcoming")}</span>`;
      const box=row.querySelector("input");
      box.addEventListener("change",()=>{
        if(box.checked) watched[String(ep.id)]=true; else delete watched[String(ep.id)];
        row.dataset.watched=box.checked?"true":"false"; row.classList.toggle("watched",box.checked);
        TVT.saveProgress(SHOW_ID,watched); updateStats(); applyFilters();
      });
      body.appendChild(row);
    });
    header.addEventListener("click",()=>body.classList.toggle("hidden"));
    section.append(header,body); seasonsEl.appendChild(section);
  });
  updateStats();
}

async function init(){
  try{
    const [sr,er]=await Promise.all([
      fetch(`https://api.tvmaze.com/shows/${SHOW_ID}`),
      fetch(`https://api.tvmaze.com/shows/${SHOW_ID}/episodes`)
    ]);
    if(!sr.ok||!er.ok) throw new Error();
    show=await sr.json(); episodes=await er.json();
    document.title=`${show.name} · My TV Tracker`;
    document.querySelector("#showTitle").textContent=show.name;
    const years=`${show.premiered?.slice(0,4)||""}${show.ended?`–${show.ended.slice(0,4)}`:""}`;
    const seasons=new Set(episodes.filter(e=>e.season).map(e=>e.season)).size;
    document.querySelector("#showMeta").textContent=`${years}${years?" · ":""}${seasons} season${seasons===1?"":"s"}`;
    const poster=document.querySelector("#poster");
    if(show.image?.medium){poster.src=show.image.medium;poster.alt=`${show.name} poster`} else poster.style.display="none";
    render();
  }catch{
    seasonsEl.innerHTML='<div class="error">I couldn’t load this show. Check your connection and refresh.</div>';
  }
}
document.querySelector("#episodeSearch").addEventListener("input",applyFilters);
document.querySelector("#filter").addEventListener("change",applyFilters);
document.querySelector("#expandAll").addEventListener("click",()=>document.querySelectorAll(".episodes").forEach(e=>e.classList.remove("hidden")));
document.querySelector("#collapseAll").addEventListener("click",()=>document.querySelectorAll(".episodes").forEach(e=>e.classList.add("hidden")));
document.querySelector("#removeShow").style.display="none";
init();
