'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, User, Wrench } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const vehicleSchema = z.object({
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.string().min(4, 'El año debe tener 4 dígitos').max(4),
  licensePlate: z.string().min(1, 'La matrícula es requerida'),
  vin: z.string().optional(),
  mileage: z.string().min(1, 'El kilometraje es requerido'),
  clientId: z.string().min(1, 'El cliente es requerido'),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin?: string;
  mileage: number;
  clientId: string;
  clientName: string;
  lastService?: string;
  serviceCount: number;
}

interface Client {
  id: string;
  name: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      // Mock data for now
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          brand: 'Toyota',
          model: 'Corolla',
          year: '2020',
          licensePlate: 'ABC123',
          vin: '1HGBH41JXMN109186',
          mileage: 45000,
          clientId: '1',
          clientName: 'Juan Pérez',
          lastService: '2024-01-15',
          serviceCount: 3,
        },
        {
          id: '2',
          brand: 'Ford',
          model: 'Ranger',
          year: '2019',
          licensePlate: 'XYZ789',
          mileage: 68000,
          clientId: '2',
          clientName: 'María González',
          lastService: '2024-01-20',
          serviceCount: 5,
        },
      ];

      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      // TODO: Replace with actual API call

      // Mock data for now
      const mockClients: Client[] = [
        { id: '1', name: 'Juan Pérez' },
        { id: '2', name: 'María González' },
        { id: '3', name: 'Carlos López' },
      ];

      setClients(mockClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    try {
      if (editingVehicle) {
        // TODO: Update vehicle API call
        toast.success('Vehículo actualizado exitosamente');
      } else {
        // TODO: Create vehicle API call
        toast.success('Vehículo creado exitosamente');
      }

      reset();
      setIsAddDialogOpen(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Error al guardar vehículo');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    reset({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      vin: vehicle.vin || '',
      mileage: vehicle.mileage.toString(),
      clientId: vehicle.clientId,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este vehículo?')) {
      try {
        // TODO: Delete vehicle API call
        toast.success('Vehículo eliminado exitosamente');
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        toast.error('Error al eliminar vehículo');
      }
    }
  };

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
        <p className="text-gray-500 mt-2">
          Gestiona los vehículos de tus clientes
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
                  placeholder="Buscar por marca, modelo, matrícula o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingVehicle(null);
                  reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Vehículo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingVehicle
                        ? 'Modifica la información del vehículo'
                        : 'Ingresa la información del nuevo vehículo'}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Input
                        id="brand"
                        {...register('brand')}
                        placeholder="Toyota"
                      />
                      {errors.brand && (
                        <p className="text-sm text-red-500">{errors.brand.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        {...register('model')}
                        placeholder="Corolla"
                      />
                      {errors.model && (
                        <p className="text-sm text-red-500">{errors.model.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Año</Label>
                      <Input
                        id="year"
                        {...register('year')}
                        placeholder="2020"
                        maxLength={4}
                      />
                      {errors.year && (
                        <p className="text-sm text-red-500">{errors.year.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">Matrícula</Label>
                      <Input
                        id="licensePlate"
                        {...register('licensePlate')}
                        placeholder="ABC123"
                      />
                      {errors.licensePlate && (
                        <p className="text-sm text-red-500">{errors.licensePlate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN (opcional)</Label>
                      <Input
                        id="vin"
                        {...register('vin')}
                        placeholder="1HGBH41JXMN109186"
                      />
                      {errors.vin && (
                        <p className="text-sm text-red-500">{errors.vin.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mileage">Kilometraje</Label>
                      <Input
                        id="mileage"
                        type="number"
                        {...register('mileage')}
                        placeholder="45000"
                      />
                      {errors.mileage && (
                        <p className="text-sm text-red-500">{errors.mileage.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="clientId">Cliente</Label>
                      <Select
                        onValueChange={(value) => setValue('clientId', value)}
                        defaultValue={editingVehicle?.clientId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.clientId && (
                        <p className="text-sm text-red-500">{errors.clientId.message}</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingVehicle(null);
                      reset();
                    }}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingVehicle ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando vehículos...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? 'No se encontraron vehículos con ese criterio'
                : 'No hay vehículos registrados aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Kilometraje</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Último servicio</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.brand} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.licensePlate}</TableCell>
                    <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {vehicle.clientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Wrench className="h-4 w-4 mr-1 text-gray-400" />
                        {vehicle.serviceCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle.lastService
                        ? new Date(vehicle.lastService).toLocaleDateString('es-PY')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // TODO: Navigate to vehicle history
                            toast.info('Historial en desarrollo');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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