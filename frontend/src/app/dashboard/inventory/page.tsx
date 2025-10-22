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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    currentStock: 0,
    minStock: 0,
    unitPrice: 0
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showLowStock) {
        params.append('lowStock', 'true');
      }

      const response = await fetch(`http://localhost:3001/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setParts(data.data.map((item: any) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          category: 'General',
          brand: '',
          stock: item.currentStock,
          minStock: item.minStock,
          cost: item.unitPrice * 0.6,
          salePrice: item.unitPrice,
          supplier: '',
          location: ''
        })));
        return;
      }

      // Fallback mock data if API fails
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
      const response = await fetch(`http://localhost:3001/api/inventory/${partId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock }),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Stock actualizado exitosamente');
        fetchParts();
      } else {
        toast.error(result.message || 'Error al actualizar stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || formData.unitPrice === 0) {
      toast.error('Por favor complete los campos requeridos');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Repuesto creado exitosamente');
        setShowCreateForm(false);
        setFormData({
          name: '',
          code: '',
          description: '',
          currentStock: 0,
          minStock: 0,
          unitPrice: 0
        });
        fetchParts();
      } else {
        toast.error(result.message || 'Error al crear repuesto');
      }
    } catch (error) {
      console.error('Error creating item:', error);
      toast.error('Error al crear repuesto');
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
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Repuesto
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Nuevo Repuesto</h3>
            <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <Input
                  type="text"
                  placeholder="Nombre del repuesto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Código *</label>
                <Input
                  type="text"
                  placeholder="Código único"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <Input
                  type="text"
                  placeholder="Descripción del repuesto"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Actual *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.currentStock === 0 ? '' : formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value === '' ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Mínimo *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.minStock === 0 ? '' : formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value === '' ? 0 : Number(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Precio Unitario (₲) *</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.unitPrice === 0 ? '' : formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value === '' ? 0 : Number(e.target.value) })}
                  required
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
                  Crear Repuesto
                </Button>
              </div>
            </form>
          </div>
        )}

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
                            toast('Edición en desarrollo');
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