'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Plus, CreditCard, DollarSign, Clock, Check, Eye, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientId: string;
  workOrderNumber: string;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  status: 'draft' | 'pending' | 'partially_paid' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card' | 'check';
  reference?: string;
  paymentDate: string;
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  partially_paid: { label: 'Pago Parcial', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' },
};

const methodConfig = {
  cash: { label: 'Efectivo', icon: '💵' },
  transfer: { label: 'Transferencia', icon: '🏦' },
  card: { label: 'Tarjeta', icon: '💳' },
  check: { label: 'Cheque', icon: '📄' },
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);

  const [stats, setStats] = useState({
    totalBilled: 0,
    totalReceived: 0,
    pending: 0,
    overdue: 0
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    reference: ''
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    clientId: '',
    workOrderId: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'pending'
  });

  useEffect(() => {
    fetchInvoices();
    fetchClientsAndOrders();
  }, []);

  const fetchClientsAndOrders = async () => {
    try {
      const [clientsRes, ordersRes] = await Promise.all([
        fetch('http://localhost:3001/api/clients?limit=1000'),
        fetch('http://localhost:3001/api/work-orders?limit=1000')
      ]);
      const clientsData = await clientsRes.json();
      const ordersData = await ordersRes.json();

      if (clientsData.success) setClients(clientsData.data);
      if (ordersData.success) setWorkOrders(ordersData.data);
    } catch (error) {
      console.error('Error fetching clients/orders:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch('http://localhost:3001/api/invoices?limit=1000'),
        fetch('http://localhost:3001/api/payments?limit=1000')
      ]);

      const invoicesData = await invoicesRes.json();
      const paymentsData = await paymentsRes.json();

      if (invoicesData.success) {
        // Group payments by invoice
        const paymentsByInvoice: { [key: string]: Payment[] } = {};
        if (paymentsData.success) {
          paymentsData.data.forEach((payment: any) => {
            if (!paymentsByInvoice[payment.invoiceId]) {
              paymentsByInvoice[payment.invoiceId] = [];
            }
            paymentsByInvoice[payment.invoiceId].push({
              id: payment.id,
              paymentNumber: payment.paymentNumber,
              amount: payment.amount,
              method: payment.method.toLowerCase(),
              reference: payment.reference,
              paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0]
            });
          });
        }

        const mappedInvoices = invoicesData.data.map((inv: any) => {
          const paidAmount = Number(inv.paidAmount || 0);
          const total = Number(inv.total);
          const remainingBalance = total - paidAmount;

          // Determine status based on payment
          let status = inv.status.toLowerCase();
          if (paidAmount >= total) {
            status = 'paid';
          } else if (paidAmount > 0) {
            status = 'partially_paid';
          } else if (new Date(inv.dueDate) < new Date() && status !== 'paid') {
            status = 'overdue';
          }

          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client?.name || 'N/A',
            clientId: inv.clientId,
            workOrderNumber: inv.workOrder?.orderNumber || 'N/A',
            total,
            paidAmount,
            remainingBalance,
            status,
            issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
            dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
            payments: paymentsByInvoice[inv.id] || []
          };
        });

        setInvoices(mappedInvoices);

        // Calculate stats
        const totalBilled = mappedInvoices.reduce((sum: number, inv: any) => sum + inv.total, 0);
        const totalReceived = mappedInvoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);
        const pending = mappedInvoices
          .filter((inv: any) => inv.status === 'pending' || inv.status === 'partially_paid')
          .reduce((sum: number, inv: any) => sum + inv.remainingBalance, 0);
        const overdue = mappedInvoices
          .filter((inv: any) => inv.status === 'overdue')
          .reduce((sum: number, inv: any) => sum + inv.remainingBalance, 0);

        setStats({ totalBilled, totalReceived, pending, overdue });
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoice || !paymentFormData.amount) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    if (paymentFormData.amount > selectedInvoice.remainingBalance) {
      toast.error(`El monto excede el saldo pendiente (₲ ${selectedInvoice.remainingBalance.toLocaleString('es-PY')})`);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: paymentFormData.amount,
          paymentMethod: paymentFormData.paymentMethod,
          reference: paymentFormData.reference
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Pago registrado exitosamente');
        setShowPaymentDialog(false);
        setSelectedInvoice(null);
        setPaymentFormData({ amount: 0, paymentMethod: 'cash', reference: '' });
        fetchInvoices();
      } else {
        toast.error(result.message || 'Error al registrar pago');
      }
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('Error al registrar pago');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceFormData.clientId || invoiceFormData.total === 0) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceFormData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Factura creada exitosamente');
        setShowCreateInvoiceForm(false);
        setInvoiceFormData({
          clientId: '',
          workOrderId: '',
          subtotal: 0,
          tax: 0,
          total: 0,
          status: 'pending'
        });
        fetchInvoices();
      } else {
        toast.error(result.message || 'Error al crear factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear factura');
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentFormData({
      amount: invoice.remainingBalance,
      paymentMethod: 'cash',
      reference: ''
    });
    setShowPaymentDialog(true);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Facturación y Pagos</h1>
        <p className="text-gray-500 mt-2">
          Gestiona facturas y registra pagos de manera integrada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Facturado</p>
              <p className="text-2xl font-bold">₲ {stats.totalBilled.toLocaleString('es-PY')}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Recibido</p>
              <p className="text-2xl font-bold">₲ {stats.totalReceived.toLocaleString('es-PY')}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Por Cobrar</p>
              <p className="text-2xl font-bold">₲ {stats.pending.toLocaleString('es-PY')}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencido</p>
              <p className="text-2xl font-bold">₲ {stats.overdue.toLocaleString('es-PY')}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por número, cliente u orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="partially_paid">Pago Parcial</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateInvoiceForm(!showCreateInvoiceForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {showCreateInvoiceForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Nueva Factura</h3>
            <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <Select
                  value={invoiceFormData.clientId}
                  onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, clientId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Orden de Trabajo (opcional)</label>
                <Select
                  value={invoiceFormData.workOrderId}
                  onValueChange={(value) => {
                    const selectedOrder = workOrders.find(order => order.id === value);
                    if (selectedOrder) {
                      const subtotal = selectedOrder.totalAmount || 0;
                      const tax = subtotal * 0.1;
                      setInvoiceFormData({
                        ...invoiceFormData,
                        workOrderId: value,
                        clientId: selectedOrder.clientId || invoiceFormData.clientId,
                        subtotal,
                        tax,
                        total: subtotal + tax
                      });
                    } else {
                      setInvoiceFormData({ ...invoiceFormData, workOrderId: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar orden" />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.description?.substring(0, 30)} (₲ {order.totalAmount?.toLocaleString('es-PY') || '0'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subtotal (₲) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={invoiceFormData.subtotal === 0 ? '' : invoiceFormData.subtotal}
                  onChange={(e) => {
                    const subtotal = e.target.value === '' ? 0 : Number(e.target.value);
                    const tax = subtotal * 0.1;
                    setInvoiceFormData({
                      ...invoiceFormData,
                      subtotal,
                      tax,
                      total: subtotal + tax
                    });
                  }}
                  readOnly={!!invoiceFormData.workOrderId}
                  className={invoiceFormData.workOrderId ? 'bg-gray-100' : ''}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IVA (₲)</label>
                <Input
                  type="number"
                  value={invoiceFormData.tax}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total (₲) *</label>
                <Input
                  type="number"
                  value={invoiceFormData.total}
                  readOnly
                  className="bg-gray-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select
                  value={invoiceFormData.status}
                  onValueChange={(value) => setInvoiceFormData({ ...invoiceFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateInvoiceForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Crear Factura
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando datos...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron facturas con ese criterio'
                : 'No hay facturas registradas aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.workOrderNumber}</TableCell>
                    <TableCell className="font-semibold">
                      ₲ {invoice.total.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell className="text-green-600">
                      ₲ {invoice.paidAmount.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell className={invoice.remainingBalance > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                      ₲ {invoice.remainingBalance.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[invoice.status]?.color}>
                        {statusConfig[invoice.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPaymentDialog(invoice)}
                          disabled={invoice.remainingBalance === 0}
                          title="Registrar pago"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvoice(invoice)}
                          title="Ver detalles y pagos"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast('Exportación en desarrollo')}
                          title="Exportar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Factura: {selectedInvoice?.invoiceNumber} - Saldo: ₲ {selectedInvoice?.remainingBalance.toLocaleString('es-PY')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monto a Pagar (₲) *</label>
              <Input
                type="number"
                placeholder="0"
                value={paymentFormData.amount === 0 ? '' : paymentFormData.amount}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                max={selectedInvoice?.remainingBalance}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Puede realizar pagos parciales. Saldo restante: ₲ {((selectedInvoice?.remainingBalance || 0) - paymentFormData.amount).toLocaleString('es-PY')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Método de Pago *</label>
              <Select
                value={paymentFormData.paymentMethod}
                onValueChange={(value) => setPaymentFormData({ ...paymentFormData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Efectivo</SelectItem>
                  <SelectItem value="transfer">🏦 Transferencia</SelectItem>
                  <SelectItem value="card">💳 Tarjeta</SelectItem>
                  <SelectItem value="check">📄 Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Referencia (opcional)</label>
              <Input
                type="text"
                placeholder="Número de transacción, cheque, etc."
                value={paymentFormData.reference}
                onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Pago
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice && !showPaymentDialog} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles de Factura</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.invoiceNumber} - {selectedInvoice?.clientName}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Total Factura</p>
                  <p className="text-xl font-bold">₲ {selectedInvoice.total.toLocaleString('es-PY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pagado</p>
                  <p className="text-xl font-bold text-green-600">₲ {selectedInvoice.paidAmount.toLocaleString('es-PY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Saldo Pendiente</p>
                  <p className="text-xl font-bold text-red-600">₲ {selectedInvoice.remainingBalance.toLocaleString('es-PY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <Badge className={statusConfig[selectedInvoice.status]?.color}>
                    {statusConfig[selectedInvoice.status]?.label}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Historial de Pagos</h4>
                {selectedInvoice.payments.length === 0 ? (
                  <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
                    No hay pagos registrados para esta factura
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString('es-PY')}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1">
                                <span>{methodConfig[payment.method]?.icon}</span>
                                {methodConfig[payment.method]?.label}
                              </span>
                            </TableCell>
                            <TableCell>{payment.reference || '-'}</TableCell>
                            <TableCell className="text-right font-semibold">
                              ₲ {payment.amount.toLocaleString('es-PY')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedInvoice.remainingBalance > 0 && (
                  <Button onClick={() => {
                    setShowPaymentDialog(true);
                  }}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
