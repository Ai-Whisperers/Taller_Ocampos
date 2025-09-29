'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, AlertTriangle, Package } from 'lucide-react';
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

interface Part {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  stock: number;
  minStock: number;
  cost: number;
  salePrice: number;
  supplier: string;
  location: string;
}

export default function InventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call

      // Mock data for now
      const mockParts: Part[] = [
        {
          id: '1',
          code: 'FIL-001',
          name: 'Filtro de aceite',
          category: 'Filtros',
          brand: 'Mann',
          stock: 15,
          minStock: 10,
          cost: 25000,
          salePrice: 45000,
          supplier: 'Repuestos SA',
          location: 'A1-B2',
        },
        {
          id: '2',
          code: 'ACE-001',
          name: 'Aceite 10W40',
          category: 'Lubricantes',
          brand: 'Castrol',
          stock: 5,
          minStock: 20,
          cost: 35000,
          salePrice: 55000,
          supplier: 'Lubricantes PY',
          location: 'B2-C1',
        },
        {
          id: '3',
          code: 'PAS-001',
          name: 'Pastillas de freno',
          category: 'Frenos',
          brand: 'Bosch',
          stock: 8,
          minStock: 5,
          cost: 85000,
          salePrice: 120000,
          supplier: 'Repuestos SA',
          location: 'C3-D1',
        },
      ];

      setParts(mockParts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (partId: string, newStock: number) => {
    try {
      // TODO: Update stock API call
      toast.success('Stock actualizado exitosamente');
      fetchParts();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const filteredParts = parts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock = !showLowStock || part.stock < part.minStock;

    return matchesSearch && matchesStock;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        <p className="text-gray-500 mt-2">
          Gestiona el inventario de repuestos del taller
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
                  placeholder="Buscar por nombre, código, categoría o marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Stock Bajo
            </Button>
            <Button onClick={() => {
              // TODO: Navigate to add part form
              toast.info('Formulario de nuevo repuesto en desarrollo');
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Repuesto
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando inventario...</p>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || showLowStock
                ? 'No se encontraron repuestos con ese criterio'
                : 'No hay repuestos registrados aún'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.code}</TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>{part.brand}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className={part.stock < part.minStock ? 'text-red-600 font-semibold' : ''}>
                          {part.stock}
                        </span>
                        {part.stock < part.minStock && (
                          <Badge variant="destructive" className="text-xs">
                            Bajo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>₲ {part.cost.toLocaleString('es-PY')}</TableCell>
                    <TableCell className="font-semibold">
                      ₲ {part.salePrice.toLocaleString('es-PY')}
                    </TableCell>
                    <TableCell>{part.location}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // TODO: Navigate to edit part
                            toast.info('Edición en desarrollo');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
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