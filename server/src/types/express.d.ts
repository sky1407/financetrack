import type { JwtPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by the `requireAuth` middleware after verifying the JWT. */
      user?: JwtPayload;
    }
  }
}

export {};
