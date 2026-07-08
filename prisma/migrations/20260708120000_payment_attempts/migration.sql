CREATE TYPE "PaymentTargetType" AS ENUM ('APPOINTMENT', 'DOCUMENT');

CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "targetType" "PaymentTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '978',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'REDSYS',
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentAttempt_orderId_key" ON "PaymentAttempt"("orderId");
CREATE INDEX "PaymentAttempt_targetType_targetId_idx" ON "PaymentAttempt"("targetType", "targetId");
CREATE INDEX "PaymentAttempt_status_idx" ON "PaymentAttempt"("status");
CREATE INDEX "PaymentAttempt_createdAt_idx" ON "PaymentAttempt"("createdAt");

CREATE UNIQUE INDEX "Appointment_paymentId_key" ON "Appointment"("paymentId");
