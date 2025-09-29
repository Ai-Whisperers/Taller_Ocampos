'use client';

import { useState } from 'react';
import { Save, Download, Upload, Database, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // TODO: Save profile API call
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // TODO: Save workshop API call
      toast.success('Información del taller actualizada');
    } catch (error) {
      console.error('Error saving workshop:', error);
      toast.error('Error al guardar información');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      // TODO: Export data API call
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      // TODO: Import data API call
      toast.success('Datos importados exitosamente');
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Error al importar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      // TODO: Backup API call
      toast.success('Respaldo creado exitosamente');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear respaldo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-2">
          Gestiona la configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="workshop">Taller</TabsTrigger>
          <TabsTrigger value="backup">Respaldo</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y credenciales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name || ''}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      placeholder="juan@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="0981234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Input
                      id="role"
                      value="Administrador"
                      disabled
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="********"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="********"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshop">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información del Taller
              </CardTitle>
              <CardDescription>
                Configura la información de tu taller mecánico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWorkshop} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workshopName">Nombre del taller</Label>
                    <Input
                      id="workshopName"
                      placeholder="Taller Mecánico López"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruc">RUC</Label>
                    <Input
                      id="ruc"
                      placeholder="80012345-6"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Av. Principal 123, Asunción"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshopPhone">Teléfono</Label>
                    <Input
                      id="workshopPhone"
                      placeholder="021-123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshopEmail">Email</Label>
                    <Input
                      id="workshopEmail"
                      type="email"
                      placeholder="info@tallermecanico.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar información
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Respaldo de Datos
                </CardTitle>
                <CardDescription>
                  Exporta e importa datos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar datos (CSV/Excel)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleImportData}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar datos
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Respaldo automático</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Los respaldos automáticos se realizan diariamente a las 2:00 AM
                  </p>
                  <Button onClick={handleBackup} disabled={loading}>
                    <Database className="h-4 w-4 mr-2" />
                    Crear respaldo ahora
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Últimos respaldos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">backup_2024_01_23.sql</span>
                      <span className="text-xs text-gray-500">23/01/2024 - 2:00 AM</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">backup_2024_01_22.sql</span>
                      <span className="text-xs text-gray-500">22/01/2024 - 2:00 AM</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">backup_2024_01_21.sql</span>
                      <span className="text-xs text-gray-500">21/01/2024 - 2:00 AM</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}