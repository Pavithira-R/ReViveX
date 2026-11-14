-- CreateEnum
CREATE TYPE "EcoActionType" AS ENUM ('REPAIR', 'REUSE', 'SELL', 'DONATE', 'RECYCLE');

-- CreateTable
CREATE TABLE "eco_actions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "EcoActionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "ref_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eco_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eco_actions_user_id_idx" ON "eco_actions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "eco_actions_type_ref_id_key" ON "eco_actions"("type", "ref_id");

-- AddForeignKey
ALTER TABLE "eco_actions" ADD CONSTRAINT "eco_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
