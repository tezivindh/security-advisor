import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';

export interface AuthRequest extends Request {
  userId?: string;
  userLogin?: string;
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      login: string;
    };

    const user = await User.findById(decoded.userId).select('+encryptedAccessToken');
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    req.userLogin = decoded.login;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; login: string };
      const user = await User.findById(decoded.userId).select('+encryptedAccessToken');
      if (user) {
        req.user = user;
        req.userId = decoded.userId;
        req.userLogin = decoded.login;
      }
    }
  } catch {
    // optional auth — ignore errors
  }
  next();
};
