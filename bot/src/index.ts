import { APP_ROUTES } from './appRoutes';
import { corsHeaders } from './corsHeaders';
import type { Env } from './env.type';
import { handleWebhook } from './handleWebhook';
import { runSafely } from './runSafely';
import { withCors } from './withCors';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (request.method !== 'POST') return new Response('Learn Words bot');
    if (pathname === '/telegram') return handleWebhook(request, env);

    const route = APP_ROUTES[pathname];
    if (!route) return new Response('Not found', { status: 404 });
    return withCors(await runSafely(() => route(request, env)), request, env);
  },
};
