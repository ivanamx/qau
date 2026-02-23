-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "rating" DECIMAL(3,2),
    "category" TEXT,
    "photo_url" TEXT,
    "raw_json" JSONB,
    "cached_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "conditions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_place_id_key" ON "Business"("place_id");

-- CreateIndex
CREATE INDEX "Business_category_idx" ON "Business"("category");

-- CreateIndex
CREATE INDEX "Business_cached_at_idx" ON "Business"("cached_at");

-- CreateIndex
CREATE INDEX "Business_latitude_longitude_idx" ON "Business"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Offer_business_id_idx" ON "Offer"("business_id");

-- CreateIndex
CREATE INDEX "Offer_valid_from_valid_until_idx" ON "Offer"("valid_from", "valid_until");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
