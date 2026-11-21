const topics=['AI','Tech','Apple'];
const sources=[
 {name:'The Verge',topic:'Tech',url:'https://www.theverge.com/rss/index.xml'},
 {name:'9to5Mac',topic:'Apple',url:'https://9to5mac.com/feed/'},
 {name:'MacRumors',topic:'Apple',url:'https://www.macrumors.com/macrumors.xml'},
 {name:'Ars Technica',topic:'Tech',url:'https://feeds.arstechnica.com/arstechnica/index'}
];
const activeSources = new Set(sources.map(source => source.name));
const storyRetentionMs = 7 * 24 * 60 * 60 * 1000;
const feedCacheKey = 'briefly-feed-cache';
const demo=[
 {title:'The next chapter of artificial intelligence is taking shape',topic:'AI',source:'The Verge',image:'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&q=85',url:'https://www.theverge.com/ai-artificial-intelligence'},
 {title:'A more considered look at the future of our devices',topic:'Apple',source:'9to5Mac',image:'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000&q=85',url:'https://9to5mac.com/'},
 {title:'What comes next for the iPhone',topic:'Apple',source:'MacRumors',image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=900&q=85',url:'https://www.macrumors.com/'},
 {title:'Inside the technology shaping tomorrow',topic:'Tech',source:'Ars Technica',image:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=85',url:'https://arstechnica.com/'},
 {title:'A quieter, smarter approach to everyday tools',topic:'Apple',source:'9to5Mac',image:'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9?w=900&q=85',url:'https://9to5mac.com/'},
 {title:'The stories behind the next wave of innovation',topic:'Tech',source:'The Verge',image:'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&q=85',url:'https://www.theverge.com/'}
].map(story => ({ ...story, timestamp: Date.now() }));
const key='briefly-settings';
const defaults={theme:'system',topics:Object.fromEntries(topics.map(t=>[t,true])),city:'',lat:null,lon:null,locationAsked:false};
let settings={...defaults,...JSON.parse(localStorage.getItem(key)||'{}')};settings.topics={...defaults.topics,...settings.topics};const legacyCity=['Your area','Your location'].includes(settings.city);if(legacyCity){settings.city='';localStorage.setItem(key,JSON.stringify(settings));}
let articles=demo,visible=6,mode='demo',observer,view='latest';
const readKey='briefly-read-stories',restoredKey='briefly-restored-stories';
const readMap=new Map(JSON.parse(localStorage.getItem(readKey)||'[]').map(a=>[storyId(a.url),a]));
const restoredMap=new Map(JSON.parse(localStorage.getItem(restoredKey)||'[]').map(a=>[storyId(a.url),a]));
const dismissedKey = 'briefly-dismissed-stories';
const dismissedMap = new Map(JSON.parse(localStorage.getItem(dismissedKey) || '[]')
  .map(article => [storyId(article.url), article]));

function isRecentStory(story, now = Date.now()) {
  return Number.isFinite(story.timestamp) && story.timestamp > 0 &&
    story.timestamp >= now - storyRetentionMs && story.timestamp <= now;
}

function pruneExpiredStories() {
  const now = Date.now();
  const recent = story => isRecentStory(story, now);
  const previousCount = articles.length;
  articles = articles.filter(recent);
  let changed = articles.length !== previousCount;

  for (const [storageKey, stories] of [
    [readKey, readMap], [restoredKey, restoredMap], [dismissedKey, dismissedMap],
  ]) {
    const size = stories.size;
    for (const [id, story] of stories) {
      if (!recent(story)) stories.delete(id);
    }
    if (stories.size !== size) {
      localStorage.setItem(storageKey, JSON.stringify([...stories.values()]));
      changed = true;
    }
  }

  const cache = JSON.parse(localStorage.getItem(feedCacheKey) || 'null');
  if (cache?.items?.length) {
    const items = cache.items.filter(recent);
    if (items.length !== cache.items.length) {
      if (items.length) localStorage.setItem(feedCacheKey, JSON.stringify({ ...cache, items }));
      else localStorage.removeItem(feedCacheKey);
    }
  }

  return changed;
}

function refreshStoryRetention() {
  if (pruneExpiredStories()) render();
}

function saveDismissedStories() {
  localStorage.setItem(dismissedKey, JSON.stringify([...dismissedMap.values()]));
}

function dismissStory(article) {
  const id = storyId(article.url);
  dismissedMap.set(id, { ...article, dismissedAt: Date.now() });
  saveDismissedStories();
  renderStories();
  ($('.story-dismiss') || $('[data-view="not-interested"]'))?.focus({ preventScroll: true });
}

function restoreDismissedStory(id) {
  const story = dismissedMap.get(id);
  if (!story) return;
  restoredMap.set(id, story);
  saveStoryState();
  dismissedMap.delete(id);
  saveDismissedStories();
  render();
  ($('[data-restore-dismissed]') || $('[data-view="not-interested"]'))?.focus();
}

function storyId(url){try{const u=new URL(url);u.hash='';for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))u.searchParams.delete(key);return u.href.replace(/\/$/,'');}catch{return url;}}
function saveStoryState(){localStorage.setItem(readKey,JSON.stringify([...readMap.values()]));localStorage.setItem(restoredKey,JSON.stringify([...restoredMap.values()]));}
function markRead(article){const id=storyId(article.url);readMap.set(id,{...article,readAt:Date.now()});restoredMap.delete(id);saveStoryState();}
function markUnread(id){const story=readMap.get(id);if(!story)return;readMap.delete(id);restoredMap.set(id,story);saveStoryState();render();}
function readStories(){return [...readMap.values()].sort((a,b)=>b.readAt-a.readAt);}
const weatherKey='briefly-weather-cache';
let weatherCache=JSON.parse(localStorage.getItem(weatherKey)||'null');
function weatherText(){return weatherCache&&weatherCache.lat===settings.lat&&weatherCache.lon===settings.lon?weatherCache.text:'';}
const $=s=>document.querySelector(s);
function save(){localStorage.setItem(key,JSON.stringify(settings));}
function theme(){document.documentElement.dataset.theme=settings.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):settings.theme;}
function dateText(){return new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric'}).format(new Date());}
const relativeStoryDate = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function storyDateLabel(timestamp, now = new Date()) {
  if (!Number.isFinite(timestamp) || timestamp === 0) return 'Date unavailable';
  const published = new Date(timestamp);
  if (!Number.isFinite(published.getTime())) return 'Date unavailable';
  // Compare local calendar dates without counting shortened or extended DST days.
  const calendarDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return relativeStoryDate.format((calendarDay(published) - calendarDay(now)) / 86_400_000, 'day');
}

function publicationTimestamp(item) {
  for (const field of ['published', 'pubDate']) {
    const value = item.querySelector(field)?.textContent?.trim();
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return null;
}

function card(a,i){return `<a class="card ${i===0?'hero':''} ${a.image?'':'no-image'}" href="${escapeHTML(a.url)}" data-story-url="${escapeHTML(a.url)}"><div class="photo" style="background-image:url('${escapeHTML(a.image||'')}')"></div><div class="shade"></div><div class="card-copy"><div class="eyebrow">${escapeHTML(a.topic)} <span>·</span> ${escapeHTML(a.source)}</div><h3>${escapeHTML(a.title)}</h3><div class="card-date">${escapeHTML(storyDateLabel(a.timestamp))}</div></div></a>`}
function latestCard(article, index) {
  return `<div class="story-tile ${index === 0 ? 'lead-tile' : ''}">
    ${card(article, index)}
    <button type="button" class="story-dismiss" data-dismiss-story="${escapeHTML(article.url)}"
      aria-label="Not interested: ${escapeHTML(article.title)}" title="Not interested">×</button>
  </div>`;
}

function escapeHTML(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function filtered(){const seen=new Set();return [...restoredMap.values(),...articles].filter(a=>{const id=storyId(a.url);if(seen.has(id)||readMap.has(id)||dismissedMap.has(id)||!activeSources.has(a.source)||!isRecentStory(a)||!settings.topics[a.topic])return false;seen.add(id);return true;});}
function featuredStories(){const all=filtered(),withImages=all.filter(a=>a.image);const top=withImages.slice(0,3);if(top.length<3)top.push(...all.filter(a=>!a.image).slice(0,3-top.length));return top;}
function remainingStories(){const topIds=new Set(featuredStories().map(a=>storyId(a.url)));return filtered().filter(a=>!topIds.has(storyId(a.url)));}
function featuredQuip(){
 const lead=featuredStories()[0];
 if(!lead)return '“The news is taking a day off. Your subjects can bring it back.”';
 const title=lead.title.toLowerCase();
 if(title.includes('serena williams'))return '“Serena’s latest serve comes with a term sheet.”';
 if(title.includes('james bond'))return '“The name’s Bond. The casting department has entered the chat.”';
 if(title.includes('chatgpt')&&title.includes('health'))return '“Your Mac may soon ask how you’re feeling.”';
 if(title.includes('iphone'))return '“The iPhone rumor mill has clocked in again.”';
 if(title.includes('google maps'))return '“Google Maps wants to plan the trip and call the shots.”';
 if(title.includes('ai chip'))return '“Even the chips are getting travel restrictions.”';
 const words=lead.title.replace(/[.!?]+$/,'').split(/\s+/);
 const short=words.slice(0,9).join(' ')+(words.length>9?'…':'');
 return `“Plot twist: ${short}.”`;
}
function viewTabs() {
  const tabs = [
    ['latest', 'Latest', ''],
    ['read', 'Read', `<span class="read-count">${readMap.size}</span>`],
    ['not-interested', 'Not interested', ''],
  ];
  return `<nav class="view-tabs" aria-label="Story views">${tabs.map(([id, label, count]) =>
    `<button type="button" data-view="${id}" class="view-tab ${view === id ? 'active' : ''}" aria-current="${view === id ? 'page' : 'false'}">${label} ${count}</button>`
  ).join('')}</nav>`;
}

function latestMarkup(){const top=featuredStories(),rest=remainingStories().slice(0,Math.max(0,visible-top.length));return `<div class="first-view"><div class="section-heading lead-heading"><div><h1>Featured <em>stories.</em></h1><span id="lead-quip" class="lead-quip">${escapeHTML(featuredQuip())}</span></div>${viewTabs()}</div><div class="featured">${top.map(latestCard).join('')||'<div class="empty">No unread stories in your selected subjects.</div>'}</div></div><div class="section-heading lower"><div><span class="section-index">02 / KEEP READING</span><h2>More to explore</h2></div><div class="pills">${topics.map(t=>`<span class="pill ${settings.topics[t]?'on':''}">${t}</span>`).join('')}</div></div><div id="feed" class="feed">${rest.map((a,i)=>latestCard(a,i+3)).join('')}</div><div id="sentinel"></div>`;}
function readMarkup(){const saved=readStories();return `<section class="archive-view"><div class="section-heading lead-heading"><div><span class="lead-quip">Stories you have opened</span><h1>Read <em>stories.</em></h1></div>${viewTabs()}</div>${saved.length?`<div class="read-grid">${saved.map(a=>`<div class="read-item">${card(a,3)}<button type="button" class="mark-unread" data-unread="${escapeHTML(storyId(a.url))}">Mark unread</button></div>`).join('')}</div>`:'<div class="archive-empty">Nothing here yet. Stories you open will appear in this tab.</div>'}</section>`;}
function dismissedMarkup() {
  const stories = [...dismissedMap.values()].sort((a, b) => b.dismissedAt - a.dismissedAt);
  return `<section class="archive-view">
    <div class="section-heading lead-heading"><h1>Not <em>interested.</em></h1>${viewTabs()}</div>
    ${stories.length ? `<div class="read-grid">${stories.map(story => `
      <div class="read-item">
        ${card(story, 3)}
        <button type="button" class="mark-unread" data-restore-dismissed="${escapeHTML(storyId(story.url))}">Restore to Latest</button>
      </div>`).join('')}</div>` : '<div class="archive-empty">Stories you mark as Not interested will appear here.</div>'}
  </section>`;
}

function renderStories(){if(view!=='latest')return;const all=filtered(),top=featuredStories(),rest=remainingStories().slice(0,Math.max(0,visible-top.length));const featured=$('.featured'),feed=$('#feed');if(!featured||!feed)return;featured.innerHTML=top.map(latestCard).join('')||'<div class="empty">No unread stories in your selected subjects.</div>';feed.innerHTML=rest.map((a,i)=>latestCard(a,i+3)).join('');const quip=$('#lead-quip');if(quip)quip.textContent=featuredQuip();const count=$('.read-count');if(count)count.textContent=readMap.size;document.querySelectorAll('.pill').forEach(p=>p.classList.toggle('on',!!settings.topics[p.textContent]));if(observer){observer.disconnect();if(visible<all.length)observer.observe($('#sentinel'));}}
function render(){pruneExpiredStories();const dialogWasOpen=$('#settings-dialog')?.open??false;theme();$('#app').innerHTML=`<div class="shell"><header><div class="brand-group"><a class="brand" href="#">briefly<span>.</span></a><span class="brand-tagline">Fresh takes, no filler.</span></div><div class="header-right"><span class="today">${dateText()}</span><span class="divider"></span><button id="weather" class="weather" title="Weather and location">${settings.city?escapeHTML(settings.city):'Set location'} <span id="weather-value">${weatherText()||(!settings.city?'☀️':'')}</span></button><button id="settings-btn" class="icon-btn" aria-label="Open settings">⚙</button></div></header><main>${view==='read'?readMarkup():view==='not-interested'?dismissedMarkup():latestMarkup()}<footer>Curated for your new tab <span>·</span> Stories open at their original source</footer></main></div><dialog id="settings-dialog"><div class="modal-head"><div><span class="section-index">MAKE IT YOURS</span><h2>Settings</h2></div><button type="button" id="close" class="icon-btn" aria-label="Close settings">×</button></div><div class="setting-group"><label>Appearance</label><div class="segment">${['light','dark','system'].map(t=>`<button data-theme="${t}" class="${settings.theme===t?'active':''}">${t}</button>`).join('')}</div></div><div class="setting-group"><label>Subjects in your feed</label>${topics.map(t=>`<div class="toggle-row"><span>${t}</span><button type="button" class="topic-switch" data-topic="${t}" role="switch" aria-label="Show ${t} news" aria-checked="${settings.topics[t]}"><span class="switch-thumb"></span></button></div>`).join('')}</div><div class="setting-group"><label>Weather location</label><p class="hint">Use your current location or choose a city.</p><button id="use-location" class="outline">Use current location</button><div class="city-input"><input id="city" placeholder="Enter a city" value="${escapeHTML(settings.city)}"><button id="save-city">Save</button></div><p id="location-note" class="hint"></p></div><div class="modal-foot">Preferences are saved on this browser.</div></dialog>`;
const dialog=$('#settings-dialog');if(dialogWasOpen)dialog.showModal();$('#settings-btn').onclick=()=>dialog.showModal();$('#weather').onclick=()=>dialog.showModal();$('#close').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{settings.theme=b.dataset.theme;save();render()});
document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{const topic=b.dataset.topic;settings.topics[topic]=!settings.topics[topic];b.setAttribute('aria-checked',String(settings.topics[topic]));save();renderStories()});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render();$('[data-view].active')?.focus({preventScroll:true});window.scrollTo({top:0});});
$('#use-location').onclick=useLocation;$('#save-city').onclick=saveCity;
observer?.disconnect();if(view==='latest'){observer=new IntersectionObserver(es=>{if(es[0].isIntersecting&&visible<filtered().length){visible+=6;renderStories();}}, {rootMargin:'500px'});observer.observe($('#sentinel'));}
}

async function useLocation(){const note=$('#location-note');if(note)note.textContent='Requesting location…';navigator.geolocation.getCurrentPosition(async p=>{const lat=p.coords.latitude,lon=p.coords.longitude;settings.lat=lat;settings.lon=lon;settings.locationAsked=true;settings.city='';save();await loadWeather(lat,lon);try{const r=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`);if(!r.ok)throw Error('City lookup failed');const place=await r.json();const city=(place.city||place.locality||'').trim();if(!city)throw Error('No city returned');settings.city=city;save();render();const currentNote=$('#location-note');if(currentNote)currentNote.textContent=`Using ${city}.`;}catch{if(note?.isConnected)note.textContent='Could not identify your city. Enter it below.';}},()=>{if(note)note.textContent='Location unavailable. Enter a city below.';},{timeout:10000});}
async function saveCity(){const name=$('#city').value.trim();if(!name)return;const note=$('#location-note');note.textContent='Looking up city…';try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);const d=await r.json();const c=d.results?.[0];if(!c)throw Error('City not found');settings.city=c.name;settings.lat=c.latitude;settings.lon=c.longitude;save();render();loadWeather(settings.lat,settings.lon);$('#location-note').textContent=`Using ${c.name}, ${c.country}.`;}catch{note.textContent='Could not find that city. Try another name.';}}
function weatherEmoji(code){if(code===0)return'☀️';if(code<=3)return'⛅';if(code<=48)return'🌫️';if(code<=67)return'🌧️';if(code<=77)return'❄️';if(code<=82)return'🌦️';return'⛈️';}
async function loadWeather(lat,lon){try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);if(!r.ok)throw Error('Weather unavailable');const d=await r.json();const c=d.current;if(!c)return;const value=`${Math.round(c.temperature_2m)} °C ${weatherEmoji(c.weather_code)}`;weatherCache={lat,lon,text:value,time:Date.now()};localStorage.setItem(weatherKey,JSON.stringify(weatherCache));const el=$('#weather-value');if(el)el.textContent=value;}catch{}}
function refreshWeather(){if(settings.lat==null||settings.lon==null)return;if(weatherCache&&weatherCache.lat===settings.lat&&weatherCache.lon===settings.lon&&Date.now()-weatherCache.time<30*60*1000)return;loadWeather(settings.lat,settings.lon);}
function imageFor(item){const media=item.getElementsByTagName('media:content')[0]||item.getElementsByTagName('media:thumbnail')[0]||item.getElementsByTagName('enclosure')[0];const mediaUrl=media?.getAttribute('url');if(mediaUrl?.match(/\.(jpg|jpeg|png|webp)(\?|$)/i))return mediaUrl;const html=item.querySelector('description')?.textContent||item.querySelector('content')?.textContent||'';const img=html.match(/<img[^>]+src=["']([^"']+)/i)?.[1];return img||'';}
async function loadFeeds(){if(!globalThis.chrome?.runtime?.id)return;const cached=JSON.parse(localStorage.getItem(feedCacheKey)||'null');if(cached?.items?.length){articles=cached.items.filter(article => activeSources.has(article.source));mode='live';render();if(Date.now()-cached.time<15*60*1000)return;}const results=await Promise.allSettled(sources.map(async s=>{const r=await fetch(s.url);if(!r.ok)throw Error(r.status);const xml=new DOMParser().parseFromString(await r.text(),'application/xml');return [...xml.querySelectorAll('item, entry')].slice(0,15).map(item=>{const title=item.querySelector('title')?.textContent?.trim();const link=item.querySelector('link')?.getAttribute('href')||item.querySelector('link')?.textContent?.trim();return{title,url:link,topic:s.topic,source:s.name,timestamp:publicationTimestamp(item),image:imageFor(item)}}).filter(a=>a.title&&a.url&&isRecentStory(a))}));const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);if(items.length||results.some(result=>result.status==='fulfilled')){const seen=new Set();articles=items.sort((a,b)=>b.timestamp-a.timestamp).filter(a=>{const key=a.url.replace(/\?.*$/,'');if(seen.has(key))return false;seen.add(key);return true});mode='live';localStorage.setItem(feedCacheKey,JSON.stringify({time:Date.now(),items:articles}));render();}}
document.addEventListener('click', event => {
  const restore = event.target.closest('[data-restore-dismissed]');
  if (restore) restoreDismissedStory(restore.dataset.restoreDismissed);

  const dismiss = event.target.closest('[data-dismiss-story]');
  if (dismiss && view === 'latest') {
    const id = storyId(dismiss.dataset.dismissStory);
    const article = filtered().find(story => storyId(story.url) === id);
    if (article) dismissStory(article);
  }
});

document.addEventListener('click',event=>{const unread=event.target.closest('[data-unread]');if(unread){markUnread(unread.dataset.unread);return;}const link=event.target.closest('a.card[data-story-url]');if(link&&view==='latest'){const article=[...restoredMap.values(),...articles].find(a=>storyId(a.url)===storyId(link.dataset.storyUrl));if(article){markRead(article);setTimeout(()=>{if(view==='latest')renderStories();},0);}}});
render();refreshWeather();loadFeeds();
setInterval(refreshStoryRetention, 60_000);
window.addEventListener('focus', refreshStoryRetention);
if(legacyCity)navigator.permissions?.query({name:'geolocation'}).then(p=>{if(p.state==='granted')useLocation();}).catch(()=>{});matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(settings.theme==='system')theme()});
