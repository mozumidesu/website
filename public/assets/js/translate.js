/* translate.zolatau.com: examples that follow the page language */
(() => {
  "use strict";
  const { $, $$, i18n, demoData } = window.ZL;

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
})();
