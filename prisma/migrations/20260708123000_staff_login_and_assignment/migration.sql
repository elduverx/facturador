ALTER TABLE "StaffUser" ADD COLUMN "loginSlug" TEXT;
ALTER TABLE "StaffUser" ADD COLUMN "pinHash" TEXT;

ALTER TABLE "Appointment" ADD COLUMN "staffUserId" TEXT;

CREATE UNIQUE INDEX "StaffUser_loginSlug_key" ON "StaffUser"("loginSlug");
CREATE INDEX "Appointment_staffUserId_idx" ON "Appointment"("staffUserId");

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffUserId_fkey"
FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "StaffUser" WHERE "loginSlug" = 'luz') THEN
    UPDATE "StaffUser" SET "name" = 'Luz', "role" = 'LAWYER', "active" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "loginSlug" = 'luz';
  ELSIF EXISTS (SELECT 1 FROM "StaffUser" WHERE "email" = 'luz@pvabogadas.local') THEN
    UPDATE "StaffUser" SET "name" = 'Luz', "loginSlug" = 'luz', "role" = 'LAWYER', "active" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "email" = 'luz@pvabogadas.local';
  ELSE
    INSERT INTO "StaffUser" ("id", "name", "email", "loginSlug", "role", "active", "createdAt", "updatedAt")
    VALUES ('staff_luz', 'Luz', 'luz@pvabogadas.local', 'luz', 'LAWYER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;

  IF EXISTS (SELECT 1 FROM "StaffUser" WHERE "loginSlug" = 'diana') THEN
    UPDATE "StaffUser" SET "name" = 'Diana', "role" = 'LAWYER', "active" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "loginSlug" = 'diana';
  ELSIF EXISTS (SELECT 1 FROM "StaffUser" WHERE "email" = 'diana@pvabogadas.local') THEN
    UPDATE "StaffUser" SET "name" = 'Diana', "loginSlug" = 'diana', "role" = 'LAWYER', "active" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "email" = 'diana@pvabogadas.local';
  ELSE
    INSERT INTO "StaffUser" ("id", "name", "email", "loginSlug", "role", "active", "createdAt", "updatedAt")
    VALUES ('staff_diana', 'Diana', 'diana@pvabogadas.local', 'diana', 'LAWYER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END IF;
END $$;
