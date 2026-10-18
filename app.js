/* Cooking Book Sanaz — all recipes come from data/recipes.js (built from Notion by build.py) */
(() => {
const R = window.RECIPES || [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fa = (n, d = 0) => Number(n).toLocaleString("fa-IR", {maximumFractionDigits: d});
const store = {
  get(k, d) { try { const v = localStorage.getItem("cb:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("cb:" + k, JSON.stringify(v)); } catch {} }
};

/* ---------- tags ---------- */
const TAGS = {
  "Easy": ["آسان", "⚡"], "high protein": ["پرپروتئین", "💪"], "low carb": ["کم‌کربوهیدرات", "🥬"],
  "Vegies": ["سبزیجات", "🥦"], "Meat": ["گوشتی", "🍗"], "Rice": ["برنجی", "🍚"], "Polo": ["پلو", "🍛"],
  "Stew": ["خورش", "🍲"], "Soup": ["آش و سوپ", "🥣"], "Salad": ["سالاد", "🥗"], "Pasta": ["پاستا و نودل", "🍝"],
  "Main Dish": ["غذای اصلی", "🍽️"], "Egg Dishes": ["تخم‌مرغی", "🍳"], "Fast Food": ["فست‌فود", "🍔"],
  "Sandwich": ["ساندویچ", "🥪"], "Snack": ["میان‌وعده", "🥨"]
};
const TAG_ORDER = ["Easy","high protein","low carb","Main Dish","Stew","Polo","Rice","Soup","Salad","Pasta","Egg Dishes","Fast Food","Sandwich","Snack","Meat","Vegies"];
const COURSE = {"Breakfast": ["صبحانه", "☀️"], "Lunch": ["ناهار", "🌤️"], "Dinner": ["شام", "🌙"]};
const tagFa = t => TAGS[t] ? TAGS[t][0] : t;
const emojiFor = r => (TAGS[["Soup","Stew","Polo","Salad","Pasta","Egg Dishes","Sandwich","Fast Food","Snack","Rice","Meat","Vegies"].find(t => r.tags.includes(t))] || ["", "🍽️"])[1];

/* ---------- search ---------- */
const norm = s => String(s || "").toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[ً-ْ]/g, "")
  .replace(/‌/g, "").replace(/\s+/g, "");
R.forEach(r => {
  if (!/[\u0600-\u06FF]/.test(r.name)) { r.en = r.name; r.name = r.normal.title; }
  const parts = [r.name, r.en, r.desc, r.normal.title, r.healthy.title,
    ...r.tags, ...r.tags.map(tagFa), ...r.course.map(c => COURSE[c]?.[0]),
    ...r.normal.ings.map(i => i.n || i.grp), ...r.healthy.ings.map(i => i.n || i.grp)];
  r._hay = norm(parts.join("|"));
  r._name = norm(r.name + r.normal.title + r.healthy.title);
});

/* ---------- state ---------- */
const st = {
  q: "", course: store.get("course", ""), tags: store.get("tags", []), favOnly: false,
  favs: new Set(store.get("favs", [])), ver: store.get("ver", "healthy")
};
const saveFilters = () => { store.set("course", st.course); store.set("tags", st.tags); };
const toggleFav = id => { st.favs.has(id) ? st.favs.delete(id) : st.favs.add(id); store.set("favs", [...st.favs]); };

/* ---------- theme ---------- */
const applyTheme = t => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
applyTheme(store.get("theme", ""));
$("themeBtn").onclick = () => {
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  const cur = document.documentElement.dataset.theme || (dark ? "dark" : "light");
  const next = cur === "dark" ? "light" : "dark";
  applyTheme(next); store.set("theme", next);
};

/* ---------- home ---------- */
function filtered() {
  const q = norm(st.q);
  let list = R.filter(r =>
    (!st.course || r.course.includes(st.course)) &&
    st.tags.every(t => r.tags.includes(t)) &&
    (!st.favOnly || st.favs.has(r.id)) &&
    (!q || r._hay.includes(q)));
  if (q) list = list.sort((a, b) => (b._name.includes(q) - a._name.includes(q)));
  return list;
}

function renderHome() {
  document.title = "Cooking Book Sanaz";
  const counts = t => R.filter(r => (!st.course || r.course.includes(st.course)) && r.tags.includes(t)).length;
  $("view").innerHTML = `
    <section class="hero"><p>${fa(R.length)} غذا، هر کدام با دو نسخه‌ی <b style="color:var(--normal)">معمولی</b> و <b style="color:var(--healthy)">سالم</b>. تعداد نفرات رو عوض کن تا مقدارها، کالری و درشت‌مغذی‌ها حساب بشن؛ برای پخت قدم‌به‌قدم با تایمر «شروع پخت» رو بزن.</p></section>
    <div class="search"><input id="q" type="search" placeholder="جستجوی غذا، ماده یا دسته… (مثلاً مرغ، عدس، سالاد)" value="${esc(st.q)}" autocomplete="off"></div>
    <div class="filters">
      <div class="frow" role="group" aria-label="وعده">
        <span class="lbl">وعده</span>
        <button class="chip" data-course="" aria-pressed="${!st.course}">همه</button>
        ${Object.entries(COURSE).map(([k, [f, e]]) => `<button class="chip" data-course="${k}" aria-pressed="${st.course === k}">${e} ${f}<span class="n">${fa(R.filter(r => r.course.includes(k)).length)}</span></button>`).join("")}
        <button class="chip" id="favChip" aria-pressed="${st.favOnly}">❤️ علاقه‌مندی‌ها<span class="n">${fa(st.favs.size)}</span></button>
      </div>
      <div class="frow" role="group" aria-label="دسته‌بندی">
        <span class="lbl">دسته</span>
        ${TAG_ORDER.map(t => `<button class="chip" data-tag="${esc(t)}" aria-pressed="${st.tags.includes(t)}">${TAGS[t][1]} ${TAGS[t][0]}<span class="n">${fa(counts(t))}</span></button>`).join("")}
      </div>
    </div>
    <div class="resbar"><span id="count"></span><button class="linkbtn" id="clear" hidden>پاک کردن فیلترها</button></div>
    <div class="grid" id="grid"></div>`;
  $("q").oninput = e => { st.q = e.target.value; renderGrid(); };
  $("view").querySelectorAll("[data-course]").forEach(b => b.onclick = () => { st.course = b.dataset.course; saveFilters(); renderHome(); });
  $("view").querySelectorAll("[data-tag]").forEach(b => b.onclick = () => {
    const t = b.dataset.tag; st.tags = st.tags.includes(t) ? st.tags.filter(x => x !== t) : [...st.tags, t]; saveFilters(); renderHome();
  });
  $("favChip").onclick = () => { st.favOnly = !st.favOnly; renderHome(); };
  $("clear").onclick = () => { st.q = ""; st.course = ""; st.tags = []; st.favOnly = false; saveFilters(); renderHome(); };
  renderGrid();
}

function renderGrid() {
  const list = filtered();
  const any = st.q || st.course || st.tags.length || st.favOnly;
  $("count").textContent = any ? `${fa(list.length)} غذا پیدا شد` : `همه‌ی ${fa(list.length)} غذا`;
  $("clear").hidden = !any;
  $("grid").innerHTML = list.length ? list.map(r => `
    <a class="card" href="#r/${r.id}">
      ${st.favs.has(r.id) ? `<span class="fav" aria-label="علاقه‌مندی">❤️</span>` : ""}
      <span class="emoji" aria-hidden="true">${emojiFor(r)}</span>
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.desc)}</p>
      <div class="tags">${r.course.map(c => `<span class="tag">${COURSE[c]?.[0] || c}</span>`).join("")}${r.tags.slice(0, 4).map(t => `<span class="tag">${esc(tagFa(t))}</span>`).join("")}</div>
      <div class="kcals"><span class="kc n">معمولی ${fa(r.normal.kcal)} کالری</span><span class="kc h">سالم ${fa(r.healthy.kcal)} کالری</span></div>
    </a>`).join("") : `<div class="empty">غذایی با این فیلترها پیدا نشد 🙂</div>`;
}

/* ---------- amount scaling ---------- */
const FR = {"نیم": .5, "یک‌چهارم": .25, "یک‌سوم": 1/3, "دوسوم": 2/3, "سه‌چهارم": .75};
const FR_RE = "نیم|یک‌چهارم|یک‌سوم|دوسوم|سه‌چهارم";
const QTY = new RegExp(`(\\d+(?:\\.\\d+)?)(?:\\s*و\\s*(${FR_RE}))?|(?<![\\u0600-\\u06FF‌])(${FR_RE})(?![\\u0600-\\u06FF‌])`, "g");
const NOSCALE = /^\s*(?:درجه|سانت|٪|%|دقیقه|ساعت|ثانیه|برابر|بند|×|x)/;
function fq(v) {               // friendly quantity in Persian
  if (v >= 50) return fa(Math.round(v / 5) * 5);
  if (v >= 10) return fa(Math.round(v));
  const w = Math.floor(v), r = v - w;
  const F = [[0, ""], [.25, "یک‌چهارم"], [1/3, "یک‌سوم"], [.5, "نیم"], [2/3, "دوسوم"], [.75, "سه‌چهارم"], [1, ""]];
  let best = F[0]; for (const f of F) if (Math.abs(r - f[0]) < Math.abs(r - best[0])) best = f;
  const W = best[0] === 1 ? w + 1 : w, fr = best[0] === 1 ? "" : best[1];
  if (W === 0) return fr || "کمی";
  return fr ? `${fa(W)} و ${fr}` : fa(W);
}
function scaleText(a, k) {
  return a.replace(QTY, (m, num, frac, lone, off, full) => {
    const after = full.slice(off + m.length), before = full.slice(0, off);
    if (NOSCALE.test(after) || /[×x]\s*$/.test(before)) return num ? fa(num, 1) + (frac ? " و " + frac : "") : m;
    const v = num ? parseFloat(num) + (frac ? FR[frac] : 0) : FR[lone];
    return k === 1 ? (num ? fa(num, 1) + (frac ? " و " + frac : "") : m) : fq(v * k);
  });
}

/* ---------- recipe view ---------- */
let cur = null, serv = 2, checked = new Set();
const V = () => cur[st.ver];

function renderRecipe(id) {
  const r = R.find(x => x.id === id);
  if (!r) { location.hash = ""; return; }
  if (cur !== r) { cur = r; serv = r[st.ver].serv || 2; checked = new Set(); window.scrollTo(0, 0); }
  const v = V(), k = serv / (v.serv || 2), m = v.macros;
  document.title = `${r.name} · Cooking Book Sanaz`;
  const pk = m.p * 4, ck = m.c * 4, fk = m.f * 9, tot = pk + ck + fk || 1;
  const ings = v.ings.map((i, n) => i.grp ? `<li class="grp">${esc(i.grp)}</li>` :
    `<li class="it ${checked.has(st.ver + n) ? "done" : ""}" data-i="${n}"><span class="nm">${esc(i.a ? i.n : scaleText(i.n, k))}</span><span class="amt">${esc(scaleText(i.a, k))}</span></li>`).join("");
  const steps = v.steps.map((s, n) => `<li><div><p>${esc(s.c)}</p>
      ${s.sub.length ? `<ul>${s.sub.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${s.timers.length ? `<div class="tchips">${s.timers.map((t, j) => `<button class="tchip" data-s="${n}" data-j="${j}">⏱ ${esc(durLabel(t.s))}</button>`).join("")}</div>` : ""}
    </div></li>`).join("");
  $("view").innerHTML = `
    <button class="back" id="back">→ همه‌ی غذاها</button>
    <article class="recipe">
      <div class="tags">${r.course.map(c => `<span class="tag">${COURSE[c]?.[1]} ${COURSE[c]?.[0]}</span>`).join("")}${r.tags.map(t => `<a class="tag" href="#" data-gotag="${esc(t)}">${TAGS[t]?.[1] || ""} ${esc(tagFa(t))}</a>`).join("")}</div>
      <div class="rhead"><h1>${esc(r.name)}</h1><button class="favbtn" id="fav" aria-pressed="${st.favs.has(r.id)}" title="علاقه‌مندی">${st.favs.has(r.id) ? "❤️" : "🤍"}</button></div>
      <p class="desc">${esc(r.desc)}</p>
      <div class="seg" role="group" aria-label="نسخه">
        <button class="n" data-ver="normal" aria-pressed="${st.ver === "normal"}">معمولی<small>${fa(r.normal.kcal)} کالری برای هر نفر</small></button>
        <button class="h" data-ver="healthy" aria-pressed="${st.ver === "healthy"}">سالم 🌿<small>${fa(r.healthy.kcal)} کالری برای هر نفر</small></button>
      </div>
      <p class="vtitle">${esc(v.title)} ${v.yield ? `<small>(${esc(v.yield)} برای ${fa(v.serv)} نفر)</small>` : ""}</p>
      <div class="bar">
        <div class="serv"><button id="minus" aria-label="کمتر">−</button><b id="sv">${fa(serv)}</b><span>نفر</span><button id="plus" aria-label="بیشتر">+</button></div>
        <button class="start" id="startCook">▶ شروع پخت</button>
      </div>
      <section>
        <h2 class="sec">ارزش غذایی هر نفر</h2>
        <div class="nutri">
          <div class="nbox k"><b>${fa(v.kcal)}</b><span>کالری</span></div>
          <div class="nbox p"><b>${fa(m.p)}<small>g</small></b><span>پروتئین</span></div>
          <div class="nbox c"><b>${fa(m.c)}<small>g</small></b><span>کربوهیدرات</span></div>
          <div class="nbox f"><b>${fa(m.f)}<small>g</small></b><span>چربی</span></div>
        </div>
        <div class="mbar" style="margin-top:10px" aria-hidden="true"><i style="width:${pk / tot * 100}%;background:var(--p)"></i><i style="width:${ck / tot * 100}%;background:var(--c)"></i><i style="width:${fk / tot * 100}%;background:var(--f)"></i></div>
        <div class="ntotal" style="margin-top:6px"><span>کل برای ${fa(serv)} نفر: <b>${fa(v.kcal * serv)}</b> کالری · پروتئین ${fa(m.p * serv)}g · کربوهیدرات ${fa(m.c * serv)}g · چربی ${fa(m.f * serv)}g</span></div>
        <div class="note-est">${v.kcalNote ? `کالری ${esc(v.kcalNote)}. ` : ""}کالری از دستور نوشن؛ درشت‌مغذی‌ها تخمینی از روی مواد لازم است.</div>
      </section>
      <section><h2 class="sec">مواد لازم <span class="muted" style="font-weight:400">(برای ${fa(serv)} نفر، روی هر مورد بزن تا تیک بخورد)</span></h2><ul class="ings">${ings}</ul></section>
      <section><h2 class="sec">طرز تهیه</h2><ol class="steps">${steps}</ol></section>
      ${v.notes.length ? `<section class="notes"><h2 class="sec">نکته‌ها</h2><ul>${v.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul></section>` : ""}
      <div class="foot">
        ${v.sources.map(s => `<a href="${esc(s.u)}" target="_blank" rel="noopener">منبع: ${esc(s.t)}</a>`).join("")}
      </div>
    </article>`;
  $("back").onclick = () => { location.hash = ""; };
  $("fav").onclick = () => { toggleFav(r.id); renderRecipe(r.id); };
  $("view").querySelectorAll("[data-ver]").forEach(b => b.onclick = () => { st.ver = b.dataset.ver; store.set("ver", st.ver); renderRecipe(r.id); });
  $("view").querySelectorAll("[data-gotag]").forEach(a => a.onclick = e => { e.preventDefault(); st.tags = [a.dataset.gotag]; st.course = ""; st.q = ""; saveFilters(); location.hash = ""; });
  $("minus").onclick = () => { if (serv > 1) { serv--; renderRecipe(r.id); } };
  $("plus").onclick = () => { if (serv < 30) { serv++; renderRecipe(r.id); } };
  $("startCook").onclick = () => openCook(0);
  $("view").querySelectorAll(".ings li.it").forEach(li => li.onclick = () => {
    const key = st.ver + li.dataset.i; checked.has(key) ? checked.delete(key) : checked.add(key); li.classList.toggle("done");
  });
  $("view").querySelectorAll(".tchip").forEach(b => b.onclick = () => {
    const s = v.steps[+b.dataset.s], t = s.timers[+b.dataset.j];
    Timers.start(`${r.name} · مرحله‌ی ${fa(+b.dataset.s + 1)}`, t.s, r.id);
  });
}

function durLabel(s) {
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  const p = [];
  if (h) p.push(`${fa(h)} ساعت`);
  if (m) p.push(`${fa(m)} دقیقه`);
  if (x) p.push(`${fa(x)} ثانیه`);
  return p.join(" و ");
}
const clock = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = n => String(n).padStart(2, "0"); return h ? `${h}:${p(m)}:${p(x)}` : `${p(m)}:${p(x)}`; };

/* ---------- timers (several can run at once; based on wall clock so they survive background tabs) ---------- */
const Timers = (() => {
  let list = store.get("timers", []), audio = null, seq = Date.now();
  const save = () => store.set("timers", list);
  const left = t => t.paused ? t.remain : (t.end - Date.now()) / 1000;
  function ctx() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch {} return audio; }
  function beep() {
    const a = ctx(); if (!a) return;
    [0, .3, .6].forEach(o => { const os = a.createOscillator(), g = a.createGain(); os.frequency.value = 880; g.gain.value = .18; os.connect(g); g.connect(a.destination); os.start(a.currentTime + o); os.stop(a.currentTime + o + .18); });
  }
  function start(label, secs, rid) {
    ctx();
    if ("Notification" in window && Notification.permission === "default") { try { Notification.requestPermission(); } catch {} }
    list.push({id: ++seq, label, total: secs, end: Date.now() + secs * 1000, paused: false, remain: secs, rid, done: false});
    save(); render(); tick();
  }
  function act(id, what) {
    const t = list.find(x => x.id === id); if (!t) return;
    if (what === "x") list = list.filter(x => x.id !== id);
    if (what === "p") { if (t.paused) { t.end = Date.now() + t.remain * 1000; t.paused = false; } else { t.remain = left(t); t.paused = true; } }
    if (what === "+") { if (t.done) { t.done = false; t.end = Date.now() + 60000; } else if (t.paused) t.remain += 60; else t.end += 60000; }
    save(); render(); updateCookTimers();
  }
  function render() {
    $("dock").innerHTML = list.map(t => `
      <div class="dt ${t.done ? "done" : ""} ${t.paused ? "paused" : ""}" data-id="${t.id}">
        <span class="t" data-clock="${t.id}">${t.done ? "تمام!" : clock(left(t))}</span>
        <span class="l" data-go="${t.rid || ""}" title="${esc(t.label)}">${esc(t.label)}</span>
        ${t.done ? "" : `<button data-a="p">${t.paused ? "ادامه" : "توقف"}</button>`}
        <button data-a="+">۱ دقیقه بیشتر</button>
        <button data-a="x" aria-label="حذف تایمر">✕</button>
      </div>`).join("");
    $("dock").querySelectorAll("button[data-a]").forEach(b => b.onclick = () => act(+b.closest(".dt").dataset.id, b.dataset.a));
    document.documentElement.style.setProperty("--dockh", $("dock").offsetHeight + "px");
    $("dock").querySelectorAll("[data-go]").forEach(s => s.onclick = () => { if (s.dataset.go) location.hash = "#r/" + s.dataset.go; });
  }
  let iv = null, ring = 0;
  function tick() {
    if (iv) return;
    iv = setInterval(() => {
      if (!list.length) { clearInterval(iv); iv = null; return; }
      let anyDone = false;
      list.forEach(t => {
        if (!t.paused && !t.done && left(t) <= 0) {
          t.done = true; save(); render(); updateCookTimers();
          try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]); } catch {}
          try { if ("Notification" in window && Notification.permission === "granted") new Notification("⏰ تایمر تمام شد", {body: t.label}); } catch {}
        }
        if (t.done) anyDone = true;
        const el = document.querySelector(`[data-clock="${t.id}"]`);
        if (el && !t.done) el.textContent = clock(left(t));
      });
      if (anyDone && ring++ % 3 === 0) beep();
      updateCookClocks();
    }, 500);
  }
  render(); if (list.length) tick();
  return {start, act, left, get list() { return list; }};
})();

/* ---------- cooking mode ---------- */
let step = 0, wake = null;
function openCook(n) {
  step = n; $("cook").hidden = false; document.body.style.overflow = "hidden";
  try { navigator.wakeLock?.request("screen").then(w => wake = w).catch(() => {}); } catch {}
  const v = V(), k = serv / (v.serv || 2);
  $("cookIngs").innerHTML = v.ings.map(i => i.grp ? `<li style="list-style:none;color:var(--saffron);font-weight:700">${esc(i.grp)}</li>` : `<li>${esc(i.a ? i.n : scaleText(i.n, k))}${i.a ? `: <b>${esc(scaleText(i.a, k))}</b>` : ""}</li>`).join("");
  showStep();
}
function closeCook() { $("cook").hidden = true; document.body.style.overflow = ""; try { wake?.release(); } catch {} wake = null; }
function showStep() {
  const v = V(), s = v.steps[step], n = v.steps.length;
  $("cookTitle").textContent = `${cur.name} · ${st.ver === "healthy" ? "سالم" : "معمولی"} · ${fa(serv)} نفر`;
  $("cookStep").textContent = `مرحله‌ی ${fa(step + 1)} از ${fa(n)}`;
  $("prog").style.width = ((step + 1) / n * 100) + "%";
  $("cookBody").textContent = s.c;
  $("cookSub").innerHTML = s.sub.map(x => `<li>${esc(x)}</li>`).join("");
  $("prev").disabled = step === 0;
  $("next").textContent = step === n - 1 ? "تمام شد 🎉" : "مرحله‌ی بعد";
  updateCookTimers();
}
const stepLabel = () => `${cur.name} · مرحله‌ی ${fa(step + 1)}`;
function updateCookTimers() {
  if ($("cook").hidden || !cur) return;
  const s = V().steps[step];
  const running = Timers.list.filter(t => t.label === stepLabel());
  const presets = s.timers.map((t, j) => {
    const r = running.find(x => x.total === t.s);
    return `<div class="timer ${r?.done ? "done" : ""}">
      <div><span class="lb">${esc(t.label.replace(/\d+/g, d => fa(d)))}</span><span class="clock" data-cclock="${r ? r.id : ""}">${r ? (r.done ? "تمام!" : clock(Timers.left(r))) : clock(t.s)}</span></div>
      <div class="btns">${r
        ? `${r.done ? "" : `<button class="tbtn primary" data-tp="${r.id}">${r.paused ? "ادامه" : "توقف"}</button>`}<button class="tbtn" data-tx="${r.id}">${r.done ? "باشه" : "لغو"}</button>`
        : `<button class="tbtn primary" data-ts="${j}">شروع تایمر</button>`}</div></div>`;
  }).join("");
  const extra = running.filter(t => !s.timers.some(p => p.s === t.total)).map(r => `<div class="timer ${r.done ? "done" : ""}"><div><span class="lb">تایمر دلخواه</span><span class="clock" data-cclock="${r.id}">${r.done ? "تمام!" : clock(Timers.left(r))}</span></div>
      <div class="btns">${r.done ? "" : `<button class="tbtn primary" data-tp="${r.id}">${r.paused ? "ادامه" : "توقف"}</button>`}<button class="tbtn" data-tx="${r.id}">${r.done ? "باشه" : "لغو"}</button></div></div>`).join("");
  $("cookTimers").innerHTML = presets + extra +
    `<div class="custom">تایمر دلخواه: <input id="cmin" type="number" min="1" max="600" value="5" inputmode="numeric"> دقیقه <button class="tbtn" id="cgo">شروع</button></div>`;
  $("cookTimers").querySelectorAll("[data-ts]").forEach(b => b.onclick = () => Timers.start(stepLabel(), s.timers[+b.dataset.ts].s, cur.id));
  $("cookTimers").querySelectorAll("[data-tp]").forEach(b => b.onclick = () => Timers.act(+b.dataset.tp, "p"));
  $("cookTimers").querySelectorAll("[data-tx]").forEach(b => b.onclick = () => Timers.act(+b.dataset.tx, "x"));
  $("cgo").onclick = () => { const m = Math.max(1, Math.min(600, parseInt($("cmin").value) || 5)); Timers.start(stepLabel(), m * 60, cur.id); };
}
function updateCookClocks() {
  document.querySelectorAll("[data-cclock]").forEach(el => {
    const t = Timers.list.find(x => String(x.id) === el.dataset.cclock);
    if (t && !t.done) el.textContent = clock(Timers.left(t));
  });
}
const _start = Timers.start;
Timers.start = (...a) => { _start(...a); updateCookTimers(); };
$("prev").onclick = () => { if (step > 0) { step--; showStep(); } };
$("next").onclick = () => { if (step < V().steps.length - 1) { step++; showStep(); } else closeCook(); };
$("cookClose").onclick = closeCook;
document.addEventListener("keydown", e => {
  if ($("cook").hidden) { if (e.key === "/" && document.activeElement?.id !== "q" && $("q")) { e.preventDefault(); $("q").focus(); } return; }
  if (e.key === "Escape") closeCook();
  if (e.key === "ArrowLeft") $("next").click();
  if (e.key === "ArrowRight") $("prev").click();
});

/* ---------- random + routing ---------- */
$("randomBtn").onclick = () => {
  const pool = location.hash.startsWith("#r/") ? R : (filtered().length ? filtered() : R);
  location.hash = "#r/" + pool[Math.floor(Math.random() * pool.length)].id;
};
function route() {
  closeCook();
  const m = location.hash.match(/^#r\/([0-9a-f]+)/);
  if (m) renderRecipe(m[1]); else { cur = null; renderHome(); }
}
window.addEventListener("hashchange", route);
route();
})();
