import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { getEnv } from '../config/env.js';

export type JwtPayload = {
  sub: string;
  iss: string;
  aud: string;
  jti: string;
  type: 'access' | 'refresh';
};

type RefreshRecord = {
  jti: string;
  sub: string;
  family: string;
  valid: boolean;
  expiresAt: number;
};

const refreshStore = new Map<string, RefreshRecord>();

function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function issueTokens(subject: string) {
  const env = getEnv();
  const accessId = generateId();
  const refreshId = generateId();
  const family = generateId();

  const accessPayload: JwtPayload = { sub: subject, iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE, jti: accessId, type: 'access' } as JwtPayload;
  const accessToken = jwt.sign(accessPayload as unknown as jwt.JwtPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as unknown as number | undefined,
    algorithm: 'HS256'
  });

  const refreshPayload: JwtPayload = { sub: subject, iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE, jti: refreshId, type: 'refresh' } as JwtPayload;
  const refreshToken = jwt.sign(refreshPayload as unknown as jwt.JwtPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as unknown as number | undefined,
    algorithm: 'HS256'
  });

  const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
  const exp = decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 3600 * 1000;

  refreshStore.set(refreshId, { jti: refreshId, sub: subject, family, valid: true, expiresAt: exp });

  return { accessToken, refreshToken };
}

export function rotateRefreshToken(oldToken: string) {
  const env = getEnv();
  let payload: JwtPayload;
  try {
    payload = jwt.verify(oldToken, env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }) as unknown as JwtPayload;
  } catch (err) {
    throw new Error('invalid_refresh');
  }

  if (payload.type !== 'refresh') throw new Error('invalid_refresh');

  const record = refreshStore.get(payload.jti);
  if (!record || !record.valid) throw new Error('refresh_reused_or_revoked');

  // Revoke old
  record.valid = false;
  refreshStore.set(record.jti, record);

  // Issue new in same family
  const { accessToken, refreshToken } = issueTokens(payload.sub);
  return { accessToken, refreshToken };
}

export function authenticateJwt(req: Request, res: Response, next: NextFunction) {
  const env = getEnv();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ')? auth.slice(7): '';
  if (!token) return res.status(401).json({ error: 'missing_token' });

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }) as JwtPayload;
    if (decoded.type !== 'access') return res.status(401).json({ error: 'invalid_token_type' });
    (req as any).jwt = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

export function revokeFamily(subject: string) {
  for (const [key, rec] of refreshStore.entries()) {
    if (rec.sub === subject) {
      rec.valid = false;
      refreshStore.set(key, rec);
    }
  }
}


