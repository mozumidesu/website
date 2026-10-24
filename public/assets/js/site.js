/* zolatau.com: shared runtime (theme, languages, navigation, loader, demos, cat) */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  const SELF = d.currentScript;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const page = d.body.dataset.page || "home";
  const bus = new EventTarget();
  const on = (n, f) => bus.addEventListener(n, f);
  const emit = n => bus.dispatchEvent(new Event(n));

  const LANGS = [
    ["de", "Deutsch"], ["en", "English"], ["es", "Español"], ["fr", "Français"], ["id", "Bahasa Indonesia"],
    ["pt", "Português"], ["ro", "Română"], ["ru", "Русский"], ["uk", "Українська"], ["tr", "Türkçe"],
    ["vi", "Tiếng Việt"], ["ar", "العربية"], ["th", "ไทย"], ["ja", "日本語"], ["ko", "한국어"], ["zh", "中文"]
  ];
  const CODES = LANGS.map(l => l[0]);

  /* ── storage: a cookie shared by zolatau.com and translate.zolatau.com, plus localStorage ── */
  const onDomain = /(^|\.)zolatau\.com$/.test(location.hostname);
  const store = {
    get(k) {
      const m = d.cookie.match(new RegExp("(?:^|; )zl-" + k + "=([^;]*)"));
      if (m) return decodeURIComponent(m[1]);
      try { return localStorage.getItem("zl-" + k); } catch { return null; }
    },
    set(k, v) {
      try { localStorage.setItem("zl-" + k, v); } catch {}
      if (onDomain) d.cookie = `zl-${k}=${encodeURIComponent(v)}; domain=zolatau.com; path=/; max-age=31536000; SameSite=Lax; Secure`;
    }
  };

  /* ── links between the two sites also work when the files are opened locally ── */
  const localLinks = () => {
    const file = location.protocol === "file:";
    const dev = file || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.hostname.endsWith(".workers.dev");
    if (!dev) return;
    const inTr = page === "translate";
    const base = file
      ? { home: inTr ? "../index.html" : "index.html", translate: inTr ? "index.html" : "translate/index.html" }
      : { home: "/", translate: "/translate/" };
    $$("[data-link]").forEach(a => {
      const hash = a.getAttribute("href").split("#")[1];
      a.href = base[a.dataset.link] + (hash ? "#" + hash : "");
    });
    d.addEventListener("click", e => {
      const a = e.target.closest && e.target.closest("[data-link]");
      if (!a) return;
      const u = new URL(a.href, location.href);
      u.searchParams.set("theme", theme.get());
      u.searchParams.set("lang", i18n.lang);
      a.href = u.href;
    }, true);
  };

  /* ── how many years have passed since a fixed day; the bio counts itself ── */
  const YEARS = (() => {
    const from = new Date(0x341C * 864e5), now = new Date();
    const early = now.getUTCMonth() < from.getUTCMonth() ||
      (now.getUTCMonth() === from.getUTCMonth() && now.getUTCDate() < from.getUTCDate());
    return now.getUTCFullYear() - from.getUTCFullYear() - (early ? 1 : 0);
  })();

  /* ── languages ── */
  const i18n = {
    lang: CODES.includes(root.lang) ? root.lang : "en",
    dicts: {},
    fns: [],
    base: new URL("../i18n/", SELF.src).href,
    add(code, dict) { this.dicts[code] = dict; },
    t(k) {
      const a = this.dicts[this.lang], b = this.dicts.en;
      const v = a && a[k] != null ? a[k] : b && b[k] != null ? b[k] : "";
      return v.indexOf("{") < 0 ? v : v.replace("{age}", YEARS).replace("{years}", this.years());
    },
    /* one, few, many: Russian and Ukrainian need all three */
    years() {
      const f = String(this.t("home.years") || "").split("|");
      if (f.length < 2) return f[0] || "";
      const ten = YEARS % 10, hundred = YEARS % 100;
      if (ten === 1 && hundred !== 11) return f[0];
      if (ten >= 2 && ten <= 4 && (hundred < 12 || hundred > 14)) return f[1];
      return f[2] || f[1];
    },
    get data() { return this.dicts[this.lang] || this.dicts.en || {}; },
    on(f) { this.fns.push(f); },
    load(code) {
      if (this.dicts[code]) return Promise.resolve();
      return new Promise(res => {
        const s = d.createElement("script");
        s.src = this.base + code + ".js";
        s.onload = s.onerror = res;
        d.head.appendChild(s);
      });
    },
    async set(code, save) {
      if (!CODES.includes(code)) code = "en";
      await Promise.all([this.load(code), this.load("en")]);
      const changed = code !== this.lang;
      this.lang = code;
      if (save) store.set("lang", code);
      this.apply();
      if (changed || !this.applied) this.fns.forEach(f => f(code));
      this.applied = true;
    },
    apply() {
      const L = this.lang;
      root.lang = L;
      root.dir = L === "ar" ? "rtl" : "ltr";
      $$("[data-i18n]").forEach(el => { const v = this.t(el.dataset.i18n); if (v) el.textContent = v; });
      $$("[data-i18n-html]").forEach(el => { const v = this.t(el.dataset.i18nHtml); if (v) el.innerHTML = v; });
      $$("[data-i18n-attr]").forEach(el => el.dataset.i18nAttr.split(";").forEach(pair => {
        const [attr, key] = pair.split(":").map(s => s.trim());
        const v = this.t(key);
        if (v) el.setAttribute(attr, v);
      }));
      const title = this.t(page + ".title");
      if (title) d.title = title;
      const meta = $('meta[name="description"]'), desc = this.t(page + ".meta");
      if (meta && desc) meta.content = desc;
      $$("[data-lang-code]").forEach(el => (el.textContent = L.toUpperCase()));
      $$(".lang__opt").forEach(o => o.setAttribute("aria-selected", String(o.dataset.lang === L)));
      theme.label();
      root.classList.remove("i18n-wait");
    }
  };
  let readyI18n;
  i18n.ready = new Promise(r => (readyI18n = r));

  /* ── theme: dark by default, the switch opens the new theme in a circle from the button ── */
  const THEME_BG = { dark: "#0D1038", light: "#F3F0FA" };
  const theme = {
    get: () => (root.dataset.theme === "light" ? "light" : "dark"),
    meta() { const m = $('meta[name="theme-color"]'); if (m) m.content = THEME_BG[this.get()]; },
    label() {
      $$("[data-theme-toggle]").forEach(b => b.setAttribute("aria-label", i18n.t(this.get() === "dark" ? "theme.toLight" : "theme.toDark") || "Theme"));
    },
    toggle(btn) {
      const next = this.get() === "dark" ? "light" : "dark";
      const apply = () => { root.dataset.theme = next; store.set("theme", next); this.label(); this.meta(); };
      if (!d.startViewTransition || reduce.matches || !btn) return apply();
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add("vt");
      const vt = d.startViewTransition(apply);
      vt.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 1000, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
      vt.finished.finally(() => root.classList.remove("vt"));
    }
  };

  /* ── language picker ── */
  const langPicker = () => {
    $$(".nav__lang").forEach(btn => {
      const menu = $("#" + btn.getAttribute("aria-controls"));
      if (!menu) return;
      const place = () => {
        if (!matchMedia("(min-width: 861px)").matches) return;
        const pr = btn.closest(".nav__pill").getBoundingClientRect();
        if (root.dir === "rtl") { menu.style.left = pr.left + "px"; menu.style.right = "auto"; }
        else { menu.style.right = (innerWidth - pr.right) + "px"; menu.style.left = "auto"; }
      };
      menu.innerHTML = LANGS.map(([c, n]) =>
        `<li role="none"><button type="button" class="lang__opt" role="option" data-lang="${c}" aria-selected="${c === i18n.lang}"><span lang="${c}">${n}</span><small>${c.toUpperCase()}</small></button></li>`
      ).join("");
      const opts = () => $$(".lang__opt", menu);
      const open = v => {
        btn.setAttribute("aria-expanded", String(v));
        if (v) place();
        menu.hidden = !v;
        if (v) (opts().find(o => o.getAttribute("aria-selected") === "true") || opts()[0]).focus();
      };
      btn.addEventListener("click", e => { e.stopPropagation(); open(menu.hidden); });
      menu.addEventListener("click", e => {
        const o = e.target.closest(".lang__opt");
        if (!o) return;
        open(false);
        btn.focus();
        i18n.set(o.dataset.lang, true);
      });
      menu.addEventListener("keydown", e => {
        const list = opts(), i = list.indexOf(d.activeElement);
        const go = n => { list[(n + list.length) % list.length].focus(); e.preventDefault(); };
        if (e.key === "ArrowDown" || e.key === "ArrowRight") go(i + 1);
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(i - 1);
        else if (e.key === "Home") go(0);
        else if (e.key === "End") go(-1);
        else if (e.key === "Escape" || e.key === "Tab") { open(false); if (e.key === "Escape") btn.focus(); }
      });
      d.addEventListener("click", e => { if (!menu.contains(e.target) && !btn.contains(e.target) && !menu.hidden) open(false); });
      addEventListener("resize", () => { if (!menu.hidden) place(); });
    });
  };

  /* ── navigation pill ── */
  const nav = () => {
    const el = $(".nav");
    if (!el) return;
    on("ready", () => requestAnimationFrame(() => {
      el.classList.add("is-open");
      setTimeout(() => el.classList.add("is-done"), 1300);
    }));
    /* keyboard focus keeps the bar in place; a mouse click on a button does not */
    const keyboardInside = () => {
      try { return !!el.querySelector(":focus-visible"); } catch { return el.contains(d.activeElement); }
    };
    let last = scrollY, busy = false;
    addEventListener("scroll", () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        const hide = y > last && y > 260 && !root.classList.contains("menu-lock") && !keyboardInside();
        el.classList.toggle("is-hidden", hide);
        if (hide) { const m = $(".lang__menu", el); if (m && !m.hidden) { m.hidden = true; $(".nav__lang", el).setAttribute("aria-expanded", "false"); } }
        last = y;
        busy = false;
      });
    }, { passive: true });

    const links = $(".nav__links", el), blob = $(".nav__blob", el);
    if (links && blob) {
      links.addEventListener("pointerover", e => {
        const a = e.target.closest("a");
        if (!a) return;
        blob.style.width = a.offsetWidth + "px";
        blob.style.transform = `translateX(${a.offsetLeft}px)`;
        blob.style.opacity = "1";
      });
      links.addEventListener("pointerleave", () => (blob.style.opacity = "0"));
    }

    const anchors = $$('.nav__links a[href^="#"], .menu__links a[href^="#"]');
    const targets = [...new Set(anchors.map(a => a.hash))].map(h => $(h)).filter(Boolean);
    if (targets.length) {
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) anchors.forEach(a => a.classList.toggle("is-active", a.hash === "#" + en.target.id));
      }), { rootMargin: "-45% 0px -50% 0px" });
      targets.forEach(t => io.observe(t));
    }

    $$("[data-theme-toggle]").forEach(b => b.addEventListener("click", () => theme.toggle(b)));
  };

  /* ── mobile menu ── */
  const mobileMenu = () => {
    const btn = $(".nav__menu-btn"), m = $("#menu");
    if (!btn || !m) return;
    m.hidden = false;
    m.inert = true;
    const set = v => {
      btn.setAttribute("aria-expanded", String(v));
      btn.setAttribute("aria-label", i18n.t(v ? "nav.close" : "nav.menu"));
      m.classList.toggle("is-open", v);
      m.inert = !v;
      root.classList.toggle("menu-lock", v);
    };
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
    m.addEventListener("click", e => { if (e.target.closest("a")) set(false); });
    d.addEventListener("keydown", e => { if (e.key === "Escape" && m.classList.contains("is-open")) { set(false); btn.focus(); } });
    matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches) set(false); });
  };

  /* ── scramble: text changes script letter by letter ── */
  const POOL = {
    lat: "abcdefghijklmnopqrstuvwxyz", LAT: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    cyr: "абвгдежзийклмнопрстуфхцчшщыэюя", CYR: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ",
    kata: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン",
    hira: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん",
    han: "言語文字翻訳話中心大小山川水火木金土日月人口手目耳",
    ar: "ابتثجحخدذرزسشصضطظعغفقكلمنهوي", th: "กขคงจฉชซญดตถทธนบปผพฟภมยรลวศษสหอฮ",
    sym: "#%&*+=<>/|~^"
  };
  const poolFor = ch => {
    if (!ch || /\s/.test(ch)) return null;
    if (/[a-zß-ÿ]/.test(ch)) return POOL.lat;
    if (/[A-ZÀ-Þ]/.test(ch)) return POOL.LAT;
    if (/[а-яёіїєґў]/.test(ch)) return POOL.cyr;
    if (/[А-ЯЁІЇЄҐЎ]/.test(ch)) return POOL.CYR;
    if (/[゠-ヿ]/.test(ch)) return POOL.kata;
    if (/[぀-ゟ]/.test(ch)) return POOL.hira;
    if (/[一-鿿]/.test(ch)) return POOL.han;
    if (/[؀-ۿ]/.test(ch)) return POOL.ar;
    if (/[฀-๿]/.test(ch)) return POOL.th;
    if (/[\p{L}]/u.test(ch)) return POOL.lat;
    return null;
  };
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const chars = s => (seg ? [...seg.segment(s)].map(x => x.segment) : [...s]);
  const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  function scramble(el, to, opt = {}) {
    const { duration = 800, mark = true } = opt;
    if (el._scr) { cancelAnimationFrame(el._scr); el._scr = null; }
    if (reduce.matches || d.hidden) { el.textContent = to; return Promise.resolve(); }
    const from = chars(el.textContent), target = chars(to);
    const n = Math.max(from.length, target.length);
    const step = Math.min(55, duration / Math.max(1, n));
    const plan = Array.from({ length: n }, (_, i) => ({
      start: i * step * 0.35 + Math.random() * 60,
      end: i * step + duration * 0.4 + Math.random() * duration * 0.25,
      from: from[i] ?? "", to: target[i] ?? "", ch: ""
    }));
    const t0 = performance.now();
    return new Promise(res => {
      let lastRoll = 0;
      const tick = now => {
        const t = now - t0, roll = now - lastRoll > 60;
        if (roll) lastRoll = now;
        let html = "", done = true;
        for (const p of plan) {
          if (t >= p.end) { html += esc(p.to); continue; }
          done = false;
          if (t < p.start) { html += esc(p.from); continue; }
          const pool = poolFor(p.to) || poolFor(p.from);
          if (!pool) { html += esc(p.to || " "); continue; }
          if (roll || !p.ch) p.ch = pool[(Math.random() * pool.length) | 0];
          html += mark ? `<span class="scr">${p.ch}</span>` : p.ch;
        }
        if (done) { el.textContent = to; el._scr = null; res(); return; }
        el.innerHTML = html;
        el._scr = requestAnimationFrame(tick);
      };
      el._scr = requestAnimationFrame(tick);
    });
  }

  /* ── loader ── */
  const GREET = {
    de: "Hallo", en: "Hello", es: "Hola", fr: "Bonjour", id: "Halo", pt: "Olá", ro: "Salut", ru: "Привет", uk: "Привіт",
    tr: "Merhaba", vi: "Xin chào", ar: "مرحبا", th: "สวัสดี", ja: "こんにちは", zh: "你好", be: "Прывітанне"
  };
  const loader = async () => {
    const el = $(".loader");
    let seen = null;
    try { seen = sessionStorage.getItem("zl-seen"); } catch {}
    const finish = () => { root.classList.add("is-ready"); emit("ready"); };
    await i18n.ready;
    if (!el || seen || reduce.matches) {
      if (el) el.remove();
      root.classList.add("no-loader");
      finish();
      return;
    }
    try { sessionStorage.setItem("zl-seen", "1"); } catch {}
    const word = $("[data-loader-word]", el), count = $("[data-loader-count]", el);
    const L = i18n.lang;
    const words = Object.entries(GREET).filter(([k]) => k !== L).sort(() => Math.random() - 0.5);
    let target = 0.08;
    const img = $(".portrait__img img") || $(".thero img");
    const jobs = [
      d.fonts ? d.fonts.ready : Promise.resolve(),
      img && !img.complete ? new Promise(r => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }) : Promise.resolve(),
      d.readyState === "complete" ? Promise.resolve() : new Promise(r => addEventListener("load", r, { once: true }))
    ];
    let finished = 0;
    jobs.forEach(j => j.then(() => { finished++; target = Math.max(target, 0.08 + (0.92 * finished) / jobs.length); }));
    const t0 = performance.now(), MIN = 1600, MAX = 4500;
    let p = 0, wi = 0, swap = 0;
    await new Promise(res => {
      const frame = now => {
        const t = now - t0;
        const goal = t > MAX ? 1 : Math.min(target, t / MIN);
        p = Math.min(goal, p + Math.max(0.004, (goal - p) * 0.09));
        el.style.setProperty("--p", p.toFixed(4));
        count.textContent = String(Math.round(p * 100)).padStart(3, "0");
        if (now - swap > 240 && p < 0.95) {
          const [code, text] = words[wi++ % words.length];
          word.textContent = text;
          word.lang = code;
          swap = now;
        }
        if (p >= 0.999) { word.textContent = GREET[L]; word.lang = L; res(); }
        else requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await sleep(320);
    el.classList.add("is-done");
    await sleep(160);
    finish();
    await sleep(1100);
    el.remove();
  };

  /* ── chat demo: a message is typed, translated before sending, a reply is translated from the menu ── */
  const demoData = full => Object.assign({}, i18n.data.demo, full ? i18n.data.demo2 : null);
  const demos = () => {
    $$("[data-demo]").forEach(box => {
      const full = box.dataset.demo === "full";
      const q = s => $(`[data-d="${s}"]`, box);
      const parts = {
        out: q("out"), outText: q("out-text"), orig: q("orig"), origText: q("orig-text"), wrote: q("wrote"),
        inn: q("in"), inText: q("in-text"), tr: q("tr"), trFrom: q("tr-from"), trText: q("tr-text"),
        friend: q("friend"), ava: q("friend-ava"), me: q("me"), state: q("state"),
        ctxT: q("ctx-translate"), ctxE: q("ctx-explain"), typing: q("typing"), tip: q("tip")
      };
      const ctx = $(".ctx", box), btn = $(".chat__btn", box);
      let run = 0, visible = false, playing = false;
      const labels = () => {
        const D = demoData(full);
        if (parts.friend) parts.friend.textContent = D.friend || "";
        if (parts.ava) parts.ava.textContent = (D.friend || "?").slice(0, 1);
        if (parts.me) parts.me.textContent = D.me || "";
        if (parts.wrote) parts.wrote.textContent = D.youWrote || "";
        if (parts.trFrom) parts.trFrom.textContent = D.trFrom || "";
        if (parts.ctxT) parts.ctxT.textContent = D.ctxTranslate || "";
        if (parts.ctxE) parts.ctxE.textContent = D.ctxExplain || "";
        if (parts.tip) parts.tip.textContent = D.on || "";
        if (parts.state) parts.state.textContent = D.on || "";
        if (parts.typing) parts.typing.dataset.placeholder = D.placeholder || "";
        box.setAttribute("aria-label", i18n.t("common.demo"));
      };
      const reset = () => {
        box.classList.toggle("is-on", !full);
        parts.out.classList.add("is-off");
        parts.inn.classList.add("is-off");
        parts.orig.classList.add("is-off");
        parts.tr.classList.add("is-off");
        ctx.classList.add("is-off");
        $$(".ctx__item", ctx).forEach(i => i.classList.remove("is-hot"));
        if (parts.typing) parts.typing.textContent = "";
        if (parts.tip) parts.tip.classList.add("is-off");
        if (btn) btn.classList.remove("is-busy");
        [parts.outText, parts.trText].forEach(e => { if (e._scr) { cancelAnimationFrame(e._scr); e._scr = null; } });
      };
      const finalState = () => {
        const D = demoData(full);
        box.classList.add("is-on");
        parts.outText.textContent = D.outTgt;
        parts.origText.textContent = D.outSrc;
        parts.inText.textContent = D.inSrc;
        parts.trText.textContent = D.inTgt;
        [parts.out, parts.inn, parts.orig, parts.tr].forEach(x => x.classList.remove("is-off"));
      };
      const play = async () => {
        const id = ++run;
        playing = true;
        await i18n.ready;
        if (id !== run) return;
        const alive = () => id === run;
        const wait = async ms => { await sleep(ms); while (!visible && alive()) await sleep(250); return alive(); };
        labels();
        if (reduce.matches) { reset(); finalState(); playing = false; return; }
        while (alive()) {
          const D = demoData(full);
          reset();
          if (!(await wait(700))) break;
          if (full) {
            btn.classList.add("is-busy");
            if (!(await wait(450))) break;
            btn.classList.remove("is-busy");
            box.classList.add("is-on");
            parts.tip.classList.remove("is-off");
            if (!(await wait(1500))) break;
            parts.tip.classList.add("is-off");
            for (const ch of chars(D.outSrc)) {
              parts.typing.textContent += ch;
              if (!(await wait(38 + Math.random() * 60))) break;
            }
            if (!alive()) break;
            if (!(await wait(450))) break;
            parts.typing.textContent = "";
            btn.classList.add("is-busy");
          }
          parts.outText.textContent = D.outSrc;
          parts.out.classList.remove("is-off");
          if (!(await wait(full ? 500 : 900))) break;
          await scramble(parts.outText, D.outTgt, { duration: 1100 });
          if (btn) btn.classList.remove("is-busy");
          parts.origText.textContent = D.outSrc;
          parts.orig.classList.remove("is-off");
          if (!(await wait(1300))) break;
          parts.inText.textContent = D.inSrc;
          parts.inn.classList.remove("is-off");
          if (!(await wait(1200))) break;
          ctx.classList.remove("is-off");
          if (!(await wait(650))) break;
          $(".ctx__item", ctx).classList.add("is-hot");
          if (!(await wait(700))) break;
          ctx.classList.add("is-off");
          parts.trText.textContent = D.inSrc;
          parts.tr.classList.remove("is-off");
          await scramble(parts.trText, D.inTgt, { duration: 900 });
          if (!(await wait(4200))) break;
          parts.out.classList.add("is-off");
          parts.inn.classList.add("is-off");
          if (!(await wait(700))) break;
        }
        if (id === run) playing = false;
      };
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !playing) play();
      }, { threshold: 0.25 }).observe(box);
      i18n.on(() => {
        labels();
        if (reduce.matches) { reset(); finalState(); return; }
        if (playing) { run++; playing = false; if (visible) play(); }
      });
      labels();
    });
  };

  /* ── the cat ── */
  const cats = () => {
    $$(".cat").forEach(cat => {
      const pupils = $(".pupils", cat), say = $(".cat__say", cat);
      addEventListener("pointermove", e => {
        const r = cat.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height * 0.38);
        const m = Math.hypot(dx, dy) || 1;
        // Far away the eyes are turned all the way; near the face they look
        // straight at the pointer, so the pupils sit in the middle again.
        const reach = Math.min(1, m / (r.width * 1.2 || 1));
        pupils.style.transform = `translate(${((dx / m) * 2.6 * reach).toFixed(2)}px, ${((dy / m) * 1.4 * reach).toFixed(2)}px)`;
      }, { passive: true });
      let t;
      cat.addEventListener("click", () => {
        if (say) say.textContent = i18n.t("cat.meow");
        cat.classList.add("is-happy");
        clearTimeout(t);
        t = setTimeout(() => cat.classList.remove("is-happy"), 1500);
      });
    });
  };

  /* ── small things ── */
  const clock = () => {
    const els = $$("[data-clock]");
    if (!els.length) return;
    const tick = () => {
      let s = "";
      try { s = new Intl.DateTimeFormat(i18n.lang, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Minsk" }).format(new Date()); } catch {}
      els.forEach(e => (e.textContent = s));
    };
    tick();
    setInterval(tick, 15000);
    i18n.on(tick);
  };

  const copies = () => {
    $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
      const pre = b.closest(".cmd").querySelector("pre");
      const text = pre.textContent;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {}
      if (!ok) {
        const r = d.createRange(), s = getSelection();
        r.selectNodeContents(pre); s.removeAllRanges(); s.addRange(r);
        try { d.execCommand("copy"); } catch {}
        s.removeAllRanges();
      }
      const lab = $("span", b);
      b.classList.add("is-done");
      lab.textContent = i18n.t("common.copied");
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.classList.remove("is-done"); lab.textContent = i18n.t("common.copy"); }, 1800);
    }));
  };

  const reveal = () => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -10% 0px" });
    $$(".rv, .langs").forEach(el => io.observe(el));
  };

  const fitWordmark = () => {
    const marks = $$(".wordmark");
    if (!marks.length) return;
    const fit = () => marks.forEach(w => {
      const span = $("span", w);
      if (!span) return;
      w.style.fontSize = "100px";
      const k = w.clientWidth / span.getBoundingClientRect().width;
      w.style.fontSize = Math.floor(100 * k * 0.985) + "px";
    });
    fit();
    if (d.fonts) d.fonts.ready.then(fit);
    new ResizeObserver(fit).observe(d.body);
  };

  /* ── start ── */
  window.ZL = { $, $$, i18n, store, scramble, chars, sleep, reduce, on, emit, theme, demoData };
  localLinks();
  theme.label();
  theme.meta();
  langPicker();
  nav();
  mobileMenu();
  demos();
  cats();
  copies();
  reveal();
  fitWordmark();
  i18n.set(i18n.lang).then(() => { clock(); readyI18n(); });
  loader();
})();
