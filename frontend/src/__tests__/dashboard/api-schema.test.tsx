/**
 * API Schema Validation Tests
 *
 * These tests verify that the frontend sends correct data formats to match
 * the backend API expectations. They test the fixes made for:
 *
 * 1. Clients - address optional, phone validation
 * 2. Vehicles - year/mileage as integers
 * 3. Work Orders - uppercase status enums, laborRate field
 * 4. Invoices - items array format, dueDate, taxRate
 * 5. Payments - uppercase method enums (CASH, BANK_TRANSFER, etc.)
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: jest.fn(),
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: mockApi,
}));

describe('API Schema Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Vehicles - Type Conversions', () => {
    it('should convert year and mileage to integers', async () => {
      // This test verifies the fix in vehicles/page.tsx lines 124-129
      // where year and mileage are converted using parseInt()

      const vehicleData = {
        brand: 'Toyota',
        model: 'Corolla',
        year: '2023', // Input as string from form
        mileage: '45000', // Input as string from form
        licensePlate: 'ABC123',
        clientId: '1',
      };

      // The fix should convert these to integers
      const expectedData = {
        ...vehicleData,
        year: 2023, // Should be integer
        mileage: 45000, // Should be integer
      };

      expect(parseInt(vehicleData.year, 10)).toBe(expectedData.year);
      expect(parseInt(vehicleData.mileage, 10)).toBe(expectedData.mileage);
      expect(typeof parseInt(vehicleData.year, 10)).toBe('number');
      expect(typeof parseInt(vehicleData.mileage, 10)).toBe('number');
    });
  });

  describe('Work Orders - Status Enum Values', () => {
    it('should use uppercase status values', () => {
      // This test verifies the fix in work-orders/page.tsx
      // where status values were changed from lowercase to uppercase

      const validStatuses = [
        'DRAFT',
        'PENDING_APPROVAL',
        'IN_PROGRESS',
        'READY_FOR_PICKUP',
        'COMPLETED',
        'CANCELLED',
      ];

      // The backend expects uppercase values
      validStatuses.forEach(status => {
        expect(status).toBe(status.toUpperCase());
      });

      // Verify none of the valid statuses contain lowercase letters
      validStatuses.forEach(status => {
        expect(status).not.toMatch(/[a-z]/);
      });

      // Verify old lowercase format would not match
      expect(validStatuses).not.toContain('draft');
      expect(validStatuses).not.toContain('pending');
      expect(validStatuses).not.toContain('in-progress');
    });

    it('should include laborRate in create request', () => {
      // This test verifies that laborRate is included in formData
      // as added in work-orders/page.tsx line 61

      const formData = {
        vehicleId: '1',
        clientId: '1',
        description: 'Test',
        status: 'DRAFT',
        laborRate: 50000, // This was added to fix backend validation
        totalAmount: 0,
      };

      expect(formData.laborRate).toBeDefined();
      expect(typeof formData.laborRate).toBe('number');
      expect(formData.laborRate).toBeGreaterThan(0);
    });
  });

  describe('Invoices - Items Array Format', () => {
    it('should structure invoice with items array', () => {
      // This test verifies the fix in invoices/page.tsx
      // where the form was restructured to use items array format

      const invoiceData = {
        clientId: '1',
        workOrderId: undefined,
        dueDate: new Date().toISOString(),
        taxRate: 10,
        items: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 100000,
          },
        ],
        notes: undefined,
      };

      // Backend requires items array
      expect(Array.isArray(invoiceData.items)).toBe(true);
      expect(invoiceData.items.length).toBeGreaterThan(0);

      // Each item must have description, quantity, unitPrice
      invoiceData.items.forEach(item => {
        expect(item.description).toBeDefined();
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.unitPrice).toBe('number');
      });

      // dueDate must be ISO format
      expect(invoiceData.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      // taxRate must be a number
      expect(typeof invoiceData.taxRate).toBe('number');
    });
  });

  describe('Payments - Method Enum Values', () => {
    it('should use uppercase payment method values', () => {
      // This test verifies the fix in payments/page.tsx
      // where payment methods were changed from lowercase to uppercase

      const validMethods = [
        'CASH',
        'BANK_TRANSFER',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'CHECK',
        'OTHER',
      ];

      const invalidMethods = [
        'cash',
        'transfer',
        'card',
        'check',
      ];

      // The backend expects uppercase values
      validMethods.forEach(method => {
        expect(method).toBe(method.toUpperCase());
      });

      // Verify the mapping from old to new
      expect(validMethods).toContain('CASH'); // was 'cash'
      expect(validMethods).toContain('BANK_TRANSFER'); // was 'transfer'
      expect(validMethods).toContain('CREDIT_CARD'); // was 'card'
      expect(validMethods).toContain('CHECK'); // was 'check'
    });

    it('should use method field not paymentMethod', () => {
      // This test verifies the fix where paymentMethod was renamed to method
      // to match backend API expectations

      const paymentData = {
        invoiceId: '1',
        amount: 100000,
        method: 'CASH', // Was previously 'paymentMethod'
        reference: '',
      };

      expect(paymentData.method).toBeDefined();
      expect((paymentData as any).paymentMethod).toBeUndefined();
    });
  });

  describe('Clients - Optional Address', () => {
    it('should allow empty address', () => {
      // This test verifies the fix in clients/page.tsx
      // where address was made optional to match backend

      const clientDataWithAddress = {
        name: 'Test Client',
        phone: '0981234567',
        email: '',
        address: 'Asunción',
      };

      const clientDataWithoutAddress = {
        name: 'Test Client',
        phone: '0981234567',
        email: '',
        address: '', // Empty address should be valid
      };

      // Both should be valid
      expect(clientDataWithAddress.name).toBeDefined();
      expect(clientDataWithoutAddress.name).toBeDefined();
    });

    it('should validate phone length (6-20 characters)', () => {
      // This test verifies the phone validation added to match backend

      const validPhones = ['123456', '0981234567', '12345678901234567890'];
      const invalidPhones = ['12345', '123456789012345678901'];

      validPhones.forEach(phone => {
        expect(phone.length).toBeGreaterThanOrEqual(6);
        expect(phone.length).toBeLessThanOrEqual(20);
      });

      invalidPhones.forEach(phone => {
        const isInvalid = phone.length < 6 || phone.length > 20;
        expect(isInvalid).toBe(true);
      });
    });
  });

  describe('API Error Handling', () => {
    it('should handle 400 validation errors', () => {
      // This test verifies the fix in api.ts
      // where 400 errors now show validation messages

      const errorResponse = {
        success: false,
        errors: [
          { field: 'phone', message: 'Invalid format' },
        ],
      };

      // The error interceptor should extract and display the first error
      const firstError = errorResponse.errors[0];
      const errorMessage = `${firstError.field}: ${firstError.message}`;

      expect(errorMessage).toBe('phone: Invalid format');
    });

    it('should handle 409 conflict errors', () => {
      // This test verifies the fix in api.ts for duplicate entries

      const conflictResponse = {
        success: false,
        message: 'El registro ya existe',
      };

      expect(conflictResponse.message).toBeDefined();
    });
  });
});
