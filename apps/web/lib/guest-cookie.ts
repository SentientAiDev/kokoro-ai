export const GUEST_COOKIE_NAME = 'kokoro_guest';
const GUEST_COOKIE_MAX_AGE_SECONDS = 31_536_000;

function getGuestCookieSecret() {
  const secret = process.env.GUEST_COOKIE_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'kokoro-dev-guest-secret';
  }

  throw new Error('Missing guest cookie secret: set GUEST_COOKIE_SECRET or NEXTAUTH_SECRET');
}

function encodeBase64Url(input: ArrayBuffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function hmac(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return encodeBase64Url(signature);
}

export async function signGuestId(guestId: string) {
  return `${guestId}.${await hmac(guestId, getGuestCookieSecret())}`;
}

export async function verifyGuestCookie(rawCookieValue: string | undefined | null) {
  if (!rawCookieValue) {
    return null;
  }

  const [guestId, signature] = rawCookieValue.split('.');

  if (!guestId || !signature) {
    return null;
  }

  const expectedSignature = await hmac(guestId, getGuestCookieSecret());

  if (signature !== expectedSignature) {
    return null;
  }

  return guestId;
}

export async function createSignedGuestCookieValue() {
  const guestId = crypto.randomUUID();
  const value = await signGuestId(guestId);

  return { guestId, value };
}

export function getGuestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  };
}
