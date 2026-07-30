import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { signToken } from "../../utils/jwt.js";
import { DEFAULT_CATEGORIES } from "../categories/categories.constants.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const PASSWORD_SALT_ROUNDS = 12;

export interface AuthResult {
  token: string;
  user: { id: string; name: string; email: string };
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict("Účet s týmto e-mailom už existuje.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({ ...category, userId: created.id })),
    });

    await tx.account.create({
      data: { userId: created.id, name: "Hotovosť", type: "CASH", initialBalance: 0 },
    });

    return created;
  });

  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized("Nesprávny e-mail alebo heslo.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Nesprávny e-mail alebo heslo.");
  }

  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  if (!user) {
    throw AppError.notFound("Používateľ sa nenašiel.");
  }
  return user;
}
