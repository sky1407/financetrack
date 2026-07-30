import type { CookieOptions, Request, Response } from "express";
import ms from "ms";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import { env, isProduction } from "../../config/env.js";
import { TOKEN_COOKIE } from "../../middleware/auth.js";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { getUserById, loginUser, registerUser } from "./auth.service.js";

// V produkcii môžu byť frontend a backend na rôznych doménach (napr. Vercel + Render),
// preto "none" + secure; v deve ide dopyt cez Vite proxy ako same-origin, tam stačí "lax".
const crossSiteCookieOptions: Pick<CookieOptions, "secure" | "sameSite"> = isProduction
  ? { secure: true, sameSite: "none" }
  : { secure: false, sameSite: "lax" };

// Odvodené z JWT_EXPIRES_IN, aby cookie a token vždy expirovali súčasne.
const cookieOptions: CookieOptions = {
  httpOnly: true,
  ...crossSiteCookieOptions,
  maxAge: ms(env.JWT_EXPIRES_IN),
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const { token, user } = await registerUser(input);
  res.cookie(TOKEN_COOKIE, token, cookieOptions);
  res.status(201).json({ user });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { token, user } = await loginUser(input);
  res.cookie(TOKEN_COOKIE, token, cookieOptions);
  res.json({ user });
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie(TOKEN_COOKIE, { httpOnly: true, ...crossSiteCookieOptions });
  res.status(204).send();
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const user = await getUserById(req.user.userId);
  res.json({ user });
});
