-- Secondary signatory details must now be supplied by the saved active profile.
ALTER TABLE "TenantNotice" ALTER COLUMN "secondarySignatory" DROP DEFAULT;
ALTER TABLE "TenantNotice" ALTER COLUMN "secondaryTitle" DROP DEFAULT;
