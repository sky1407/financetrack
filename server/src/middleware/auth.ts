import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

const TOKEN_COOKIE = "token";

/** Vyžaduje platný JWT (z cookie alebo Authorization headera) a naplní `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[TOKEN_COOKIE] as string | undefined;
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const token = cookieToken ?? headerToken;

  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(AppError.unauthorized("Neplatná alebo expirovaná prihlasovacia relácia."));
  }
}

export { TOKEN_COOKIE };
