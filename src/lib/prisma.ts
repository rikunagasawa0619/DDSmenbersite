import { PrismaClient } from "@prisma/client";

declare global {
  var __ddsPrisma: PrismaClient | undefined;
}

export const prisma =
  process.env.DATABASE_URL
    ? global.__ddsPrisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })
    : null;

if (process.env.NODE_ENV !== "production" && prisma) {
  global.__ddsPrisma = prisma;
}

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL && prisma);
