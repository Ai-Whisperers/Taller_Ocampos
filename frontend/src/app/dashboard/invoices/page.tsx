'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, DollarSign, Plus } from 'lucide-react';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    workOrderId: '',
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'draft'
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
      const response = await fetch('http://localhost:3001/api/invoices');
      const data = await response.json();

      if (data.success) {
        setInvoices(data.data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          workOrderNumber: inv.orderNumber,
          amount: inv.total,
          status: inv.status === 'paid' ? 'paid' : inv.status === 'draft' ? 'draft' : inv.status === 'overdue' ? 'overdue' : 'pending',
          issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
          dueDate: new Date(new Date(inv.issueDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentDate: inv.status === 'paid' ? new Date(inv.updatedAt).toISOString().split('T')[0] : undefined
        })));
      } else {
        toast.error('Error al cargar facturas');
      }
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

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || formData.total === 0) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    // Verify price matches work order if one is selected
    if (formData.workOrderId) {
      const selectedOrder = workOrders.find(order => order.id === formData.workOrderId);
      if (selectedOrder && selectedOrder.totalAmount !== formData.subtotal) {
        toast.error(`El monto debe coincidir con la orden de trabajo (₲ ${selectedOrder.totalAmount.toLocaleString('es-PY')})`);
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Factura creada exitosamente');
        setShowCreateForm(false);
        setFormData({
          clientId: '',
          workOrderId: '',
          subtotal: 0,
          tax: 0,
          total: 0,
          status: 'draft'
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
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Nueva Factura</h3>
            <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
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
                  value={formData.workOrderId}
                  onValueChange={(value) => {
                    const selectedOrder = workOrders.find(order => order.id === value);
                    if (selectedOrder) {
                      const subtotal = selectedOrder.totalAmount || 0;
                      const tax = subtotal * 0.1;
                      setFormData({
                        ...formData,
                        workOrderId: value,
                        clientId: selectedOrder.clientId || formData.clientId,
                        subtotal,
                        tax,
                        total: subtotal + tax
                      });
                    } else {
                      setFormData({ ...formData, workOrderId: value });
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
                  value={formData.subtotal === 0 ? '' : formData.subtotal}
                  onChange={(e) => {
                    const subtotal = e.target.value === '' ? 0 : Number(e.target.value);
                    const tax = subtotal * 0.1; // 10% tax
                    setFormData({
                      ...formData,
                      subtotal,
                      tax,
                      total: subtotal + tax
                    });
                  }}
                  readOnly={!!formData.workOrderId}
                  className={formData.workOrderId ? 'bg-gray-100' : ''}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">IVA (₲)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.tax}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total (₲) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.total}
                  readOnly
                  className="bg-gray-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
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
                      <Badge className={statusConfig[invoice.status]?.color || 'bg-gray-100 text-gray-700'}>
                        {statusConfig[invoice.status]?.label || invoice.status}
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
                            toast('Vista de detalles en desarrollo');
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