// This file is kept as a compatibility shim for legacy imports.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const prismaModule = require('@prisma/client') as { PrismaClient?: new () => unknown }
const PrismaClientCtor = prismaModule.PrismaClient

const globalForPrisma = globalThis as unknown as {
  prisma?: unknown
}

export const prisma = globalForPrisma.prisma ?? (PrismaClientCtor ? new PrismaClientCtor() : null)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
