/**
 * Centralized environment variable configuration.
 *
 * Next.js automatically loads .env, .env.local, .env.development, and
 * .env.production files. This module provides typed access and validation
 * for all environment variables used across the application.
 */

export interface EnvConfig {
  // AI API Keys
  ANTHROPIC_API_KEY: string | undefined;
  GEMINI_API_KEY: string | undefined;

  // WordPress Integration
  WORDPRESS_URL: string | undefined;
  WORDPRESS_USERNAME: string | undefined;
  WORDPRESS_APP_PASSWORD: string | undefined;

  // Getty/iStock Integration
  GETTY_API_KEY: string | undefined;
  GETTY_API_SECRET: string | undefined;
}

/** Read all known environment variables into a typed object. */
export function getEnv(): EnvConfig {
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    WORDPRESS_URL: process.env.WORDPRESS_URL,
    WORDPRESS_USERNAME: process.env.WORDPRESS_USERNAME,
    WORDPRESS_APP_PASSWORD: process.env.WORDPRESS_APP_PASSWORD,
    GETTY_API_KEY: process.env.GETTY_API_KEY,
    GETTY_API_SECRET: process.env.GETTY_API_SECRET,
  };
}

/**
 * Require specific environment variables and return their values.
 * Throws a descriptive error if any are missing.
 */
export function requireEnv<K extends keyof EnvConfig>(
  ...keys: K[]
): Pick<EnvConfig, K> {
  const env = getEnv();
  const missing = keys.filter((k) => !env[k]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Add them to your .env.local file (see .env.example for reference).'
    );
  }

  return Object.fromEntries(keys.map((k) => [k, env[k]])) as Pick<
    EnvConfig,
    K
  >;
}

/**
 * Check which environment variable groups are configured.
 * Useful for feature-gating at runtime.
 */
export function checkEnvStatus() {
  const env = getEnv();
  return {
    hasAnthropic: !!env.ANTHROPIC_API_KEY,
    hasGemini: !!env.GEMINI_API_KEY,
    hasWordPress:
      !!env.WORDPRESS_URL &&
      !!env.WORDPRESS_USERNAME &&
      !!env.WORDPRESS_APP_PASSWORD,
    hasGetty: !!env.GETTY_API_KEY && !!env.GETTY_API_SECRET,
  };
}
