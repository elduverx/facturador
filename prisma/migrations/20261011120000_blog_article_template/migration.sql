-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN "category" TEXT,
ADD COLUMN "sections" JSONB,
ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
