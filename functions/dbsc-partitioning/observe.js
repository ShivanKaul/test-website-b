import { trackerPage } from "./seed.js";

export async function onRequestGet() {
  return new Response(trackerPage("observe"), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
