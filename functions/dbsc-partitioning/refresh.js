import {
  COOKIE_ATTRIBUTES,
  DBSC_COOKIE_NAME,
  SID_PATTERN,
  sessionInstruction,
} from "./register.js";

export async function onRequestPost({ request }) {
  const sid = request.headers.get("Sec-Secure-Session-Id");
  if (!sid || !SID_PATTERN.test(sid)) {
    return new Response("Missing DBSC session ID", { status: 400 });
  }
  if (!request.headers.get("Secure-Session-Response")) {
    return new Response(null, {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Secure-Session-Challenge": `"${crypto.randomUUID()}";id="${sid}"`,
      },
    });
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
