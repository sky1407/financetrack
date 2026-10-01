-- CreateTable
CREATE TABLE "category_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_rules_categoryId_idx" ON "category_rules"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "category_rules_userId_pattern_key" ON "category_rules"("userId", "pattern");

-- AddForeignKey
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_rules" ADD CONSTRAINT "category_rules_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

