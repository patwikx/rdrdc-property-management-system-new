-- Store which saved profiles should populate the primary and secondary slots.
ALTER TABLE "NoticeSignatory" ADD COLUMN "activeRole" TEXT;

-- Preserve profiles already saved before active-role tracking was introduced.
-- Primary profiles have a contact number; secondary profiles do not.
UPDATE "NoticeSignatory"
SET "activeRole" = 'PRIMARY'
WHERE "id" = (
    SELECT "id"
    FROM "NoticeSignatory"
    WHERE "contact" IS NOT NULL AND BTRIM("contact") <> ''
    ORDER BY "updatedAt" DESC
    LIMIT 1
);

UPDATE "NoticeSignatory"
SET "activeRole" = 'SECONDARY'
WHERE "id" = (
    SELECT "id"
    FROM "NoticeSignatory"
    WHERE "activeRole" IS NULL
    ORDER BY "updatedAt" DESC
    LIMIT 1
);

CREATE UNIQUE INDEX "NoticeSignatory_activeRole_key" ON "NoticeSignatory"("activeRole");
