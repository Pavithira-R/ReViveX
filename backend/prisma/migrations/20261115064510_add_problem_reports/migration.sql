-- CreateTable
CREATE TABLE "problem_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "screen" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "problem_reports_status_created_at_idx" ON "problem_reports"("status", "created_at");

-- AddForeignKey
ALTER TABLE "problem_reports" ADD CONSTRAINT "problem_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
