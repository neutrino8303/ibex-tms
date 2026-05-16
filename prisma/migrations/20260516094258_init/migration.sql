-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "licenseNumber" TEXT,
    "base" TEXT,
    "hireDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Qualification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "validityPeriodDays" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserQualification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,
    "issuedDate" DATETIME NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "issuingAuthority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "linkedEvaluationId" TEXT,
    CONSTRAINT "UserQualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserQualification_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserQualification_linkedEvaluationId_fkey" FOREIGN KEY ("linkedEvaluationId") REFERENCES "Evaluation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluationForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "applicableRoles" TEXT NOT NULL,
    "defaultGradingScale" TEXT NOT NULL DEFAULT 'PASS_FAIL',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" DATETIME,
    CONSTRAINT "EvaluationForm_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "FormSection_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EvaluationForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gradingScale" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,
    CONSTRAINT "FormTask_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskQualificationLink" (
    "taskId" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,

    PRIMARY KEY ("taskId", "qualificationId"),
    CONSTRAINT "TaskQualificationLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "FormTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskQualificationLink_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "traineeId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "overallResult" TEXT,
    "evaluatorSignature" TEXT,
    "traineeSignature" TEXT,
    "signedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evaluation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EvaluationForm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluationTaskResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "passed" BOOLEAN,
    "numericGrade" INTEGER,
    "ebtGrade" TEXT,
    "comment" TEXT,
    CONSTRAINT "EvaluationTaskResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationTaskResult_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "FormTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeNumber_key" ON "User"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_role_key" ON "UserRoleAssignment"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Qualification_code_key" ON "Qualification"("code");

-- CreateIndex
CREATE INDEX "UserQualification_userId_idx" ON "UserQualification"("userId");

-- CreateIndex
CREATE INDEX "UserQualification_expiryDate_idx" ON "UserQualification"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationForm_code_version_key" ON "EvaluationForm"("code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationTaskResult_evaluationId_taskId_key" ON "EvaluationTaskResult"("evaluationId", "taskId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
