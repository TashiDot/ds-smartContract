import { z } from 'zod';
import { getEnv } from '../config/env.js';
import { issueTokens, rotateRefreshToken } from './jwt.js';
import { Router } from 'express';

const router = Router();

const tokenSchema = z.object({
  appid: z.string().min(3),
  appsecret: z.string().min(8)
});

router.post('/token', (req, res) => {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const { appid, appsecret } = parsed.data;
  const env = getEnv();
  if (appid !== env.APP_ID || appsecret !== env.APP_SECRET) return res.status(401).json({ error: 'invalid_credentials' });
  const { accessToken, refreshToken } = issueTokens(appid);
  return res.json({ accessToken, refreshToken, tokenType: 'Bearer', expiresIn: env.ACCESS_TOKEN_TTL });
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });
router.post('/refresh', (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  try {
    const { accessToken, refreshToken } = rotateRefreshToken(parsed.data.refreshToken);
    return res.json({ accessToken, refreshToken });
  } catch (e) {
    return res.status(401).json({ error: 'invalid_refresh' });
  }
});

export default router;


