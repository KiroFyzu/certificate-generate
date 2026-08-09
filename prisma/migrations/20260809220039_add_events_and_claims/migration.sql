/*
  Warnings:

  - Added the required column `event_id` to the `Certificate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_date" DATETIME,
    "organizer_name" TEXT,
    "signer_name" TEXT,
    "signer_title" TEXT,
    "certificate_title" TEXT NOT NULL DEFAULT 'CERTIFICATE OF APPRECIATION',
    "completion_text" TEXT NOT NULL DEFAULT 'for outstanding participation and successfully completing',
    "template_path" TEXT,
    "issuance_mode" TEXT NOT NULL DEFAULT 'OPEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- Backfill: default Event so pre-existing Certificate rows (created before Events
-- existed) keep working. Preserves the exact text that used to be hardcoded in
-- src/app/api/certificate/download/route.ts.
INSERT INTO "Event" ("id", "name", "description", "certificate_title", "completion_text", "issuance_mode", "is_active", "created_at", "updated_at")
VALUES ('00000000-0000-4000-8000-000000000001', 'Seminar Nasional Teknologi 2026', 'Event default hasil migrasi otomatis dari data sertifikat sebelum fitur multi-event ada.', 'CERTIFICATE OF APPRECIATION', 'for outstanding participation and successfully completing', 'OPEN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "event_id" TEXT NOT NULL,
    "certificate_id" TEXT NOT NULL,
    "verification_token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "claim_code" TEXT,
    "claimed_at" DATETIME,
    "note" TEXT,
    "generation_ip" TEXT,
    "revoked_at" DATETIME,
    "revoked_reason" TEXT,
    "revoked_by" TEXT,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Certificate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Certificate_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("certificate_id", "created_at", "event_id", "generation_ip", "id", "issued_at", "status", "updated_at", "user_id", "verification_token") SELECT "certificate_id", "created_at", '00000000-0000-4000-8000-000000000001', "generation_ip", "id", "issued_at", "status", "updated_at", "user_id", "verification_token" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_certificate_id_key" ON "Certificate"("certificate_id");
CREATE UNIQUE INDEX "Certificate_claim_code_key" ON "Certificate"("claim_code");
CREATE UNIQUE INDEX "Certificate_user_id_event_id_key" ON "Certificate"("user_id", "event_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
