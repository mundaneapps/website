export const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ||
  "https://mundaneapps.com,https://www.mundaneapps.com,http://localhost:8000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type, x-admin-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8" },
  });
}

export function originIsAllowed(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins.includes(origin);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] || character);
}
