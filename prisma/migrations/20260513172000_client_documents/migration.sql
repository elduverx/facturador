CREATE TYPE "ClientDocumentStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED');

CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "description" TEXT,
    "status" "ClientDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "aiAnalysis" JSONB,
    "matchedEmail" TEXT,
    "matchedScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientDocument_clientEmail_idx" ON "ClientDocument"("clientEmail");
CREATE INDEX "ClientDocument_matchedEmail_idx" ON "ClientDocument"("matchedEmail");
CREATE INDEX "ClientDocument_status_idx" ON "ClientDocument"("status");
CREATE INDEX "ClientDocument_createdAt_idx" ON "ClientDocument"("createdAt");
