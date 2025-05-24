-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" SERIAL NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);
