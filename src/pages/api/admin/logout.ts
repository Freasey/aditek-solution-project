import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { sessionCookie } from '../../../lib/session';

export const POST: APIRoute = () =>
  new Response(null, { status: 303, headers: { Location: '/admin/login', 'Set-Cookie': sessionCookie(env, '', 0) } });
