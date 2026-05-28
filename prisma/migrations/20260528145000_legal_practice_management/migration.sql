CREATE TYPE "MatterStatus" AS ENUM ('INITIAL', 'IN_PROGRESS', 'WAITING_ADMIN', 'RESOLVED', 'ARCHIVED');
CREATE TYPE "MatterPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "TimelineEventType" AS ENUM ('NOTE', 'EMAIL', 'CALL', 'DOCUMENT', 'DEADLINE', 'PAYMENT', 'STATUS_CHANGE');
CREATE TYPE "DeadlineStatus" AS ENUM ('OPEN', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "DeadlineKind" AS ENUM ('CALENDAR_DAYS', 'BUSINESS_DAYS');
CREATE TYPE "BillingDocumentType" AS ENUM ('INVOICE', 'PROVISION', 'EXPENSE', 'ENGAGEMENT_LETTER', 'QUOTE');
CREATE TYPE "BillingDocumentStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'LAWYER', 'PARALEGAL', 'ADMIN');

CREATE TABLE "Matter" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientNie" TEXT,
    "title" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "status" "MatterStatus" NOT NULL DEFAULT 'INITIAL',
    "priority" "MatterPriority" NOT NULL DEFAULT 'NORMAL',
    "responsible" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "nextActionAt" TIMESTAMP(3),
    "summary" TEXT,
    "riskNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatterTimeline" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "content" TEXT,
    "actor" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatterTimeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LegalDeadline" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'OPEN',
    "kind" "DeadlineKind" NOT NULL DEFAULT 'BUSINESS_DAYS',
    "alertDays" INTEGER NOT NULL DEFAULT 3,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDeadline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingDocument" (
    "id" TEXT NOT NULL,
    "matterId" TEXT,
    "type" "BillingDocumentType" NOT NULL DEFAULT 'INVOICE',
    "status" "BillingDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "number" TEXT,
    "concept" TEXT NOT NULL,
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatPercent" DOUBLE PRECISION NOT NULL DEFAULT 21,
    "irpfPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expenseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentPlanInstallment" (
    "id" TEXT NOT NULL,
    "billingDocumentId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentPlanInstallment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "procedureType" TEXT,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "matterId" TEXT,
    "clientEmail" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'PARALEGAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClientDocument" ADD COLUMN "matterId" TEXT;

CREATE UNIQUE INDEX "Matter_reference_key" ON "Matter"("reference");
CREATE INDEX "Matter_clientEmail_idx" ON "Matter"("clientEmail");
CREATE INDEX "Matter_status_idx" ON "Matter"("status");
CREATE INDEX "Matter_priority_idx" ON "Matter"("priority");
CREATE INDEX "Matter_nextActionAt_idx" ON "Matter"("nextActionAt");
CREATE INDEX "Matter_createdAt_idx" ON "Matter"("createdAt");
CREATE INDEX "MatterTimeline_matterId_idx" ON "MatterTimeline"("matterId");
CREATE INDEX "MatterTimeline_type_idx" ON "MatterTimeline"("type");
CREATE INDEX "MatterTimeline_createdAt_idx" ON "MatterTimeline"("createdAt");
CREATE INDEX "LegalDeadline_matterId_idx" ON "LegalDeadline"("matterId");
CREATE INDEX "LegalDeadline_dueAt_idx" ON "LegalDeadline"("dueAt");
CREATE INDEX "LegalDeadline_status_idx" ON "LegalDeadline"("status");
CREATE INDEX "BillingDocument_matterId_idx" ON "BillingDocument"("matterId");
CREATE INDEX "BillingDocument_status_idx" ON "BillingDocument"("status");
CREATE INDEX "BillingDocument_dueAt_idx" ON "BillingDocument"("dueAt");
CREATE INDEX "BillingDocument_number_idx" ON "BillingDocument"("number");
CREATE INDEX "PaymentPlanInstallment_billingDocumentId_idx" ON "PaymentPlanInstallment"("billingDocumentId");
CREATE INDEX "PaymentPlanInstallment_dueAt_idx" ON "PaymentPlanInstallment"("dueAt");
CREATE INDEX "PaymentPlanInstallment_paidAt_idx" ON "PaymentPlanInstallment"("paidAt");
CREATE INDEX "DocumentTemplate_procedureType_idx" ON "DocumentTemplate"("procedureType");
CREATE INDEX "DocumentTemplate_active_idx" ON "DocumentTemplate"("active");
CREATE INDEX "CommunicationLog_matterId_idx" ON "CommunicationLog"("matterId");
CREATE INDEX "CommunicationLog_clientEmail_idx" ON "CommunicationLog"("clientEmail");
CREATE INDEX "CommunicationLog_sentAt_idx" ON "CommunicationLog"("sentAt");
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");
CREATE INDEX "ClientDocument_matterId_idx" ON "ClientDocument"("matterId");

ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatterTimeline" ADD CONSTRAINT "MatterTimeline_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingDocument" ADD CONSTRAINT "BillingDocument_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentPlanInstallment" ADD CONSTRAINT "PaymentPlanInstallment_billingDocumentId_fkey" FOREIGN KEY ("billingDocumentId") REFERENCES "BillingDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
