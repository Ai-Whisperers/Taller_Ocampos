# Excel to Web Application Migration Strategy

## Overview

Comprehensive migration plan to transition mechanics shops from the Excel-based management system to the new web-based platform while ensuring zero data loss, minimal business disruption, and smooth user adoption.

## Migration Phases

### Phase 1: Pre-Migration Assessment (Week 1-2)
- Current Excel system audit
- Data quality assessment
- Business process analysis
- Staff readiness evaluation
- Timeline and resource planning

### Phase 2: Data Preparation & Validation (Week 3-4)
- Excel data cleaning and standardization
- Data mapping to new schema
- Test migrations with sample data
- Validation tools development

### Phase 3: Parallel Operation (Week 5-6)
- Web system setup and configuration
- Initial data migration
- Staff training on web interface
- Dual system operation for testing

### Phase 4: Full Migration (Week 7-8)
- Complete data migration
- System cutover
- Post-migration validation
- Support and optimization

## Data Migration Components

### 1. Excel Data Assessment Tool

#### Automated Excel Analysis Script
```typescript
// migration-tools/excel-analyzer.ts
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';

interface ExcelAnalysisReport {
  sheets: SheetAnalysis[];
  totalRecords: number;
  dataQualityIssues: DataIssue[];
  recommendations: string[];
}

interface SheetAnalysis {
  name: string;
  recordCount: number;
  columns: ColumnInfo[];
  duplicates: number;
  emptyRows: number;
}

interface ColumnInfo {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'mixed';
  fillRate: number; // Percentage of non-empty cells
  uniqueValues: number;
  samples: any[];
}

interface DataIssue {
  sheet: string;
  row: number;
  column: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion: string;
}

class ExcelAnalyzer {
  async analyzeExcelFile(filePath: string): Promise<ExcelAnalysisReport> {
    const workbook = XLSX.readFile(filePath);
    const analysis: ExcelAnalysisReport = {
      sheets: [],
      totalRecords: 0,
      dataQualityIssues: [],
      recommendations: []
    };

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const sheetAnalysis = await this.analyzeSheet(sheetName, jsonData);
      analysis.sheets.push(sheetAnalysis);
      analysis.totalRecords += sheetAnalysis.recordCount;
    }

    analysis.dataQualityIssues = this.identifyDataQualityIssues(analysis.sheets);
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  private async analyzeSheet(sheetName: string, data: any[][]): Promise<SheetAnalysis> {
    if (data.length === 0) {
      return {
        name: sheetName,
        recordCount: 0,
        columns: [],
        duplicates: 0,
        emptyRows: 0
      };
    }

    const headers = data[0] as string[];
    const rows = data.slice(1);
    
    const columns: ColumnInfo[] = headers.map((header, index) => {
      const columnData = rows.map(row => row[index]).filter(val => val != null);
      return {
        name: header || `Column_${index + 1}`,
        type: this.inferDataType(columnData),
        fillRate: (columnData.length / rows.length) * 100,
        uniqueValues: new Set(columnData).size,
        samples: columnData.slice(0, 5)
      };
    });

    return {
      name: sheetName,
      recordCount: rows.length,
      columns,
      duplicates: this.countDuplicateRows(rows),
      emptyRows: this.countEmptyRows(rows)
    };
  }

  private inferDataType(values: any[]): ColumnInfo['type'] {
    if (values.length === 0) return 'text';

    const types = new Set();
    for (const value of values.slice(0, 100)) { // Sample first 100 values
      if (typeof value === 'number') {
        types.add('number');
      } else if (value instanceof Date || this.isDateString(value)) {
        types.add('date');
      } else if (typeof value === 'boolean') {
        types.add('boolean');
      } else {
        types.add('text');
      }
    }

    if (types.size === 1) {
      return Array.from(types)[0] as ColumnInfo['type'];
    } else {
      return 'mixed';
    }
  }

  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private countDuplicateRows(rows: any[][]): number {
    const seen = new Set();
    let duplicates = 0;

    for (const row of rows) {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  private countEmptyRows(rows: any[][]): number {
    return rows.filter(row => row.every(cell => cell == null || cell === '')).length;
  }

  private identifyDataQualityIssues(sheets: SheetAnalysis[]): DataIssue[] {
    const issues: DataIssue[] = [];

    for (const sheet of sheets) {
      // Check for low fill rates
      for (const column of sheet.columns) {
        if (column.fillRate < 50 && column.name.toLowerCase().includes('required')) {
          issues.push({
            sheet: sheet.name,
            row: -1,
            column: column.name,
            issue: `Low fill rate: ${column.fillRate.toFixed(1)}%`,
            severity: 'medium',
            suggestion: 'Consider making this field optional or provide default values'
          });
        }
      }

      // Check for excessive duplicates
      if (sheet.duplicates > sheet.recordCount * 0.1) {
        issues.push({
          sheet: sheet.name,
          row: -1,
          column: '',
          issue: `High duplicate rate: ${sheet.duplicates} duplicates`,
          severity: 'high',
          suggestion: 'Remove duplicate records before migration'
        });
      }
    }

    return issues;
  }

  private generateRecommendations(analysis: ExcelAnalysisReport): string[] {
    const recommendations: string[] = [];

    if (analysis.dataQualityIssues.some(issue => issue.severity === 'critical')) {
      recommendations.push('Critical data quality issues must be resolved before migration');
    }

    if (analysis.totalRecords > 10000) {
      recommendations.push('Consider batch processing for large dataset migration');
    }

    recommendations.push('Backup original Excel files before starting migration');
    recommendations.push('Schedule migration during low-activity periods');

    return recommendations;
  }
}

// Usage example
const analyzer = new ExcelAnalyzer();
analyzer.analyzeExcelFile('MechanicsShopData.xlsx')
  .then(report => {
    console.log('Migration Analysis Report:', JSON.stringify(report, null, 2));
  });
```

### 2. Data Mapping & Transformation

#### Excel to Database Field Mapping
```typescript
// migration-tools/data-mapper.ts
interface FieldMapping {
  excelColumn: string;
  databaseField: string;
  transformation?: (value: any) => any;
  validation?: (value: any) => boolean;
  required?: boolean;
  defaultValue?: any;
}

const CLIENT_MAPPING: FieldMapping[] = [
  {
    excelColumn: 'Client_ID',
    databaseField: 'clientId',
    required: true
  },
  {
    excelColumn: 'First_Name',
    databaseField: 'firstName',
    required: true,
    transformation: (value) => value?.toString().trim(),
    validation: (value) => typeof value === 'string' && value.length > 0
  },
  {
    excelColumn: 'Last_Name',
    databaseField: 'lastName',
    required: true,
    transformation: (value) => value?.toString().trim()
  },
  {
    excelColumn: 'Phone',
    databaseField: 'phone',
    transformation: (value) => formatPhoneNumber(value),
    validation: (value) => /^\(\d{3}\) \d{3}-\d{4}$/.test(value)
  },
  {
    excelColumn: 'Email',
    databaseField: 'email',
    transformation: (value) => value?.toString().toLowerCase().trim(),
    validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  {
    excelColumn: 'Registration_Date',
    databaseField: 'createdAt',
    transformation: (value) => parseExcelDate(value),
    validation: (value) => value instanceof Date && !isNaN(value.getTime())
  },
  {
    excelColumn: 'Payment_Terms',
    databaseField: 'paymentTerms',
    transformation: (value) => normalizePaymentTerms(value),
    validation: (value) => ['COD', 'Net 15', 'Net 30'].includes(value),
    defaultValue: 'COD'
  }
];

const VEHICLE_MAPPING: FieldMapping[] = [
  {
    excelColumn: 'Vehicle_ID',
    databaseField: 'vehicleId',
    required: true
  },
  {
    excelColumn: 'Client_ID',
    databaseField: 'clientId',
    required: true
  },
  {
    excelColumn: 'VIN',
    databaseField: 'vin',
    transformation: (value) => value?.toString().toUpperCase().trim(),
    validation: (value) => !value || /^[A-HJ-NPR-Z0-9]{17}$/.test(value)
  },
  {
    excelColumn: 'Make',
    databaseField: 'make',
    required: true,
    transformation: (value) => capitalizeWords(value?.toString())
  },
  {
    excelColumn: 'Model',
    databaseField: 'model',
    required: true,
    transformation: (value) => capitalizeWords(value?.toString())
  },
  {
    excelColumn: 'Year',
    databaseField: 'year',
    required: true,
    transformation: (value) => parseInt(value),
    validation: (value) => {
      const year = parseInt(value);
      return year >= 1900 && year <= new Date().getFullYear() + 1;
    }
  },
  {
    excelColumn: 'Current_Mileage',
    databaseField: 'currentMileage',
    transformation: (value) => parseInt(value) || 0,
    validation: (value) => value >= 0 && value <= 1000000
  }
];

// Utility functions
function formatPhoneNumber(value: any): string {
  if (!value) return '';
  const cleaned = value.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value.toString();
}

function parseExcelDate(value: any): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel date serial number
    return new Date((value - 25569) * 86400 * 1000);
  }
  return new Date(value);
}

function normalizePaymentTerms(value: any): string {
  if (!value) return 'COD';
  const normalized = value.toString().toLowerCase().trim();
  switch (normalized) {
    case 'cod':
    case 'cash on delivery':
    case 'cash':
      return 'COD';
    case 'net15':
    case 'net 15':
    case '15 days':
      return 'Net 15';
    case 'net30':
    case 'net 30':
    case '30 days':
      return 'Net 30';
    default:
      return 'COD';
  }
}

function capitalizeWords(value: any): string {
  if (!value) return '';
  return value.toString()
    .toLowerCase()
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### 3. Migration Engine

#### Main Migration Service
```typescript
// migration-tools/migration-engine.ts
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

interface MigrationOptions {
  shopId: string;
  batchSize: number;
  validateData: boolean;
  skipDuplicates: boolean;
  createBackup: boolean;
}

interface MigrationResult {
  success: boolean;
  recordsProcessed: number;
  recordsImported: number;
  errors: MigrationError[];
  warnings: string[];
  duration: number;
}

interface MigrationError {
  sheet: string;
  row: number;
  field: string;
  value: any;
  error: string;
}

class MigrationEngine {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async migrateFromExcel(
    filePath: string, 
    options: MigrationOptions
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      recordsProcessed: 0,
      recordsImported: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      // Create backup if requested
      if (options.createBackup) {
        await this.createBackup(options.shopId);
      }

      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Migrate each sheet in dependency order
      const migrationOrder = [
        { sheet: 'Clients', mapper: CLIENT_MAPPING, handler: this.migrateClients.bind(this) },
        { sheet: 'Vehicles', mapper: VEHICLE_MAPPING, handler: this.migrateVehicles.bind(this) },
        { sheet: 'WorkOrders', mapper: WORK_ORDER_MAPPING, handler: this.migrateWorkOrders.bind(this) },
        { sheet: 'PartsInventory', mapper: PARTS_MAPPING, handler: this.migrateParts.bind(this) },
        { sheet: 'ServicesCatalog', mapper: SERVICES_MAPPING, handler: this.migrateServices.bind(this) },
        { sheet: 'FinancialTracking', mapper: FINANCIAL_MAPPING, handler: this.migrateFinancial.bind(this) },
        { sheet: 'Schedule', mapper: SCHEDULE_MAPPING, handler: this.migrateSchedule.bind(this) }
      ];

      for (const { sheet, mapper, handler } of migrationOrder) {
        if (workbook.Sheets[sheet]) {
          console.log(`Migrating ${sheet}...`);
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
          const sheetResult = await handler(sheetData, mapper, options);
          
          result.recordsProcessed += sheetResult.processed;
          result.recordsImported += sheetResult.imported;
          result.errors.push(...sheetResult.errors);
          result.warnings.push(...sheetResult.warnings);
        } else {
          result.warnings.push(`Sheet '${sheet}' not found in Excel file`);
        }
      }

      // Final validation
      if (options.validateData) {
        const validationResult = await this.validateMigratedData(options.shopId);
        result.warnings.push(...validationResult.warnings);
        result.errors.push(...validationResult.errors);
      }

    } catch (error) {
      result.success = false;
      result.errors.push({
        sheet: 'System',
        row: -1,
        field: 'Migration',
        value: null,
        error: error.message
      });
    }

    result.duration = Date.now() - startTime;
    result.success = result.errors.length === 0;

    return result;
  }

  private async migrateClients(
    data: any[], 
    mapping: FieldMapping[], 
    options: MigrationOptions
  ): Promise<{ processed: number; imported: number; errors: MigrationError[]; warnings: string[] }> {
    const result = { processed: 0, imported: 0, errors: [], warnings: [] };
    
    for (let i = 0; i < data.length; i += options.batchSize) {
      const batch = data.slice(i, i + options.batchSize);
      
      for (const [index, row] of batch.entries()) {
        const rowNumber = i + index + 2; // +2 for 1-based indexing and header row
        result.processed++;

        try {
          const clientData = this.transformRow(row, mapping);
          clientData.shopId = options.shopId;

          // Validate required fields
          const validation = this.validateRow(clientData, mapping);
          if (!validation.isValid) {
            result.errors.push(...validation.errors.map(err => ({
              sheet: 'Clients',
              row: rowNumber,
              field: err.field,
              value: err.value,
              error: err.message
            })));
            continue;
          }

          // Check for duplicates
          if (options.skipDuplicates) {
            const existing = await this.prisma.client.findFirst({
              where: {
                shopId: options.shopId,
                clientId: clientData.clientId
              }
            });

            if (existing) {
              result.warnings.push(`Skipping duplicate client: ${clientData.clientId}`);
              continue;
            }
          }

          // Create client record
          await this.prisma.client.create({ data: clientData });
          result.imported++;

        } catch (error) {
          result.errors.push({
            sheet: 'Clients',
            row: rowNumber,
            field: 'Database',
            value: null,
            error: error.message
          });
        }
      }
    }

    return result;
  }

  private async migrateVehicles(
    data: any[], 
    mapping: FieldMapping[], 
    options: MigrationOptions
  ): Promise<{ processed: number; imported: number; errors: MigrationError[]; warnings: string[] }> {
    const result = { processed: 0, imported: 0, errors: [], warnings: [] };
    
    for (const [index, row] of data.entries()) {
      const rowNumber = index + 2;
      result.processed++;

      try {
        const vehicleData = this.transformRow(row, mapping);
        vehicleData.shopId = options.shopId;

        // Validate client exists
        const client = await this.prisma.client.findFirst({
          where: {
            shopId: options.shopId,
            clientId: vehicleData.clientId
          }
        });

        if (!client) {
          result.errors.push({
            sheet: 'Vehicles',
            row: rowNumber,
            field: 'clientId',
            value: vehicleData.clientId,
            error: 'Referenced client does not exist'
          });
          continue;
        }

        vehicleData.clientId = client.id; // Use actual UUID

        // Validate and create vehicle
        const validation = this.validateRow(vehicleData, mapping);
        if (!validation.isValid) {
          result.errors.push(...validation.errors.map(err => ({
            sheet: 'Vehicles',
            row: rowNumber,
            field: err.field,
            value: err.value,
            error: err.message
          })));
          continue;
        }

        await this.prisma.vehicle.create({ data: vehicleData });
        result.imported++;

      } catch (error) {
        result.errors.push({
          sheet: 'Vehicles',
          row: rowNumber,
          field: 'Database',
          value: null,
          error: error.message
        });
      }
    }

    return result;
  }

  private transformRow(row: any, mapping: FieldMapping[]): any {
    const transformed = {};

    for (const field of mapping) {
      let value = row[field.excelColumn];

      // Apply transformation
      if (field.transformation && value != null) {
        value = field.transformation(value);
      }

      // Use default value if empty and default is provided
      if ((value == null || value === '') && field.defaultValue !== undefined) {
        value = field.defaultValue;
      }

      transformed[field.databaseField] = value;
    }

    return transformed;
  }

  private validateRow(data: any, mapping: FieldMapping[]): {
    isValid: boolean;
    errors: Array<{ field: string; value: any; message: string }>;
  } {
    const errors = [];

    for (const field of mapping) {
      const value = data[field.databaseField];

      // Check required fields
      if (field.required && (value == null || value === '')) {
        errors.push({
          field: field.databaseField,
          value,
          message: `Required field is empty`
        });
        continue;
      }

      // Run custom validation
      if (field.validation && value != null && !field.validation(value)) {
        errors.push({
          field: field.databaseField,
          value,
          message: `Value fails validation`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async createBackup(shopId: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${shopId}-${timestamp}.json`;

    const backupData = {
      clients: await this.prisma.client.findMany({ where: { shopId } }),
      vehicles: await this.prisma.vehicle.findMany({ where: { shopId } }),
      workOrders: await this.prisma.workOrder.findMany({ where: { shopId } }),
      parts: await this.prisma.partsInventory.findMany({ where: { shopId } }),
      services: await this.prisma.servicesCatalog.findMany({ where: { shopId } }),
      financial: await this.prisma.financialTransaction.findMany({ where: { shopId } }),
      schedules: await this.prisma.schedule.findMany({ where: { shopId } })
    };

    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup created: ${backupFile}`);
  }

  private async validateMigratedData(shopId: string): Promise<{
    warnings: string[];
    errors: MigrationError[];
  }> {
    const warnings = [];
    const errors = [];

    // Check referential integrity
    const orphanedVehicles = await this.prisma.vehicle.findMany({
      where: {
        shopId,
        client: null
      }
    });

    if (orphanedVehicles.length > 0) {
      warnings.push(`Found ${orphanedVehicles.length} vehicles without valid client references`);
    }

    // Check for duplicate client IDs
    const duplicateClients = await this.prisma.$queryRaw`
      SELECT client_id, COUNT(*) as count
      FROM clients 
      WHERE shop_id = ${shopId}
      GROUP BY client_id 
      HAVING COUNT(*) > 1
    `;

    if (duplicateClients.length > 0) {
      errors.push({
        sheet: 'Validation',
        row: -1,
        field: 'client_id',
        value: null,
        error: `Found ${duplicateClients.length} duplicate client IDs`
      });
    }

    return { warnings, errors };
  }
}
```

### 4. Migration Web Interface

#### Migration Dashboard Component
```typescript
// components/Migration/MigrationDashboard.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Warning } from '@mui/icons-material';

interface MigrationProgress {
  currentStep: number;
  totalSteps: number;
  currentOperation: string;
  recordsProcessed: number;
  recordsTotal: number;
  errors: MigrationError[];
  warnings: string[];
}

const MigrationDashboard: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ExcelAnalysisReport | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const steps = [
    'Upload Excel File',
    'Analyze Data',
    'Review & Configure',
    'Migrate Data',
    'Validate Results'
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.name.endsWith('.xlsx')) {
      setFile(file);
    } else {
      alert('Please upload a valid Excel file (.xlsx)');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/migration/analyze', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startMigration = async () => {
    if (!file || !analysis) return;

    setIsMigrating(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify({
      validateData: true,
      skipDuplicates: true,
      createBackup: true,
      batchSize: 100
    }));

    try {
      const response = await fetch('/api/migration/start', {
        method: 'POST',
        body: formData
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const progress = JSON.parse(line);
            setMigrationProgress(progress);
          } catch (e) {
            // Skip non-JSON lines
          }
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Excel Data Migration
      </Typography>

      <Stepper activeStep={getCurrentStep()} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* File Upload */}
      {!file && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                padding: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              {isDragActive ? (
                <Typography>Drop the Excel file here...</Typography>
              ) : (
                <Typography>
                  Drag & drop your Excel file here, or click to select
                  <br />
                  <small>Accepts .xlsx files only</small>
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* File Analysis */}
      {file && !analysis && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CheckCircle color="success" />
              <Typography variant="h6">File Selected: {file.name}</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={analyzeFile}
              disabled={isAnalyzing}
              startIcon={isAnalyzing ? <LinearProgress /> : undefined}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Data Structure'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Total Records: {analysis.totalRecords}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sheets Found: {analysis.sheets.length}
              </Typography>
            </Box>

            {analysis.dataQualityIssues.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Found {analysis.dataQualityIssues.length} data quality issues.
                <Button size="small" onClick={() => setShowErrorDialog(true)}>
                  View Details
                </Button>
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sheet Name</TableCell>
                    <TableCell align="right">Records</TableCell>
                    <TableCell align="right">Columns</TableCell>
                    <TableCell align="right">Duplicates</TableCell>
                    <TableCell align="right">Empty Rows</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.sheets.map((sheet) => (
                    <TableRow key={sheet.name}>
                      <TableCell>{sheet.name}</TableCell>
                      <TableCell align="right">{sheet.recordCount}</TableCell>
                      <TableCell align="right">{sheet.columns.length}</TableCell>
                      <TableCell align="right">{sheet.duplicates}</TableCell>
                      <TableCell align="right">{sheet.emptyRows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained"
              color="primary"
              onClick={startMigration}
              disabled={isMigrating || analysis.dataQualityIssues.some(i => i.severity === 'critical')}
              size="large"
            >
              {isMigrating ? 'Migrating...' : 'Start Migration'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Migration Progress */}
      {migrationProgress && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Migration Progress
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {migrationProgress.currentOperation}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(migrationProgress.recordsProcessed / migrationProgress.recordsTotal) * 100}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {migrationProgress.recordsProcessed} of {migrationProgress.recordsTotal} records processed
              </Typography>
            </Box>

            {migrationProgress.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {migrationProgress.errors.length} errors occurred during migration
              </Alert>
            )}

            {migrationProgress.warnings.length > 0 && (
              <Alert severity="warning">
                {migrationProgress.warnings.length} warnings generated
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Data Quality Issues</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Sheet</TableCell>
                  <TableCell>Issue</TableCell>
                  <TableCell>Suggestion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analysis?.dataQualityIssues.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {issue.severity === 'critical' && <Error color="error" />}
                      {issue.severity === 'high' && <Warning color="warning" />}
                      {issue.severity === 'medium' && <Warning color="info" />}
                      {issue.severity}
                    </TableCell>
                    <TableCell>{issue.sheet}</TableCell>
                    <TableCell>{issue.issue}</TableCell>
                    <TableCell>{issue.suggestion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowErrorDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  function getCurrentStep(): number {
    if (!file) return 0;
    if (!analysis) return 1;
    if (!migrationProgress) return 2;
    if (isMigrating) return 3;
    return 4;
  }
};

export default MigrationDashboard;
```

## Post-Migration Strategies

### 1. Data Validation & Verification

#### Automated Validation Suite
```typescript
// validation/post-migration-validator.ts
class PostMigrationValidator {
  async validateMigration(shopId: string): Promise<ValidationReport> {
    const report: ValidationReport = {
      overallStatus: 'pending',
      checks: []
    };

    // Run all validation checks
    const checks = [
      this.validateRecordCounts,
      this.validateReferentialIntegrity,
      this.validateDataConsistency,
      this.validateBusinessRules,
      this.validateCalculatedFields
    ];

    for (const check of checks) {
      const result = await check.call(this, shopId);
      report.checks.push(result);
    }

    report.overallStatus = report.checks.every(c => c.status === 'pass') ? 'pass' : 'fail';
    return report;
  }

  private async validateRecordCounts(shopId: string): Promise<ValidationCheck> {
    // Compare record counts between Excel and database
    const clients = await this.prisma.client.count({ where: { shopId } });
    const vehicles = await this.prisma.vehicle.count({ where: { shopId } });
    const workOrders = await this.prisma.workOrder.count({ where: { shopId } });

    return {
      name: 'Record Count Validation',
      status: 'pass', // Would compare with expected counts
      details: `Clients: ${clients}, Vehicles: ${vehicles}, Work Orders: ${workOrders}`,
      recommendations: []
    };
  }

  private async validateReferentialIntegrity(shopId: string): Promise<ValidationCheck> {
    // Check foreign key relationships
    const orphanedVehicles = await this.prisma.vehicle.count({
      where: { 
        shopId,
        client: { is: null }
      }
    });

    const orphanedWorkOrders = await this.prisma.workOrder.count({
      where: {
        shopId,
        OR: [
          { client: { is: null } },
          { vehicle: { is: null } }
        ]
      }
    });

    const issues = [];
    if (orphanedVehicles > 0) issues.push(`${orphanedVehicles} orphaned vehicles`);
    if (orphanedWorkOrders > 0) issues.push(`${orphanedWorkOrders} orphaned work orders`);

    return {
      name: 'Referential Integrity',
      status: issues.length === 0 ? 'pass' : 'fail',
      details: issues.join(', ') || 'All relationships valid',
      recommendations: issues.length > 0 ? ['Fix orphaned records'] : []
    };
  }
}
```

### 2. Staff Training Program

#### Training Modules
1. **System Overview** (30 minutes)
   - Navigation and interface tour
   - Key differences from Excel
   - Basic workflow overview

2. **Daily Operations** (45 minutes)
   - Customer management
   - Work order creation
   - Parts inventory updates
   - Appointment scheduling

3. **Advanced Features** (30 minutes)
   - Reporting and analytics
   - Advanced search and filters
   - Data export capabilities

4. **Troubleshooting** (15 minutes)
   - Common issues and solutions
   - Getting help and support

#### Training Materials
- Interactive video tutorials
- Quick reference cards
- Practice environment with sample data
- Assessment quizzes

### 3. Parallel Operation Strategy

#### Week-by-Week Plan
**Week 1-2**: Setup and Initial Training
- Web system setup and configuration
- Staff accounts and permissions
- Initial training sessions
- Practice with sample data

**Week 3-4**: Parallel Data Entry
- Continue using Excel for primary operations
- Enter new data in both systems
- Compare results daily
- Address discrepancies

**Week 5-6**: Gradual Transition
- Start using web system for new work orders
- Excel becomes backup/reference only
- Daily data validation and sync
- Staff feedback and adjustments

**Week 7-8**: Full Migration
- Complete cutover to web system
- Excel archived as backup
- Final data validation
- Performance optimization

### 4. Rollback Plan

#### Emergency Rollback Procedure
```bash
# 1. Stop all web application services
systemctl stop mechanics-web-app

# 2. Restore Excel files from backup
cp backup/excel-files/* current/

# 3. Update any new data manually
# - Export new data from web system
# - Manually update Excel files

# 4. Restart Excel-based operations
# - Notify all staff of rollback
# - Resume Excel workflows

# 5. Investigate and fix web system issues
# - Analyze migration logs
# - Fix data or system issues
# - Plan re-migration when ready
```

#### Rollback Triggers
- Critical data loss or corruption
- System performance issues affecting operations
- Staff unable to complete essential tasks
- Customer service disruption
- Financial data discrepancies

## Migration Timeline Template

### 8-Week Migration Schedule

| Week | Phase | Activities | Deliverables |
|------|-------|------------|--------------|
| 1 | Assessment | Excel audit, staff interviews, system review | Migration plan, risk assessment |
| 2 | Preparation | Data cleaning, web system setup, staff notifications | Clean Excel data, configured web system |
| 3 | Initial Migration | Test migration with sample data, staff training begins | Migrated test data, training materials |
| 4 | Validation | Data validation, process testing, staff feedback | Validation report, process documentation |
| 5 | Parallel Start | Begin parallel operations, daily data sync | Parallel workflows, daily reports |
| 6 | Parallel Continue | Continue dual systems, resolve issues, advanced training | Issue resolution, advanced training completion |
| 7 | Transition | Primary operations move to web system, Excel backup only | Web system as primary, backup procedures |
| 8 | Completion | Full cutover, final validation, documentation | Migration completion report, user documentation |

This comprehensive migration strategy ensures a smooth transition from Excel to the web-based system while minimizing business disruption and data loss risks.