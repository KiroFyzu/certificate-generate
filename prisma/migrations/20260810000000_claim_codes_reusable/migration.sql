-- Replace the old one-code-per-slot claim mechanism with a single reusable
-- ClaimCode (event_id, code, max_uses, used_count) that many different users can
-- redeem up to max_uses times.

-- CreateTable
CREATE TABLE "ClaimCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimCode_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ClaimCode_code_key" ON "ClaimCode"("code");

-- Old claim-code slots (Certificate.claim_code) are all pre-launch test data —
-- delete them outright rather than trying to backfill into the new model.
DELETE FROM "Certificate" WHERE "claim_code" IS NOT NULL;

-- AlterTable: drop the old single-use code + bookkeeping note, add the FK to
-- the new ClaimCode a certificate may have been redeemed from.
ALTER TABLE "Certificate" DROP COLUMN "claim_code";
ALTER TABLE "Certificate" DROP COLUMN "note";
ALTER TABLE "Certificate" ADD COLUMN "claim_code_id" TEXT;

ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_claim_code_id_fkey"
    FOREIGN KEY ("claim_code_id") REFERENCES "ClaimCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
