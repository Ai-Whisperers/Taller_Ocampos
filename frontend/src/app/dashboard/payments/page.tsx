'use client';

import { useState, useEffect } from 'react';
import { Search, CreditCard, Check, Clock } from 'lucide-react';
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

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      // Mock data for now
      const mockPayments: Payment[] = [
        {
          id: '1',
          paymentNumber: 'PAG-2024-001',
          invoiceNumber: 'FAC-2024-001',
          clientName: 'Juan Pérez',
          amount: 150000,
          method: 'cash',
          status: 'completed',
          date: '2024-01-20',
        },
        {
          id: '2',
          paymentNumber: 'PAG-2024-002',
          invoiceNumber: 'FAC-2024-002',
          clientName: 'María González',
          amount: 140000,
          method: 'transfer',
          status: 'pending',
          date: '2024-01-22',
          reference: 'TRF-123456',
        },
        {
          id: '3',
          paymentNumber: 'PAG-2024-003',
          invoiceNumber: 'FAC-2024-002',
          clientName: 'María González',
          amount: 140000,
          method: 'card',
          status: 'completed',
          date: '2024-01-23',
          reference: 'VISA-7890',
        },
      ];

      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
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
            <Button onClick={() => {
              // TODO: Navigate to register payment
              toast.info('Registro de pago en desarrollo');
            }}>
              <CreditCard className="h-4 w-4 mr-2" />
              Registrar Pago
            </Button>
          </div>
        </div>

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
                        <span>{methodConfig[payment.method].icon}</span>
                        {methodConfig[payment.method].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[payment.status].color}>
                        {statusConfig[payment.status].label}
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