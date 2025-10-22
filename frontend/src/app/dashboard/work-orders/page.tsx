'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Eye, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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

interface WorkOrder {
  id: string;
  orderNumber: string;
  vehicleId: string;
  vehicleInfo: string;
  clientName: string;
  status: 'draft' | 'pending' | 'in-progress' | 'ready' | 'closed';
  description: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: FileText },
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  'in-progress': { label: 'En Progreso', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    clientId: '',
    description: '',
    status: 'draft',
    totalAmount: 0
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchClientsAndVehicles();
  }, []);

  const fetchClientsAndVehicles = async () => {
    try {
      const [clientsRes, vehiclesRes] = await Promise.all([
        fetch('http://localhost:3001/api/clients?limit=1000'),
        fetch('http://localhost:3001/api/vehicles?limit=1000')
      ]);
      const clientsData = await clientsRes.json();
      const vehiclesData = await vehiclesRes.json();

      if (clientsData.success) setClients(clientsData.data);
      if (vehiclesData.success) setVehicles(vehiclesData.data);
    } catch (error) {
      console.error('Error fetching clients/vehicles:', error);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`http://localhost:3001/api/work-orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setWorkOrders(data.data);
      } else {
        toast.error('Error al cargar órdenes de trabajo');
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Error al cargar órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work-orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Estado actualizado exitosamente');
        fetchWorkOrders();
      } else {
        toast.error(result.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.clientId || !formData.description) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Orden de trabajo creada exitosamente');
        setShowCreateForm(false);
        setFormData({
          vehicleId: '',
          clientId: '',
          description: '',
          status: 'draft',
          totalAmount: 0
        });
        fetchWorkOrders();
      } else {
        toast.error(result.message || 'Error al crear orden');
      }
    } catch (error) {
      console.error('Error creating work order:', error);
      toast.error('Error al crear orden de trabajo');
    }
  };

  const filteredOrders = workOrders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicleInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
        <p className="text-gray-500 mt-2">
          Gestiona las órdenes de trabajo del taller
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por número, vehículo, cliente o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
                <SelectItem value="ready">Listo</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Nueva Orden de Trabajo</h3>
            <form onSubmit={handleCreateWorkOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-1">Vehículo *</label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} - {vehicle.licensePlate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 min-h-[80px]"
                  placeholder="Descripción del trabajo a realizar..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
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
                    <SelectItem value="in-progress">En Progreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto Total (₲)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
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
                  Crear Orden
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando órdenes...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron órdenes con ese criterio'
                : 'No hay órdenes de trabajo registradas aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>{order.vehicleInfo}</TableCell>
                      <TableCell>{order.clientName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {order.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₲ {order.totalAmount.toLocaleString('es-PY')}
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('es-PY')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // TODO: Navigate to order details
                              toast('Vista de detalles en desarrollo');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // TODO: Navigate to edit order
                              toast('Edición en desarrollo');
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}