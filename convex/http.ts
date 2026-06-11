import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Web side of universal links (meettime.pl → this deployment's .convex.site).
// With the app installed iOS opens links in-app and never hits these routes;
// they serve the fallback page for people without the app, plus the
// apple-app-site-association file that powers the association.

const APPLE_TEAM_ID = "ZTRDTUL87R";
const BUNDLE_ID = "com.anonymous.meettime";
// Set when MeetTime ships to the App Store / TestFlight — the fallback page
// shows the download button only when this is non-empty.
const APP_STORE_URL = "";

const http = httpRouter();

http.route({
  path: "/.well-known/apple-app-site-association",
  method: "GET",
  handler: httpAction(async () => {
    const aasa = {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${APPLE_TEAM_ID}.${BUNDLE_ID}`,
            paths: ["/p/*", "/invite/*", "/add/*"],
          },
        ],
      },
    };
    return new Response(JSON.stringify(aasa), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Calm branded fallback page (Polish-first, mirrors the app's copy).
function fallbackPage(opts: { heading: string; body: string; appPath: string }): Response {
  const storeButton = APP_STORE_URL
    ? `<a class="btn primary" href="${APP_STORE_URL}">Pobierz z App Store</a>`
    : `<p class="muted">Apka jest na razie w testach. Poproś osobę, która wysłała ci link, o dostęp.</p>`;
  const html = `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MeetTime</title>
<style>
  body { margin:0; font-family: -apple-system, system-ui, sans-serif; background:#fafaf8; color:#1a1a1a;
         display:flex; min-height:100vh; align-items:center; justify-content:center; }
  .card { max-width:340px; padding:40px 28px; text-align:center; }
  .logo { font-weight:800; font-size:22px; color:#5DA802; margin-bottom:24px; }
  h1 { font-size:20px; margin:0 0 8px; }
  p { font-size:15px; line-height:1.5; margin:0 0 24px; }
  .muted { color:#777; font-size:13px; }
  .btn { display:block; padding:14px 20px; border-radius:14px; text-decoration:none;
         font-weight:600; font-size:15px; margin-bottom:10px; }
  .primary { background:#5DA802; color:#fff; }
  .secondary { background:#fff; border:1px solid #e4e4e0; color:#1a1a1a; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">MeetTime</div>
    <h1>${opts.heading}</h1>
    <p>${opts.body}</p>
    <a class="btn secondary" href="meettime://${opts.appPath}">Mam aplikację — otwórz</a>
    ${storeButton}
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

http.route({
  pathPrefix: "/p/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const token = new URL(req.url).pathname.slice("/p/".length).split("/")[0];
    const view = token
      ? await ctx.runQuery(api.polls.resolveByToken, { token }).catch(() => null)
      : null;
    return fallbackPage({
      heading: view?.poll ? escapeHtml(view.poll.title) : "Głosowanie na termin",
      body: "Ktoś czeka na twój głos. W aplikacji MeetTime zagłosujesz jednym kliknięciem.",
      appPath: `p/${token}`,
    });
  }),
});

http.route({
  pathPrefix: "/invite/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const token = new URL(req.url).pathname.slice("/invite/".length).split("/")[0];
    return fallbackPage({
      heading: "Zaproszenie na spotkę",
      body: "Ktoś zaprasza cię na spotkanie. Odpowiesz w aplikacji MeetTime.",
      appPath: `invite/${token}`,
    });
  }),
});

http.route({
  pathPrefix: "/add/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const code = new URL(req.url).pathname.slice("/add/".length).split("/")[0];
    return fallbackPage({
      heading: "Dodaj do znajomych",
      body: `Kod znajomego: ${escapeHtml(decodeURIComponent(code))}. Zeskanuj go w aplikacji MeetTime.`,
      appPath: `add/${code}`,
    });
  }),
});

export default http;
