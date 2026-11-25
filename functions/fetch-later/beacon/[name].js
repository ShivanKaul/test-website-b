// GET /fetch-later/beacon/<stats|ok>?k=<key> redirects to site A's hit endpoint.
// /beacon/stats matches an EasyPrivacy rule; /beacon/ok does not.

export async function onRequest({ request, params }) {
  const k = new URL(request.url).searchParams.get('k') || '';
  if (!['stats', 'ok'].includes(params.name) || !/^[a-z0-9_]{1,64}$/.test(k)) {
    return new Response(null, { status: 404 });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://test-website-a.pages.dev/fetch-later/hit?k=' + k,
      'Cache-Control': 'no-store',
    },
  });
}
