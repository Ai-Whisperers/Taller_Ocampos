'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, DollarSign } from 'lucide-react';
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  workOrderNumber: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: string;
  dueDate: string;
  paymentDate?: string;
}

const statusConfig = {
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  overdue: { label: 'Vencido', color: 'bg-red-100 text-red-700' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      // Mock data for now
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'FAC-2024-001',
          clientName: 'Juan Pérez',
          workOrderNumber: 'OT-2024-001',
          amount: 150000,
          status: 'paid',
          issueDate: '2024-01-15',
          dueDate: '2024-01-30',
          paymentDate: '2024-01-20',
        },
        {
          id: '2',
          invoiceNumber: 'FAC-2024-002',
          clientName: 'María González',
          workOrderNumber: 'OT-2024-002',
          amount: 280000,
          status: 'pending',
          issueDate: '2024-01-20',
          dueDate: '2024-02-04',
        },
        {
          id: '3',
          invoiceNumber: 'FAC-2024-003',
          clientName: 'Carlos López',
          workOrderNumber: 'OT-2024-003',
          amount: 450000,
          status: 'overdue',
          issueDate: '2024-01-10',
          dueDate: '2024-01-25',
        },
      ];

      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (invoiceId: string) => {
    try {
      // TODO: Export to PDF API call
      toast.success('Factura exportada exitosamente');
    } catch (error) {
      console.error('Error exporting invoice:', error);
      toast.error('Error al exportar factura');
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
        <p className="text-gray-500 mt-2">
          Gestiona las facturas del taller
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Facturado</p>
              <p className="text-2xl font-bold">₲ 880,000</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">₲ 280,000</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencidas</p>
              <p className="text-2xl font-bold">₲ 450,000</p>
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
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando facturas...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? 'No se encontraron facturas con ese criterio'
                : 'No hay facturas registradas aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Emisión</TableHead>
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
                      ₲ {invoice.amount.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[invoice.status].color}>
                        {statusConfig[invoice.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.issueDate).toLocaleDateString('es-PY')}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.dueDate).toLocaleDateString('es-PY')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // TODO: View invoice details
                            toast.info('Vista de detalles en desarrollo');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExportPDF(invoice.id)}
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
    </div>
  );
}