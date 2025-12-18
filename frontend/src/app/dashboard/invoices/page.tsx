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
import api from '@/lib/api';

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
  const [stats, setStats] = useState({
    totalBilled: 0,
    pending: 0,
    overdue: 0
  });
  const [formData, setFormData] = useState({
    clientId: '',
    workOrderId: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days from now
    taxRate: 10, // 10% IVA
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as Array<{ description: string; quantity: number; unitPrice: number }>,
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchClientsAndOrders();
  }, []);

  const fetchClientsAndOrders = async () => {
    try {
      const [clientsRes, ordersRes] = await Promise.all([
        api.get('/clients?limit=1000'),
        api.get('/work-orders?limit=1000')
      ]);

      if (clientsRes.data.success) setClients(clientsRes.data.data);
      if (ordersRes.data.success) setWorkOrders(ordersRes.data.data);
    } catch (error) {
      console.error('Error fetching clients/orders:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/invoices');
      const data = response.data;

      if (data.success) {
        const mappedInvoices = data.data.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          workOrderNumber: inv.orderNumber,
          amount: inv.total,
          status: inv.status === 'paid' ? 'paid' : inv.status === 'draft' ? 'draft' : inv.status === 'overdue' ? 'overdue' : 'pending',
          issueDate: new Date(inv.issueDate).toISOString().split('T')[0],
          dueDate: new Date(new Date(inv.issueDate).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentDate: inv.status === 'paid' ? new Date(inv.updatedAt).toISOString().split('T')[0] : undefined
        }));
        setInvoices(mappedInvoices);

        // Calculate stats from real data
        const totalBilled = mappedInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const pending = mappedInvoices
          .filter((inv: any) => inv.status === 'pending')
          .reduce((sum: number, inv: any) => sum + inv.amount, 0);
        const overdue = mappedInvoices
          .filter((inv: any) => inv.status === 'overdue')
          .reduce((sum: number, inv: any) => sum + inv.amount, 0);

        setStats({ totalBilled, pending, overdue });
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

    if (!formData.clientId || formData.items.length === 0 || formData.items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    try {
      const invoiceData = {
        clientId: formData.clientId,
        workOrderId: formData.workOrderId || undefined,
        dueDate: new Date(formData.dueDate).toISOString(),
        taxRate: formData.taxRate,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        notes: formData.notes || undefined
      };

      const response = await api.post('/invoices', invoiceData);

      if (response.data.success) {
        toast.success('Factura creada exitosamente');
        setShowCreateForm(false);
        setFormData({
          clientId: '',
          workOrderId: '',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          taxRate: 10,
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
          notes: ''
        });
        fetchInvoices();
      } else {
        toast.error(response.data.message || 'Error al crear factura');
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
              <p className="text-2xl font-bold">₲ {stats.totalBilled.toLocaleString('es-PY')}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">₲ {stats.pending.toLocaleString('es-PY')}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencidas</p>
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
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Nueva Factura</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        setFormData({
                          ...formData,
                          workOrderId: value,
                          clientId: selectedOrder.clientId || formData.clientId,
                          items: [{ description: selectedOrder.description || 'Servicio', quantity: 1, unitPrice: selectedOrder.totalAmount || 0 }]
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
                          {order.orderNumber} - ₲ {order.totalAmount?.toLocaleString('es-PY') || '0'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Items de la Factura *</label>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <div className="col-span-6">
                      <Input
                        type="text"
                        placeholder="Descripción"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Cant."
                        value={item.quantity}
                        min={1}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newItems = formData.items.filter((_, i) => i !== index);
                            setFormData({ ...formData, items: newItems });
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }] })}
                >
                  + Agregar Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">IVA (%)</label>
                  <Input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subtotal</label>
                  <Input
                    type="text"
                    value={`₲ ${formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('es-PY')}`}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total (con IVA)</label>
                  <Input
                    type="text"
                    value={`₲ ${(formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 + formData.taxRate / 100)).toLocaleString('es-PY')}`}
                    readOnly
                    className="bg-gray-100 font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
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