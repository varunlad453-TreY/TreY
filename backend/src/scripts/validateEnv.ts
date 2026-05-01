import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_KEYS = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'] as const;
const S3_REQUIRED_KEYS = ['S3_BUCKET', 'S3_REGION', 'S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const;
const GOOGLE_KEYS = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'] as const;

function getMissingKeys(keys: readonly string[]): string[] {
  return keys.filter((key) => !process.env[key] || !process.env[key]!.trim());
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function main(): void {
  const missing: string[] = [];
  const errors: string[] = [];

  missing.push(...getMissingKeys(REQUIRED_KEYS));

  const jwtSecret = process.env.JWT_SECRET?.trim() || '';
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim() || '';
  if (frontendUrl && !isValidUrl(frontendUrl)) {
    errors.push('FRONTEND_URL must be a valid http(s) URL');
  }

  const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  if (storageProvider === 's3') {
    missing.push(...getMissingKeys(S3_REQUIRED_KEYS));
  }

  const googleConfiguredCount = GOOGLE_KEYS.filter((key) => (process.env[key] || '').trim().length > 0).length;
  if (googleConfiguredCount > 0 && googleConfiguredCount < GOOGLE_KEYS.length) {
    errors.push('Google OAuth must provide GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL together');
  }

  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (callbackUrl && !isValidUrl(callbackUrl)) {
    errors.push('GOOGLE_CALLBACK_URL must be a valid http(s) URL');
  }

  const uniqueMissing = [...new Set(missing)];

  if (uniqueMissing.length > 0 || errors.length > 0) {
    console.error('[Env Validate] FAILED');
    if (uniqueMissing.length > 0) {
      console.error(`[Env Validate] Missing required keys: ${uniqueMissing.join(', ')}`);
    }
    for (const error of errors) {
      console.error(`[Env Validate] ${error}`);
    }
    process.exit(1);
  }

  console.log('[Env Validate] PASSED');
}

main();
