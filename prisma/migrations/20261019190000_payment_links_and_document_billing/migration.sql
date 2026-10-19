-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
DO $$ BEGIN
    ALTER TYPE "PaymentTargetType" ADD VALUE 'PAYMENT_LINK';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CARD';

-- AlterTable
ALTER TABLE "ClientDocument" ADD COLUMN IF NOT EXISTS "amountDue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "paymentId" TEXT;

-- AlterTable
ALTER TABLE "DaySchedule" ADD COLUMN IF NOT EXISTS "allowedModality" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentLink" (
    "id" TEXT NOT NULL,
    "reference" TEXT,
    "concept" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLink_reference_key" ON "PaymentLink"("reference");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLink_paymentId_key" ON "PaymentLink"("paymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentLink_clientEmail_idx" ON "PaymentLink"("clientEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentLink_status_idx" ON "PaymentLink"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ClientDocument_paymentId_key" ON "ClientDocument"("paymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClientDocument_paymentId_idx" ON "ClientDocument"("paymentId");
