const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3004', 'http://localhost:3006', 'http://localhost:3007'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Simple auth endpoints for testing
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required'
    });
  }

  // For demo purposes, just return success
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: '1',
        name,
        email,
        role: 'ADMIN'
      },
      token: 'demo-jwt-token-' + Date.now()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // For demo purposes, accept any login
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: '1',
        name: 'Demo User',
        email,
        role: 'ADMIN'
      },
      token: 'demo-jwt-token-' + Date.now()
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'ADMIN'
    }
  });
});

// Dashboard endpoints
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalClients: 0,
        totalVehicles: 0,
        activeWorkOrders: 0,
        monthlyRevenue: 0,
        lowStockItems: 0,
        pendingInvoices: 0,
        todayWorkOrders: 0,
        weeklyGrowth: 0,
      },
      recentWorkOrders: []
    }
  });
});

// In-memory storage
let clients = [];
let vehicles = [];
let workOrders = [];
let inventory = [];
let invoices = [];
let payments = [];

app.get('/api/clients', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  let filteredClients = clients;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredClients = clients.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(searchLower))
    );
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedClients,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredClients.length,
      pages: Math.ceil(filteredClients.length / Number(limit))
    }
  });
});

app.get('/api/clients/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);

  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  res.json({
    success: true,
    data: client
  });
});

app.post('/api/clients', (req, res) => {
  const { name, email, phone, address, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Name and phone are required'
    });
  }

  // Check if email already exists
  if (email && clients.some(c => c.email === email)) {
    return res.status(409).json({
      success: false,
      message: 'Client with this email already exists'
    });
  }

  const newClient = {
    id: Date.now().toString(),
    name,
    email: email || null,
    phone,
    address: address || '',
    notes: notes || '',
    vehicleCount: 0,
    lastVisit: null,
    createdAt: new Date().toISOString()
  };

  clients.push(newClient);

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    data: newClient
  });
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, notes } = req.body;

  const clientIndex = clients.findIndex(c => c.id === id);

  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  // Check if new email is already taken by another client
  if (email && clients.some((c, idx) => c.email === email && idx !== clientIndex)) {
    return res.status(409).json({
      success: false,
      message: 'Email already in use'
    });
  }

  const updatedClient = {
    ...clients[clientIndex],
    ...(name && { name }),
    ...(email !== undefined && { email }),
    ...(phone && { phone }),
    ...(address !== undefined && { address }),
    ...(notes !== undefined && { notes }),
    updatedAt: new Date().toISOString()
  };

  clients[clientIndex] = updatedClient;

  res.json({
    success: true,
    message: 'Client updated successfully',
    data: updatedClient
  });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const clientIndex = clients.findIndex(c => c.id === id);

  if (clientIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Client not found'
    });
  }

  clients.splice(clientIndex, 1);

  res.json({
    success: true,
    message: 'Client deleted successfully'
  });
});

// Vehicles endpoints
app.get('/api/vehicles', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  let filteredVehicles = vehicles.map(v => {
    const client = clients.find(c => c.id === v.clientId);
    return {
      ...v,
      clientName: client?.name || 'Unknown',
      serviceCount: workOrders.filter(wo => wo.vehicleId === v.id).length,
      lastService: workOrders.filter(wo => wo.vehicleId === v.id).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )[0]?.createdAt || null
    };
  });

  if (search) {
    const searchLower = search.toLowerCase();
    filteredVehicles = filteredVehicles.filter(v =>
      v.brand.toLowerCase().includes(searchLower) ||
      v.model.toLowerCase().includes(searchLower) ||
      v.licensePlate.toLowerCase().includes(searchLower) ||
      (v.vin && v.vin.toLowerCase().includes(searchLower)) ||
      v.clientName.toLowerCase().includes(searchLower)
    );
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedVehicles,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredVehicles.length,
      pages: Math.ceil(filteredVehicles.length / Number(limit))
    }
  });
});

app.post('/api/vehicles', (req, res) => {
  const { brand, model, year, licensePlate, vin, mileage, clientId } = req.body;

  if (!brand || !model || !year || !licensePlate || !mileage || !clientId) {
    return res.status(400).json({
      success: false,
      message: 'Brand, model, year, licensePlate, mileage and clientId are required'
    });
  }

  // Check if license plate already exists
  if (vehicles.some(v => v.licensePlate === licensePlate)) {
    return res.status(409).json({
      success: false,
      message: 'Vehicle with this license plate already exists'
    });
  }

  const newVehicle = {
    id: Date.now().toString(),
    brand,
    model,
    year,
    licensePlate,
    vin: vin || null,
    mileage: Number(mileage),
    clientId,
    createdAt: new Date().toISOString()
  };

  vehicles.push(newVehicle);

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: newVehicle
  });
});

app.put('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const { brand, model, year, licensePlate, vin, mileage, clientId } = req.body;

  const vehicleIndex = vehicles.findIndex(v => v.id === id);

  if (vehicleIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if new license plate is already taken
  if (licensePlate && vehicles.some((v, idx) => v.licensePlate === licensePlate && idx !== vehicleIndex)) {
    return res.status(409).json({
      success: false,
      message: 'License plate already in use'
    });
  }

  const updatedVehicle = {
    ...vehicles[vehicleIndex],
    ...(brand && { brand }),
    ...(model && { model }),
    ...(year && { year }),
    ...(licensePlate && { licensePlate }),
    ...(vin !== undefined && { vin }),
    ...(mileage && { mileage: Number(mileage) }),
    ...(clientId && { clientId }),
    updatedAt: new Date().toISOString()
  };

  vehicles[vehicleIndex] = updatedVehicle;

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: updatedVehicle
  });
});

app.delete('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const vehicleIndex = vehicles.findIndex(v => v.id === id);

  if (vehicleIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  vehicles.splice(vehicleIndex, 1);

  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

// Work Orders endpoints
app.get('/api/work-orders', (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  let filteredOrders = workOrders.map(wo => {
    const vehicle = vehicles.find(v => v.id === wo.vehicleId);
    const client = clients.find(c => c.id === wo.clientId);
    return {
      ...wo,
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}` : 'Unknown',
      clientName: client?.name || 'Unknown'
    };
  });

  if (search) {
    const searchLower = search.toLowerCase();
    filteredOrders = filteredOrders.filter(wo =>
      wo.orderNumber.toLowerCase().includes(searchLower) ||
      wo.vehicleInfo.toLowerCase().includes(searchLower) ||
      wo.clientName.toLowerCase().includes(searchLower) ||
      wo.description.toLowerCase().includes(searchLower)
    );
  }

  if (status && status !== 'all') {
    filteredOrders = filteredOrders.filter(wo => wo.status === status);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedOrders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredOrders.length,
      pages: Math.ceil(filteredOrders.length / Number(limit))
    }
  });
});

app.post('/api/work-orders', (req, res) => {
  const { vehicleId, clientId, description, status, totalAmount } = req.body;

  if (!vehicleId || !clientId || !description) {
    return res.status(400).json({
      success: false,
      message: 'VehicleId, clientId and description are required'
    });
  }

  const orderNumber = `OT-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`;

  const newOrder = {
    id: Date.now().toString(),
    orderNumber,
    vehicleId,
    clientId,
    description,
    status: status || 'draft',
    totalAmount: Number(totalAmount) || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  workOrders.push(newOrder);

  res.status(201).json({
    success: true,
    message: 'Work order created successfully',
    data: newOrder
  });
});

app.put('/api/work-orders/:id', (req, res) => {
  const { id } = req.params;
  const { vehicleId, clientId, description, status, totalAmount } = req.body;

  const orderIndex = workOrders.findIndex(wo => wo.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Work order not found'
    });
  }

  const updatedOrder = {
    ...workOrders[orderIndex],
    ...(vehicleId && { vehicleId }),
    ...(clientId && { clientId }),
    ...(description && { description }),
    ...(status && { status }),
    ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
    updatedAt: new Date().toISOString()
  };

  workOrders[orderIndex] = updatedOrder;

  res.json({
    success: true,
    message: 'Work order updated successfully',
    data: updatedOrder
  });
});

// Inventory endpoints
app.get('/api/inventory', (req, res) => {
  const { page = 1, limit = 10, search = '', lowStock } = req.query;

  let filteredItems = [...inventory];

  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.code.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }

  if (lowStock === 'true') {
    filteredItems = filteredItems.filter(item => item.currentStock <= item.minStock);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedItems,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredItems.length,
      pages: Math.ceil(filteredItems.length / Number(limit))
    }
  });
});

app.post('/api/inventory', (req, res) => {
  const { name, code, description, currentStock, minStock, unitPrice } = req.body;

  if (!name || !code || currentStock === undefined || minStock === undefined || unitPrice === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Name, code, currentStock, minStock and unitPrice are required'
    });
  }

  // Check if code already exists
  if (inventory.some(item => item.code === code)) {
    return res.status(409).json({
      success: false,
      message: 'Item with this code already exists'
    });
  }

  const newItem = {
    id: Date.now().toString(),
    name,
    code,
    description: description || '',
    currentStock: Number(currentStock),
    minStock: Number(minStock),
    unitPrice: Number(unitPrice),
    isActive: true,
    createdAt: new Date().toISOString()
  };

  inventory.push(newItem);

  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: newItem
  });
});

app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, description, currentStock, minStock, unitPrice, isActive } = req.body;

  const itemIndex = inventory.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }

  // Check if new code is already taken
  if (code && inventory.some((item, idx) => item.code === code && idx !== itemIndex)) {
    return res.status(409).json({
      success: false,
      message: 'Code already in use'
    });
  }

  const updatedItem = {
    ...inventory[itemIndex],
    ...(name && { name }),
    ...(code && { code }),
    ...(description !== undefined && { description }),
    ...(currentStock !== undefined && { currentStock: Number(currentStock) }),
    ...(minStock !== undefined && { minStock: Number(minStock) }),
    ...(unitPrice !== undefined && { unitPrice: Number(unitPrice) }),
    ...(isActive !== undefined && { isActive }),
    updatedAt: new Date().toISOString()
  };

  inventory[itemIndex] = updatedItem;

  res.json({
    success: true,
    message: 'Item updated successfully',
    data: updatedItem
  });
});

app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const itemIndex = inventory.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }

  inventory.splice(itemIndex, 1);

  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
});

// Invoices endpoints
app.get('/api/invoices', (req, res) => {
  const { page = 1, limit = 10, search = '', status } = req.query;

  let filteredInvoices = invoices.map(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const workOrder = workOrders.find(wo => wo.id === inv.workOrderId);
    return {
      ...inv,
      clientName: client?.name || 'Unknown',
      orderNumber: workOrder?.orderNumber || 'N/A'
    };
  });

  if (search) {
    const searchLower = search.toLowerCase();
    filteredInvoices = filteredInvoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(searchLower) ||
      inv.clientName.toLowerCase().includes(searchLower) ||
      inv.orderNumber.toLowerCase().includes(searchLower)
    );
  }

  if (status && status !== 'all') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedInvoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredInvoices.length,
      pages: Math.ceil(filteredInvoices.length / Number(limit))
    }
  });
});

app.post('/api/invoices', (req, res) => {
  const { clientId, workOrderId, subtotal, tax, total, status } = req.body;

  if (!clientId || total === undefined) {
    return res.status(400).json({
      success: false,
      message: 'ClientId and total are required'
    });
  }

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

  const newInvoice = {
    id: Date.now().toString(),
    invoiceNumber,
    clientId,
    workOrderId: workOrderId || null,
    subtotal: Number(subtotal) || 0,
    tax: Number(tax) || 0,
    total: Number(total),
    status: status || 'draft',
    issueDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  invoices.push(newInvoice);

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: newInvoice
  });
});

app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const { status, subtotal, tax, total } = req.body;

  const invoiceIndex = invoices.findIndex(inv => inv.id === id);

  if (invoiceIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found'
    });
  }

  const updatedInvoice = {
    ...invoices[invoiceIndex],
    ...(status && { status }),
    ...(subtotal !== undefined && { subtotal: Number(subtotal) }),
    ...(tax !== undefined && { tax: Number(tax) }),
    ...(total !== undefined && { total: Number(total) }),
    updatedAt: new Date().toISOString()
  };

  invoices[invoiceIndex] = updatedInvoice;

  res.json({
    success: true,
    message: 'Invoice updated successfully',
    data: updatedInvoice
  });
});

// Payments endpoints
app.get('/api/payments', (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;

  let filteredPayments = payments.map(p => {
    const invoice = invoices.find(inv => inv.id === p.invoiceId);
    const client = invoice ? clients.find(c => c.id === invoice.clientId) : null;
    return {
      ...p,
      invoiceNumber: invoice?.invoiceNumber || 'N/A',
      clientName: client?.name || 'Unknown'
    };
  });

  if (search) {
    const searchLower = search.toLowerCase();
    filteredPayments = filteredPayments.filter(p =>
      p.invoiceNumber.toLowerCase().includes(searchLower) ||
      p.clientName.toLowerCase().includes(searchLower) ||
      p.paymentMethod.toLowerCase().includes(searchLower)
    );
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedPayments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredPayments.length,
      pages: Math.ceil(filteredPayments.length / Number(limit))
    }
  });
});

app.post('/api/payments', (req, res) => {
  const { invoiceId, amount, paymentMethod, reference } = req.body;

  if (!invoiceId || !amount || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'InvoiceId, amount and paymentMethod are required'
    });
  }

  const newPayment = {
    id: Date.now().toString(),
    invoiceId,
    amount: Number(amount),
    paymentMethod,
    reference: reference || '',
    paymentDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  payments.push(newPayment);

  // Update invoice status if fully paid
  const invoice = invoices.find(inv => inv.id === invoiceId);
  if (invoice) {
    const totalPaid = payments
      .filter(p => p.invoiceId === invoiceId)
      .reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= invoice.total) {
      invoice.status = 'paid';
    }
  }

  res.status(201).json({
    success: true,
    message: 'Payment created successfully',
    data: newPayment
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth register: http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Auth login: http://localhost:${PORT}/api/auth/login`);
});