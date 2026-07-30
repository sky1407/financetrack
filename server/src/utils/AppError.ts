/**
 * Očakávaná (operačná) chyba, ktorú vieme bezpečne poslať klientovi.
 * Neočakávané chyby (bugy) sa v errorHandleri logujú a klient dostane len 500.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = "Nie si prihlásený."): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = "Nemáš oprávnenie na túto akciu."): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = "Záznam sa nenašiel."): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }
}
