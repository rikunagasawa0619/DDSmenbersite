ALTER TABLE "Asset"
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "sizeBytes" INTEGER;

UPDATE "Asset"
SET "storageKey" = 'legacy/' || "id" || '-' || COALESCE("fileName", 'asset')
WHERE "storageKey" IS NULL;

ALTER TABLE "Asset"
ALTER COLUMN "storageKey" SET NOT NULL;

CREATE UNIQUE INDEX "Asset_storageKey_key" ON "Asset"("storageKey");

ALTER TABLE "EmailCampaign"
ADD COLUMN "bodyHtml" TEXT;
