import type { JwtPayload } from "../utils/jwt.js";

declare global {
  namespace Express {
    interface Request {
      /** Nastavené middlewarom `requireAuth` po overení JWT. */
      user?: JwtPayload;
    }
  }
}

export {};
