import { Prisma } from "@prisma/client";

type LockedCreditWallet = {
  id: string;
  userId: string;
  currentBalance: number;
};

export async function lockCreditWallet(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<LockedCreditWallet> {
  const [locked] = await tx.$queryRaw<
    Array<{ id: string; user_id: string; current_balance: number }>
  >(
    Prisma.sql`
      SELECT id, "userId" AS user_id, "currentBalance" AS current_balance
      FROM "CreditWallet"
      WHERE "userId" = ${userId}
      FOR UPDATE
    `,
  );

  if (locked) {
    return {
      id: locked.id,
      userId: locked.user_id,
      currentBalance: locked.current_balance,
    };
  }

  try {
    const created = await tx.creditWallet.create({
      data: {
        userId,
        currentBalance: 0,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      currentBalance: created.currentBalance,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return lockCreditWallet(tx, userId);
    }

    throw error;
  }
}

export function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}
