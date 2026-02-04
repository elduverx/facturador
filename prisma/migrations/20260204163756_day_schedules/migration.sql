-- AlterTable
ALTER TABLE "OfficeSettings" ADD COLUMN     "maxAppointmentsPerDay" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DaySchedule" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lunchStartTime" TEXT,
    "lunchEndTime" TEXT,
    "slotDurationMin" INTEGER,
    "maxAppointmentsPerDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DaySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DaySchedule_date_idx" ON "DaySchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DaySchedule_date_key" ON "DaySchedule"("date");
