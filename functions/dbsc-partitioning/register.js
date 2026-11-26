export const DBSC_COOKIE_NAME = "h1_dbsc_id";
export const COOKIE_ATTRIBUTES = "Path=/dbsc-partitioning; Secure; SameSite=None; HttpOnly";
export const SID_PATTERN = /^[0-9a-f]{32}$/;

export function sessionInstruction(request, sid) {
  const origin = new URL(request.url).origin;
  return {
    session_identifier: sid,
    refresh_url: `${origin}/dbsc-partitioning/refresh`,
    scope: { origin, include_site: false },
    credentials: [
      {
        type: "cookie",
        name: DBSC_COOKIE_NAME,
        attributes: COOKIE_ATTRIBUTES,
      },
    ],
    allowed_refresh_initiators: ["*"],
  };
}

export async function onRequestPost({ request }) {
  const sid = new URL(request.url).searchParams.get("sid");
  if (!sid || !SID_PATTERN.test(sid) || !request.headers.get("Secure-Session-Response")) {
    return new Response("Invalid DBSC registration", { status: 400 });
  }
  return new Response(JSON.stringify(sessionInstruction(request, sid)), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Set-Cookie": `${DBSC_COOKIE_NAME}=${sid}; ${COOKIE_ATTRIBUTES}`,
    },
  });
}
