(function () {
  // BibleBot Embed Widget Loader
  // Usage:
  // <script src="https://biblebot.life/embed.js"
  //         data-color="#C8883A"
  //         data-name="Frag den BibleBot"
  //         data-position="bottom-right"
  //         data-lang="de"
  //         defer></script>

  if (window.__biblebotEmbedLoaded) return;
  window.__biblebotEmbedLoaded = true;

  var scriptEl = document.currentScript;
  if (!scriptEl) {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf("embed.js") !== -1) {
        scriptEl = scripts[i];
        break;
      }
    }
  }
  var color = (scriptEl && scriptEl.getAttribute("data-color")) || "#C8883A";
  var name = (scriptEl && scriptEl.getAttribute("data-name")) || "Frag den BibleBot";
  var position = (scriptEl && scriptEl.getAttribute("data-position")) || "bottom-right";
  var lang = (scriptEl && scriptEl.getAttribute("data-lang")) || "de";

  var host = location.host;
  var origin = "https://biblebot.life";
  // Use current host if running locally for dev:
  if (scriptEl && scriptEl.src) {
    try {
      origin = new URL(scriptEl.src).origin;
    } catch (e) {}
  }

  var params = new URLSearchParams({
    host: host,
    color: color,
    name: name,
    lang: lang,
  });
  var iframeSrc = origin + "/embed?" + params.toString();

  var isOpen = false;
  var hPos = position.indexOf("left") !== -1 ? "left" : "right";

  // Bubble button
  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", name);
  bubble.style.cssText = [
    "position:fixed",
    "bottom:20px",
    hPos + ":20px",
    "width:60px",
    "height:60px",
    "border-radius:50%",
    "border:none",
    "background:" + color,
    "color:#fff",
    "box-shadow:0 8px 24px rgba(0,0,0,0.18)",
    "cursor:pointer",
    "z-index:2147483646",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:0",
    "font:600 14px system-ui,-apple-system,sans-serif",
    "transition:transform .2s ease",
  ].join(";");
  bubble.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  bubble.onmouseover = function () {
    bubble.style.transform = "scale(1.05)";
  };
  bubble.onmouseout = function () {
    bubble.style.transform = "scale(1)";
  };

  // Iframe container
  var container = document.createElement("div");
  container.style.cssText = [
    "position:fixed",
    "bottom:90px",
    hPos + ":20px",
    "width:380px",
    "max-width:calc(100vw - 40px)",
    "height:600px",
    "max-height:calc(100vh - 120px)",
    "border-radius:16px",
    "overflow:hidden",
    "box-shadow:0 20px 60px rgba(0,0,0,0.25)",
    "background:#fff",
    "z-index:2147483647",
    "display:none",
    "border:1px solid rgba(0,0,0,0.08)",
  ].join(";");

  var iframe = document.createElement("iframe");
  iframe.src = iframeSrc;
  iframe.title = name;
  iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
  iframe.allow = "microphone; clipboard-write";
  container.appendChild(iframe);

  function toggle() {
    isOpen = !isOpen;
    container.style.display = isOpen ? "block" : "none";
    if (isOpen) {
      try {
        // Fire-and-forget tracking call (no auth needed; goes to public endpoint)
        var img = new Image();
        img.src =
          origin +
          "/api/embed-track?host=" +
          encodeURIComponent(host) +
          "&t=" +
          Date.now();
      } catch (e) {}
    }
  }
  bubble.onclick = toggle;

  document.body.appendChild(bubble);
  document.body.appendChild(container);
})();
