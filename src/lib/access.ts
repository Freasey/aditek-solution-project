import { createRemoteJWKSet, jwtVerify } from 'jose';

type AccessEnv = Pick<Env, 'ACCESS_TEAM_DOMAIN' | 'ACCESS_AUD'>;

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(teamDomain: string) {
  let jwks = jwksCache.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain));
    jwksCache.set(teamDomain, jwks);
  }
  return jwks;
}

/**
 * Verifikasi header Cf-Access-Jwt-Assertion dari Cloudflare Access.
 * Mengembalikan email pengguna, atau null bila token tidak ada/tidak valid.
 */
export async function verifyAccess(request: Request, env: AccessEnv): Promise<string | null> {
  const token = request.headers.get('cf-access-jwt-assertion');
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.replace(/\/+$/, '');
  if (!token || !teamDomain || !env.ACCESS_AUD) return null;
  try {
    const { payload } = await jwtVerify(token, jwksFor(teamDomain), {
      issuer: teamDomain,
      audience: env.ACCESS_AUD,
    });
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}
