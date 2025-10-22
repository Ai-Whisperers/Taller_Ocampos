'use client';

import { useState, useEffect } from 'react';
import { Search, CreditCard, Check, Clock, Plus } from 'lucide-react';
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
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  method: 'cash' | 'transfer' | 'card' | 'check';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  reference?: string;
}

const methodConfig = {
  cash: { label: 'Efectivo', icon: '💵' },
  transfer: { label: 'Transferencia', icon: '🏦' },
  card: { label: 'Tarjeta', icon: '💳' },
  check: { label: 'Cheque', icon: '📄' },
};

const statusConfig = {
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: 0,
    paymentMethod: 'cash',
    reference: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/invoices?limit=1000');
      const data = await response.json();

      if (data.success) {
        // Filter pending invoices
        const pendingInvoices = data.data.filter((inv: any) => inv.status === 'pending' || inv.status === 'draft');
        setInvoices(pendingInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/payments');
      const data = await response.json();

      if (data.success) {
        setPayments(data.data.map((p: any, index: number) => ({
          id: p.id,
          paymentNumber: `PAG-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
          invoiceNumber: p.invoiceNumber,
          clientName: p.clientName,
          amount: p.amount,
          method: p.paymentMethod as 'cash' | 'card' | 'transfer',
          status: 'completed' as const,
          date: new Date(p.paymentDate).toISOString().split('T')[0],
          reference: p.reference || undefined
        })));
      } else {
        toast.error('Error al cargar pagos');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.invoiceId || !formData.amount || !formData.paymentMethod) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Pago registrado exitosamente');
        setShowCreateForm(false);
        setFormData({
          invoiceId: '',
          amount: 0,
          paymentMethod: 'cash',
          reference: ''
        });
        fetchPayments();
        fetchInvoices(); // Refresh to update pending invoices
      } else {
        toast.error(result.message || 'Error al registrar pago');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error al registrar pago');
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceived = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-500 mt-2">
          Gestiona los pagos recibidos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Recibido</p>
              <p className="text-2xl font-bold">₲ {totalReceived.toLocaleString('es-PY')}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">₲ {pendingAmount.toLocaleString('es-PY')}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagos Hoy</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-500" />
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
                  placeholder="Buscar por número, factura, cliente o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Registrar Pago</h3>
            <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Factura *</label>
                <Select
                  value={formData.invoiceId}
                  onValueChange={(value) => {
                    const selectedInvoice = invoices.find(inv => inv.id === value);
                    setFormData({
                      ...formData,
                      invoiceId: value,
                      amount: selectedInvoice?.total || 0
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar factura" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {invoice.clientName} (₲ {invoice.total?.toLocaleString('es-PY')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto (₲) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago *</label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo 💵</SelectItem>
                    <SelectItem value="transfer">Transferencia 🏦</SelectItem>
                    <SelectItem value="card">Tarjeta 💳</SelectItem>
                    <SelectItem value="check">Cheque 📄</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Referencia (opcional)</label>
                <Input
                  type="text"
                  placeholder="Número de transacción, cheque, etc."
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Pago
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando pagos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? 'No se encontraron pagos con ese criterio'
                : 'No hay pagos registrados aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell>{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.clientName}</TableCell>
                    <TableCell className="font-semibold">
                      ₲ {payment.amount.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <span>{methodConfig[payment.method]?.icon}</span>
                        {methodConfig[payment.method]?.label || payment.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[payment.status]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusConfig[payment.status]?.label || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.date).toLocaleDateString('es-PY')}
                    </TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}