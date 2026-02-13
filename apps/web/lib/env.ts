export function envFlag(name: string, defaultValue = false) {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

export const AUTH_REQUIRED = envFlag('AUTH_REQUIRED', false);
export const DEV_AUTH_BYPASS = envFlag('DEV_AUTH_BYPASS', false);
export const E2E_ENABLED = envFlag('E2E_ENABLED', false);
export const EMAIL_AUTH_ENABLED = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
