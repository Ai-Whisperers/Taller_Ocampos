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

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      // Mock data for now
      const mockOrders: WorkOrder[] = [
        {
          id: '1',
          orderNumber: 'OT-2024-001',
          vehicleId: '1',
          vehicleInfo: 'Toyota Corolla - ABC123',
          clientName: 'Juan Pérez',
          status: 'in-progress',
          description: 'Cambio de aceite y filtros',
          totalAmount: 150000,
          createdAt: '2024-01-15T10:00:00',
          updatedAt: '2024-01-15T14:30:00',
        },
        {
          id: '2',
          orderNumber: 'OT-2024-002',
          vehicleId: '2',
          vehicleInfo: 'Ford Ranger - XYZ789',
          clientName: 'María González',
          status: 'pending',
          description: 'Revisión de frenos',
          totalAmount: 280000,
          createdAt: '2024-01-20T09:00:00',
          updatedAt: '2024-01-20T09:00:00',
        },
        {
          id: '3',
          orderNumber: 'OT-2024-003',
          vehicleId: '1',
          vehicleInfo: 'Toyota Corolla - ABC123',
          clientName: 'Juan Pérez',
          status: 'ready',
          description: 'Alineación y balanceo',
          totalAmount: 120000,
          createdAt: '2024-01-22T11:00:00',
          updatedAt: '2024-01-22T16:00:00',
        },
      ];

      setWorkOrders(mockOrders);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast.error('Error al cargar órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // TODO: Update status API call
      toast.success('Estado actualizado exitosamente');
      fetchWorkOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
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
            <Button onClick={() => {
              // TODO: Navigate to new work order form
              toast.info('Formulario de nueva orden en desarrollo');
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden
            </Button>
          </div>
        </div>

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
                        <Badge className={statusConfig[order.status].color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig[order.status].label}
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
                              toast.info('Vista de detalles en desarrollo');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // TODO: Navigate to edit order
                              toast.info('Edición en desarrollo');
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