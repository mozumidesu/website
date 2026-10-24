/* zolatau.com: the name that changes script */
(() => {
  "use strict";
  const { $, i18n, scramble, reduce, on, sleep } = window.ZL;
  const nameEl = $("[data-name]"), gloss = $("[data-name-gloss] span");
  if (!nameEl) return;

  const FORMS = {
    en: ["Ivan", "English"], de: ["Ivan", "Deutsch"], es: ["Iván", "Español"], fr: ["Ivan", "Français"],
    id: ["Ivan", "Bahasa Indonesia"], pt: ["Ivan", "Português"], ro: ["Ivan", "Română"], ru: ["Иван", "Русский"],
    uk: ["Іван", "Українська"], tr: ["İvan", "Türkçe"],
    vi: ["Ivan", "Tiếng Việt"], ar: ["إيفان", "العربية"], th: ["อีวาน", "ไทย"], ja: ["イヴァン", "日本語"],
    ko: ["이반", "한국어"], zh: ["伊万", "中文"]
  };
  const CYCLE = ["ru", "ja", "ar", "ko", "zh", "th", "en", "uk", "tr", "es"];
  let current = null, idx = 0, visible = true, started = false, timer = null;

  const show = async (code, first) => {
    const [text, label] = FORMS[code] || FORMS.en;
    current = code;
    if (gloss) {
      gloss.parentElement.classList.add("is-swap");
      setTimeout(() => {
        gloss.textContent = label;
        gloss.setAttribute("lang", code);
        gloss.parentElement.classList.remove("is-swap");
      }, first ? 0 : 260);
    }
    nameEl.setAttribute("lang", code);
    await scramble(nameEl, text, { duration: first ? 1100 : 900 });
  };

  const loop = async () => {
    clearTimeout(timer);
    if (reduce.matches) return;
    // 900 ms of scrambling plus a 2700 ms pause: one name every 3.6 seconds.
    timer = setTimeout(async () => {
      if (visible && !document.hidden) {
        let next = CYCLE[idx++ % CYCLE.length];
        if (FORMS[next][0] === FORMS[current][0]) next = CYCLE[idx++ % CYCLE.length];
        await show(next);
      }
      loop();
    }, 2700);
  };

  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(nameEl);

  on("ready", async () => {
    started = true;
    nameEl.textContent = "";
    await sleep(250);
    await show(i18n.lang, true);
    idx = Math.max(0, CYCLE.indexOf(i18n.lang) + 1);
    loop();
  });

  i18n.on(code => {
    if (!started) { const f = FORMS[code] || FORMS.en; nameEl.textContent = f[0]; if (gloss) gloss.textContent = f[1]; return; }
    show(code);
    idx = Math.max(0, CYCLE.indexOf(code) + 1);
    loop();
  });
})();
