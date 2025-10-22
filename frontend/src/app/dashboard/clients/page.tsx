'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Car } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().min(1, 'La dirección es requerida'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  vehicleCount: number;
  lastVisit?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/clients');
      const data = await response.json();

      if (data.success) {
        setClients(data.data);
      } else {
        toast.error('Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        const response = await fetch(`http://localhost:3001/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
          toast.success('Cliente actualizado exitosamente');
        } else {
          toast.error(result.message || 'Error al actualizar cliente');
          return;
        }
      } else {
        const response = await fetch('http://localhost:3001/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.success) {
          toast.success('Cliente creado exitosamente');
        } else {
          toast.error(result.message || 'Error al crear cliente');
          return;
        }
      }

      reset();
      setIsAddDialogOpen(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Error al guardar cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    reset({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      address: client.address,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/clients/${id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success('Cliente eliminado exitosamente');
          fetchClients();
        } else {
          toast.error(result.message || 'Error al eliminar cliente');
        }
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Error al eliminar cliente');
      }
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6 pt-12 lg:pt-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">
          Gestiona la información de tus clientes
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-3 md:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingClient(null);
                  reset();
                }} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Nuevo Cliente</span>
                  <span className="xs:hidden">Nuevo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle className="text-lg md:text-xl">
                      {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingClient
                        ? 'Modifica la información del cliente'
                        : 'Ingresa la información del nuevo cliente'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 md:space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Juan Pérez"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="0981234567"
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="juan@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        {...register('address')}
                        placeholder="Asunción, Paraguay"
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address.message}</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingClient(null);
                      reset();
                    }} className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingClient ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 md:mx-0">
          {loading ? (
            <div className="p-6 md:p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-500">Cargando clientes...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-6 md:p-8 text-center text-sm md:text-base text-gray-500">
              {searchTerm
                ? 'No se encontraron clientes con ese criterio'
                : 'No hay clientes registrados aún'}
            </div>
          ) : (
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Nombre</TableHead>
                  <TableHead className="text-xs md:text-sm hidden sm:table-cell">Teléfono</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-xs md:text-sm hidden lg:table-cell">Dirección</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Vehículos</TableHead>
                  <TableHead className="text-xs md:text-sm hidden xl:table-cell">Última visita</TableHead>
                  <TableHead className="text-xs md:text-sm text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium text-xs md:text-sm">
                      <div>
                        <div>{client.name}</div>
                        <div className="sm:hidden text-gray-500 text-xs">{client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden sm:table-cell">{client.phone}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">{client.email || '-'}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden lg:table-cell truncate max-w-[200px]">{client.address}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">
                      <div className="flex items-center">
                        <Car className="h-3 w-3 md:h-4 md:w-4 mr-1 text-gray-400" />
                        {client.vehicleCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm hidden xl:table-cell">
                      {client.lastVisit
                        ? new Date(client.lastVisit).toLocaleDateString('es-PY')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10"
                          onClick={() => {
                            // TODO: Navigate to client details
                            toast('Vista de detalles en desarrollo');
                          }}
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 md:h-10 md:w-10"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
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