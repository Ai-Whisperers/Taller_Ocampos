/*
  Warnings:

  - You are about to drop the column `category` on the `Service` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "serviceType" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "diagnostics" TEXT,
    "validUntil" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Estimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Estimate_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Estimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimateService_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstimateService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimatePart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EstimatePart_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstimatePart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "description" TEXT,
    "intervalMiles" INTEGER,
    "intervalMonths" INTEGER,
    "lastServiceDate" DATETIME,
    "lastServiceMileage" INTEGER,
    "nextServiceDate" DATETIME,
    "nextServiceMileage" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("createdAt", "fileName", "fileSize", "fileType", "fileUrl", "id", "uploadedBy", "workOrderId") SELECT "createdAt", "fileName", "fileSize", "fileType", "fileUrl", "id", "uploadedBy", "workOrderId" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE INDEX "Attachment_workOrderId_idx" ON "Attachment"("workOrderId");
CREATE INDEX "Attachment_createdAt_idx" ON "Attachment"("createdAt");
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "workOrderId" TEXT,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL,
    "taxRate" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "discount" REAL,
    "total" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("clientId", "createdAt", "discount", "dueDate", "id", "invoiceNumber", "issueDate", "notes", "paidAmount", "status", "subtotal", "taxAmount", "taxRate", "terms", "total", "updatedAt", "userId", "workOrderId") SELECT "clientId", "createdAt", "discount", "dueDate", "id", "invoiceNumber", "issueDate", "notes", "paidAmount", "status", "subtotal", "taxAmount", "taxRate", "terms", "total", "updatedAt", "userId", "workOrderId" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "clientId", "createdAt", "id", "invoiceId", "method", "notes", "paymentDate", "paymentNumber", "reference", "updatedAt", "userId") SELECT "amount", "clientId", "createdAt", "id", "invoiceId", "method", "notes", "paymentDate", "paymentNumber", "reference", "updatedAt", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");
CREATE INDEX "Payment_paymentNumber_idx" ON "Payment"("paymentNumber");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "Payment_clientId_idx" ON "Payment"("clientId");
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");
CREATE INDEX "Payment_method_idx" ON "Payment"("method");
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "basePrice" REAL NOT NULL,
    "estimatedHours" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Service" ("basePrice", "code", "createdAt", "description", "estimatedHours", "id", "isActive", "name", "updatedAt") SELECT "basePrice", "code", "createdAt", "description", "estimatedHours", "id", "isActive", "name", "updatedAt" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");
CREATE INDEX "Service_code_idx" ON "Service"("code");
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");
CREATE INDEX "Service_isActive_idx" ON "Service"("isActive");
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "currentStock", "id", "notes", "partId", "previousStock", "quantity", "reference", "type") SELECT "createdAt", "currentStock", "id", "notes", "partId", "previousStock", "quantity", "reference", "type" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
CREATE INDEX "StockMovement_partId_idx" ON "StockMovement"("partId");
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "vin" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "mileage" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vehicle" ("brand", "clientId", "color", "createdAt", "id", "licensePlate", "mileage", "model", "notes", "updatedAt", "vin", "year") SELECT "brand", "clientId", "color", "createdAt", "id", "licensePlate", "mileage", "model", "notes", "updatedAt", "vin", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");
CREATE INDEX "Vehicle_clientId_idx" ON "Vehicle"("clientId");
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");
CREATE TABLE "new_WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estimateId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "diagnostics" TEXT,
    "estimatedHours" REAL,
    "actualHours" REAL,
    "laborRate" REAL NOT NULL,
    "estimatedCost" REAL,
    "actualCost" REAL,
    "startDate" DATETIME,
    "completionDate" DATETIME,
    "notes" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrder" ("actualCost", "actualHours", "clientId", "completionDate", "createdAt", "description", "diagnostics", "estimatedCost", "estimatedHours", "id", "internalNotes", "laborRate", "notes", "orderNumber", "startDate", "status", "updatedAt", "userId", "vehicleId") SELECT "actualCost", "actualHours", "clientId", "completionDate", "createdAt", "description", "diagnostics", "estimatedCost", "estimatedHours", "id", "internalNotes", "laborRate", "notes", "orderNumber", "startDate", "status", "updatedAt", "userId", "vehicleId" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
CREATE UNIQUE INDEX "WorkOrder_orderNumber_key" ON "WorkOrder"("orderNumber");
CREATE INDEX "WorkOrder_orderNumber_idx" ON "WorkOrder"("orderNumber");
CREATE INDEX "WorkOrder_clientId_idx" ON "WorkOrder"("clientId");
CREATE INDEX "WorkOrder_vehicleId_idx" ON "WorkOrder"("vehicleId");
CREATE INDEX "WorkOrder_userId_idx" ON "WorkOrder"("userId");
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_createdAt_idx" ON "WorkOrder"("createdAt");
CREATE TABLE "new_WorkOrderPart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "discount" REAL,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrderPart_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrderPart" ("createdAt", "discount", "id", "notes", "partId", "quantity", "total", "unitPrice", "updatedAt", "workOrderId") SELECT "createdAt", "discount", "id", "notes", "partId", "quantity", "total", "unitPrice", "updatedAt", "workOrderId" FROM "WorkOrderPart";
DROP TABLE "WorkOrderPart";
ALTER TABLE "new_WorkOrderPart" RENAME TO "WorkOrderPart";
CREATE INDEX "WorkOrderPart_workOrderId_idx" ON "WorkOrderPart"("workOrderId");
CREATE INDEX "WorkOrderPart_partId_idx" ON "WorkOrderPart"("partId");
CREATE TABLE "new_WorkOrderService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL,
    "discount" REAL,
    "total" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkOrderService_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WorkOrderService" ("createdAt", "discount", "id", "notes", "quantity", "serviceId", "total", "unitPrice", "updatedAt", "workOrderId") SELECT "createdAt", "discount", "id", "notes", "quantity", "serviceId", "total", "unitPrice", "updatedAt", "workOrderId" FROM "WorkOrderService";
DROP TABLE "WorkOrderService";
ALTER TABLE "new_WorkOrderService" RENAME TO "WorkOrderService";
CREATE INDEX "WorkOrderService_workOrderId_idx" ON "WorkOrderService"("workOrderId");
CREATE INDEX "WorkOrderService_serviceId_idx" ON "WorkOrderService"("serviceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_name_key" ON "ServiceCategory"("name");

-- CreateIndex
CREATE INDEX "ServiceCategory_name_idx" ON "ServiceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_appointmentNumber_key" ON "Appointment"("appointmentNumber");

-- CreateIndex
CREATE INDEX "Appointment_appointmentNumber_idx" ON "Appointment"("appointmentNumber");

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "Appointment_vehicleId_idx" ON "Appointment"("vehicleId");

-- CreateIndex
CREATE INDEX "Appointment_scheduledDate_idx" ON "Appointment"("scheduledDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_estimateNumber_key" ON "Estimate"("estimateNumber");

-- CreateIndex
CREATE INDEX "Estimate_estimateNumber_idx" ON "Estimate"("estimateNumber");

-- CreateIndex
CREATE INDEX "Estimate_clientId_idx" ON "Estimate"("clientId");

-- CreateIndex
CREATE INDEX "Estimate_vehicleId_idx" ON "Estimate"("vehicleId");

-- CreateIndex
CREATE INDEX "Estimate_status_idx" ON "Estimate"("status");

-- CreateIndex
CREATE INDEX "Estimate_validUntil_idx" ON "Estimate"("validUntil");

-- CreateIndex
CREATE INDEX "EstimateService_estimateId_idx" ON "EstimateService"("estimateId");

-- CreateIndex
CREATE INDEX "EstimateService_serviceId_idx" ON "EstimateService"("serviceId");

-- CreateIndex
CREATE INDEX "EstimatePart_estimateId_idx" ON "EstimatePart"("estimateId");

-- CreateIndex
CREATE INDEX "EstimatePart_partId_idx" ON "EstimatePart"("partId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_idx" ON "MaintenanceSchedule"("vehicleId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_nextServiceDate_idx" ON "MaintenanceSchedule"("nextServiceDate");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_isActive_idx" ON "MaintenanceSchedule"("isActive");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");

-- CreateIndex
CREATE INDEX "ActivityLog_entityId_idx" ON "ActivityLog"("entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "Part_code_idx" ON "Part"("code");

-- CreateIndex
CREATE INDEX "Part_category_idx" ON "Part"("category");

-- CreateIndex
CREATE INDEX "Part_supplierId_idx" ON "Part"("supplierId");

-- CreateIndex
CREATE INDEX "Part_isActive_idx" ON "Part"("isActive");

-- CreateIndex
CREATE INDEX "Part_currentStock_idx" ON "Part"("currentStock");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
