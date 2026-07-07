// Supabase Edge Function: proxy for Stormglass tide extremes.
// Keeps the paid STORMGLASS_KEY server-side (secret), off the client bundle.
//
// Deploy (from the repo root, with the Supabase CLI logged into the project):
//   supabase secrets set STORMGLASS_KEY=<key>
//   supabase functions deploy tide-extremes --no-verify-jwt
//
// The client calls: GET /functions/v1/tide-extremes?lat=<lat>&lng=<lng>

const STORMGLASS_KEY = Deno.env.get("STORMGLASS_KEY");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!STORMGLASS_KEY) {
    return json({ error: "STORMGLASS_KEY secret not configured" }, 500);
  }

  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ error: "lat and lng query params are required numbers" }, 400);
  }

  const start = new Date().toISOString();
  const end = new Date(Date.now() + 86_400_000).toISOString();
  const upstream = await fetch(
    `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start}&end=${end}`,
    { headers: { Authorization: STORMGLASS_KEY } },
  );

  if (!upstream.ok) {
    return json({ error: `stormglass responded ${upstream.status}` }, 502);
  }

  const body = await upstream.json();
  // Only the extremes list crosses the proxy; upstream meta (quota, key info) stays server-side.
  return json({ data: body.data ?? [] }, 200, {
    "Cache-Control": "public, max-age=1800",
  });
});

function json(payload: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}
