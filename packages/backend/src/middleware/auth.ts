import { Context, Next } from 'hono';
import { jwt } from '@hono/jwt';
import { HTTPException } from 'hono/http-exception';

export interface JWTPayload {
  userId: string;
  githubUserId: string;
  githubUsername: string;
  orgId?: number;
}

export const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  cookie: 'token'
});

export const requireAuth = async (c: Context, next: Next) => {
  const payload = c.get('jwtPayload') as JWTPayload;
  
  if (!payload) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }
  
  c.set('user', payload);
  await next();
};

export const requireOrg = async (c: Context, next: Next) => {
  const user = c.get('user') as JWTPayload;
  
  if (!user.orgId) {
    throw new HTTPException(403, { message: 'Organization required' });
  }
  
  await next();
};