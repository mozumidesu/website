/* translate.zolatau.com: install tabs and examples that follow the page language */
(() => {
  "use strict";
  const { $, $$, i18n, reduce, demoData } = window.ZL;

  const tabs = $$('[role="tab"]');
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", e => {
      const rtl = document.documentElement.dir === "rtl";
      const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
      if (next) { e.preventDefault(); select(tabs[(i + next + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
  const ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || "";
  if (/mac/i.test(ua) && !/iphone|ipad/i.test(navigator.userAgent)) select($("#tab-mac"));
  else if (/linux|x11|cros/i.test(ua) && !/android/i.test(navigator.userAgent)) select($("#tab-linux"));

  const fill = () => {
    const D = demoData(true), W = i18n.data.why || {}, K = i18n.data.keep || {};
    $$("[data-demo-t]").forEach(el => { const v = D[el.dataset.demoT]; if (v != null) el.textContent = v; });
    const src = $('[data-why="src"]'), usual = $('[data-why="usual"]'), ai = $('[data-why="ai"]');
    if (src) src.textContent = W.src || "";
    if (usual) usual.innerHTML = W.usual || "";
    if (ai) ai.textContent = W.ai || "";
    $$('[data-why="lang"]').forEach(el => (el.textContent = W.lang || ""));
    const ks = $('[data-keep="src"]'), kt = $('[data-keep="tgt"]');
    if (ks) ks.innerHTML = (K.src || "").replace(/\\([^\\]+)\\/, "<code>\\$1\\</code>");
    if (kt) kt.innerHTML = (K.tgt || "").replace(/(carpe diem)/, "<code>$1</code>");
  };
  i18n.on(fill);
  if (i18n.applied) fill();

  $$(".faq details").forEach(det => {
    const sum = $("summary", det), body = $("p", det);
    let anim = null;
    const run = (frames, opts, done) => {
      if (anim) anim.cancel();
      body.classList.add("is-moving");
      const a = anim = body.animate(frames, Object.assign({ fill: "forwards" }, opts));
      a.onfinish = () => { if (done) done(); a.cancel(); if (anim === a) anim = null; body.classList.remove("is-moving"); };
    };
    sum.addEventListener("click", e => {
      if (reduce.matches || !body.animate) return;
      e.preventDefault();
      const pad = getComputedStyle(body).paddingBlockEnd;
      if (det.open && !det.classList.contains("is-closing")) {
        det.classList.add("is-closing");
        run([{ height: body.offsetHeight + "px", paddingBlockEnd: pad, opacity: 1 }, { height: "0px", paddingBlockEnd: "0px", opacity: 0 }],
          { duration: 420, easing: "cubic-bezier(.4, 0, .2, 1)" },
          () => { det.open = false; det.classList.remove("is-closing"); });
      } else {
        det.classList.remove("is-closing");
        det.open = true;
        run([{ height: "0px", paddingBlockEnd: "0px", opacity: 0 }, { height: body.offsetHeight + "px", paddingBlockEnd: pad, opacity: 1 }],
          { duration: 480, easing: "cubic-bezier(.16, 1, .3, 1)" });
      }
    });
  });
})();
