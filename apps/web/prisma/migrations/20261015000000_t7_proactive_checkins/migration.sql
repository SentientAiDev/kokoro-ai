-- AlterTable
ALTER TABLE "NotificationSetting"
ADD COLUMN "checkInWindowStart" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN "checkInWindowEnd" TEXT NOT NULL DEFAULT '20:00',
ADD COLUMN "checkInMaxPerDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "checkInInactivityDays" INTEGER NOT NULL DEFAULT 3;

-- CreateEnum
CREATE TYPE "CheckInSuggestionStatus" AS ENUM ('pending', 'dismissed', 'snoozed', 'done');

-- CreateTable
CREATE TABLE "CheckInSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "reasonDetails" JSONB NOT NULL,
    "status" "CheckInSuggestionStatus" NOT NULL DEFAULT 'pending',
    "snoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckInSuggestion_userId_createdAt_idx" ON "CheckInSuggestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckInSuggestion_userId_status_createdAt_idx" ON "CheckInSuggestion"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "CheckInSuggestion" ADD CONSTRAINT "CheckInSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
