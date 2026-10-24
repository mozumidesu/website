// translate.zolatau.com is served from public/translate/, everything else from public/.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname;

    if (host === "www.zolatau.com") {
      url.hostname = "zolatau.com";
      return Response.redirect(url.toString(), 301);
    }

    // The ready-made builds of the plugin are handed out by a Worker of their
    // own, so a download never depends on anything here.
    if (url.pathname === "/builds" || url.pathname.startsWith("/builds/")) {
      const rest = url.pathname.slice("/builds".length);
      return Response.redirect("https://builds.zolatau.com" + rest + url.search, 301);
    }

    const onTranslate = host.startsWith("translate.");
    const ours = host === "zolatau.com" || host.endsWith(".zolatau.com");
    const inTranslateDir = url.pathname === "/translate" || url.pathname.startsWith("/translate/");

    if (onTranslate) {
      if (inTranslateDir) {
        url.pathname = url.pathname.replace(/^\/translate/, "") || "/";
        return Response.redirect(url.toString(), 301);
      }
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return env.ASSETS.fetch(new Request(new URL("/translate/", url), request));
      }
    } else if (ours && inTranslateDir) {
      url.hostname = "translate.zolatau.com";
      url.pathname = url.pathname.replace(/^\/translate/, "") || "/";
      return Response.redirect(url.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  }
};
