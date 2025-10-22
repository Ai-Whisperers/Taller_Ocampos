'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Wrench, DollarSign, Package, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalClients: number;
  totalVehicles: number;
  activeWorkOrders: number;
  monthlyRevenue: number;
  lowStockItems: number;
  pendingInvoices: number;
  todayWorkOrders: number;
  weeklyGrowth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalVehicles: 0,
    activeWorkOrders: 0,
    monthlyRevenue: 0,
    lowStockItems: 0,
    pendingInvoices: 0,
    todayWorkOrders: 0,
    weeklyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Clientes Totales',
      value: stats.totalClients.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Vehículos',
      value: stats.totalVehicles.toString(),
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Órdenes Activas',
      value: stats.activeWorkOrders.toString(),
      icon: Wrench,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockItems.toString(),
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: stats.lowStockItems > 0,
    },
    {
      title: 'Facturas Pendientes',
      value: stats.pendingInvoices.toString(),
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="pt-12 lg:pt-0">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Bienvenido de vuelta, aquí está el resumen de tu taller</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative">
              {stat.alert && (
                <div className="absolute -top-2 -right-2">
                  <AlertCircle className="h-6 w-6 text-red-500 animate-pulse" />
                </div>
              )}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button className="p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center">
              <Users className="h-5 w-5 md:h-6 md:w-6 mb-2 text-primary" />
              <span className="text-xs md:text-sm text-center">Nuevo Cliente</span>
            </button>
            <button className="p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center">
              <Car className="h-5 w-5 md:h-6 md:w-6 mb-2 text-primary" />
              <span className="text-xs md:text-sm text-center">Registrar Vehículo</span>
            </button>
            <button className="p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center">
              <Wrench className="h-5 w-5 md:h-6 md:w-6 mb-2 text-primary" />
              <span className="text-xs md:text-sm text-center">Nueva Orden</span>
            </button>
            <button className="p-3 md:p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center">
              <FileText className="h-5 w-5 md:h-6 md:w-6 mb-2 text-primary" />
              <span className="text-xs md:text-sm text-center">Crear Factura</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Órdenes de Trabajo Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">Honda Civic - ABC123</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Juan Pérez • Cambio de aceite</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded whitespace-nowrap self-start sm:self-center">
                  En Progreso
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">Toyota Corolla - XYZ789</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">María García • Revisión general</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded whitespace-nowrap self-start sm:self-center">
                  Completado
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">Ford Focus - DEF456</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">Carlos López • Reparación de frenos</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded whitespace-nowrap self-start sm:self-center">
                  Pendiente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Alertas y Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {stats.lowStockItems > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Package className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Stock Bajo</p>
                    <p className="text-sm text-red-700">
                      {stats.lowStockItems} items necesitan reposición
                    </p>
                  </div>
                </div>
              )}
              {stats.pendingInvoices > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-900">Facturas Pendientes</p>
                    <p className="text-sm text-orange-700">
                      {stats.pendingInvoices} facturas por cobrar
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Crecimiento Semanal</p>
                  <p className="text-sm text-green-700">
                    +{stats.weeklyGrowth}% comparado con la semana anterior
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}