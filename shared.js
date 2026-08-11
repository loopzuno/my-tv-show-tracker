
const TVT = {
  progressKey(id){ return `my-personal-tv-tracker-progress-${id}-v1`; },

  SHARED_SHOWS: [
    { query:"The Leftovers", display:"The Leftovers" },
    { query:"Riverdale", display:"Riverdale" },
    { query:"Supernatural", display:"Supernatural" },
    { query:"Squid Game", display:"Squid Game" },
    { query:"Silo", display:"Silo" },
    { query:"Hannibal", display:"Hannibal" },
    { query:"Fargo", display:"Fargo" },
    { query:"For All Mankind", display:"For All Mankind" },
    { query:"The Bear", display:"The Bear" },
    { query:"The Umbrella Academy", display:"The Umbrella Academy" },
    { query:"Peaky Blinders", display:"Peaky Blinders" },
    { query:"Yellowjackets", display:"Yellowjackets" },
    { query:"The X-Files", display:"The X-Files" },
    { query:"Archer", display:"Archer" },
    { query:"Murderbot", display:"Murderbot" },
    { query:"Andor", display:"Andor" },
    { query:"You", display:"You" },
    { query:"Alice in Borderland", display:"Alice in Borderland" },
    { query:"Abbott Elementary", display:"Abbott Elementary" },
    { query:"Doctor Who", display:"Doctor Who", qualifier:"2005" },
    { query:"Sex Education", display:"Sex Education" },
    { query:"Future Man", display:"Future Man" },
    { query:"American Horror Story", display:"American Horror Story" },
    { query:"Game of Thrones", display:"Game of Thrones" },
    { query:"Party Down", display:"Party Down" },
  ],

  getProgress(id){
    return JSON.parse(localStorage.getItem(this.progressKey(id)) || "{}");
  },
  saveProgress(id,p){
    localStorage.setItem(this.progressKey(id),JSON.stringify(p));
  },
  isAired(ep){
    if(!ep.airdate) return true;
    const today=new Date(); today.setHours(23,59,59,999);
    return new Date(ep.airdate+"T00:00:00")<=today;
  },
  formatMinutes(mins){
    const h=Math.floor(mins/60),m=mins%60;
    return h?`${h}h ${m}m`:`${m}m`;
  }
};
