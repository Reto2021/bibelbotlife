import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://biblebot.life";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response("// Missing slug parameter", {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }

  const chatUrl = `${BASE_URL}/?church=${encodeURIComponent(slug)}&utm_source=widget&utm_medium=embed`;

  // Serve a self-contained JS widget
  const js = `
(function() {
  if (document.getElementById('bibelbot-widget')) return;

  var style = document.createElement('style');
  style.textContent = \`
    #bibelbot-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #2d5a3d;
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #bibelbot-widget-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,0,0,0.3);
    }
    #bibelbot-widget-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    #bibelbot-widget-tooltip {
      position: fixed;
      bottom: 92px;
      right: 24px;
      z-index: 99998;
      background: #fff;
      color: #1a1a1a;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 220px;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.3s, transform 0.3s;
      pointer-events: none;
    }
    #bibelbot-widget-tooltip.show {
      opacity: 1;
      transform: translateY(0);
    }
    #bibelbot-iframe-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100000;
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 48px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,0.3);
      display: none;
    }
    #bibelbot-iframe-container.open { display: block; }
    #bibelbot-iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    #bibelbot-iframe-close {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 100001;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      line-height: 1;
    }
    @media (max-width: 480px) {
      #bibelbot-iframe-container {
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        max-height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }
    }
  \`;
  document.head.appendChild(style);

  // Tooltip
  var tooltip = document.createElement('div');
  tooltip.id = 'bibelbot-widget-tooltip';
  tooltip.textContent = 'Frag die Bibel ✨';
  document.body.appendChild(tooltip);

  // Button
  var btn = document.createElement('button');
  btn.id = 'bibelbot-widget-btn';
  btn.setAttribute('aria-label', 'BibleBot öffnen');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.35 5.22 3.5 6.84V22l3.94-2.16c.82.22 1.68.34 2.56.34 5.52 0 10-4.04 10-9S17.52 2 12 2z"/><path d="M9 10h6M9 13h4"/></svg>';
  document.body.appendChild(btn);

  // Show tooltip after delay
  setTimeout(function() {
    tooltip.classList.add('show');
    setTimeout(function() { tooltip.classList.remove('show'); }, 4000);
  }, 2000);

  // Chat container
  var container = document.createElement('div');
  container.id = 'bibelbot-iframe-container';
  container.innerHTML = '<button id="bibelbot-iframe-close" aria-label="Schliessen">&times;</button><iframe src="about:blank" loading="lazy"></iframe>';
  document.body.appendChild(container);

  var isOpen = false;
  var loaded = false;

  btn.addEventListener('click', function() {
    if (!isOpen) {
      if (!loaded) {
        container.querySelector('iframe').src = '${chatUrl}';
        loaded = true;
      }
      container.classList.add('open');
      btn.style.display = 'none';
      tooltip.classList.remove('show');
      isOpen = true;
    }
  });

  container.querySelector('#bibelbot-iframe-close').addEventListener('click', function() {
    container.classList.remove('open');
    btn.style.display = 'flex';
    isOpen = false;
  });
})();
`;

  return new Response(js, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
