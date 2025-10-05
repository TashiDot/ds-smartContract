export type AppEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  CORS_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ACCESS_TOKEN_TTL: string; // e.g., '15m'
  REFRESH_TOKEN_TTL: string; // e.g., '7d'
  APP_ID: string; // client credential id
  APP_SECRET: string; // client credential secret

  // Blockchain
  RPC_URL: string;
  CHAIN_ID: string; // string to keep env simple, parseInt where needed
  PRIVATE_KEY: string; // deployer / owner key
  CONTRACT_ADDRESS?: string; // set after deploy
};

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const env = process.env;
  const required = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_ISSUER',
    'JWT_AUDIENCE',
    'ACCESS_TOKEN_TTL',
    'REFRESH_TOKEN_TTL',
    'APP_ID',
    'APP_SECRET',
    'RPC_URL',
    'CHAIN_ID',
    'PRIVATE_KEY'
  ];

  for (const key of required) {
    if (!env[key] || env[key] === '') {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  cachedEnv = {
    NODE_ENV: (env.NODE_ENV as AppEnv['NODE_ENV']) || 'development',
    PORT: env.PORT ? parseInt(env.PORT, 10) : 4000,
    CORS_ORIGIN: env.CORS_ORIGIN || '*',
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET!,
    JWT_ISSUER: env.JWT_ISSUER!,
    JWT_AUDIENCE: env.JWT_AUDIENCE!,
    ACCESS_TOKEN_TTL: env.ACCESS_TOKEN_TTL!,
    REFRESH_TOKEN_TTL: env.REFRESH_TOKEN_TTL!,
    APP_ID: env.APP_ID!,
    APP_SECRET: env.APP_SECRET!,
    RPC_URL: env.RPC_URL!,
    CHAIN_ID: env.CHAIN_ID!,
    PRIVATE_KEY: env.PRIVATE_KEY!,
    CONTRACT_ADDRESS: env.CONTRACT_ADDRESS
  };

  return cachedEnv;
}


