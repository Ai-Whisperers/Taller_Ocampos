import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean existing data (optional - remove in production)
  console.log('Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.maintenanceSchedule.deleteMany();
  await prisma.estimatePart.deleteMany();
  await prisma.estimateService.deleteMany();
  await prisma.estimate.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.workOrderPart.deleteMany();
  await prisma.workOrderService.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tallerocampos.com',
      password: hashedPassword,
      name: 'Administrador Principal',
      role: 'ADMIN',
      phone: '+1234567890',
    },
  });

  const technicianUser = await prisma.user.create({
    data: {
      email: 'technician@tallerocampos.com',
      password: hashedPassword,
      name: 'Juan Mecánico',
      role: 'TECHNICIAN',
      phone: '+1234567891',
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      email: 'receptionist@tallerocampos.com',
      password: hashedPassword,
      name: 'María Recepcionista',
      role: 'RECEPTIONIST',
      phone: '+1234567892',
    },
  });

  console.log(`Created ${3} users`);

  // Create Service Categories
  console.log('Creating service categories...');
  const maintenanceCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Mantenimiento',
      description: 'Servicios de mantenimiento preventivo y correctivo',
    },
  });

  const repairCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Reparaciones',
      description: 'Reparaciones mecánicas y eléctricas',
    },
  });

  const diagnosticCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Diagnóstico',
      description: 'Servicios de diagnóstico y revisión',
    },
  });

  const bodyworkCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Carrocería y Pintura',
      description: 'Trabajos de carrocería y pintura',
    },
  });

  console.log(`Created ${4} service categories`);

  // Create Services
  console.log('Creating services...');
  const services = await Promise.all([
    prisma.service.create({
      data: {
        code: 'SRV-001',
        name: 'Cambio de Aceite',
        description: 'Cambio de aceite de motor con filtro',
        categoryId: maintenanceCategory.id,
        basePrice: 45.00,
        estimatedHours: 0.5,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-002',
        name: 'Revisión General',
        description: 'Revisión completa de 25 puntos',
        categoryId: maintenanceCategory.id,
        basePrice: 80.00,
        estimatedHours: 1.5,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-003',
        name: 'Cambio de Frenos',
        description: 'Reemplazo de pastillas y discos de freno',
        categoryId: repairCategory.id,
        basePrice: 250.00,
        estimatedHours: 2.0,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-004',
        name: 'Alineación y Balanceo',
        description: 'Alineación de dirección y balanceo de neumáticos',
        categoryId: maintenanceCategory.id,
        basePrice: 60.00,
        estimatedHours: 1.0,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-005',
        name: 'Diagnóstico Electrónico',
        description: 'Diagnóstico con escáner OBD2',
        categoryId: diagnosticCategory.id,
        basePrice: 50.00,
        estimatedHours: 0.5,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-006',
        name: 'Reparación de Motor',
        description: 'Reparación general de motor',
        categoryId: repairCategory.id,
        basePrice: 800.00,
        estimatedHours: 8.0,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-007',
        name: 'Cambio de Batería',
        description: 'Reemplazo de batería con prueba del sistema eléctrico',
        categoryId: maintenanceCategory.id,
        basePrice: 30.00,
        estimatedHours: 0.3,
      },
    }),
    prisma.service.create({
      data: {
        code: 'SRV-008',
        name: 'Pintura Completa',
        description: 'Pintura completa del vehículo',
        categoryId: bodyworkCategory.id,
        basePrice: 1500.00,
        estimatedHours: 16.0,
      },
    }),
  ]);

  console.log(`Created ${services.length} services`);

  // Create Suppliers
  console.log('Creating suppliers...');
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'AutoParts Distribuidora',
      taxId: 'TAX-001',
      email: 'ventas@autoparts.com',
      phone: '+1234567893',
      address: 'Calle Principal 123',
      website: 'https://autoparts.com',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'MegaParts Internacional',
      taxId: 'TAX-002',
      email: 'info@megaparts.com',
      phone: '+1234567894',
      address: 'Avenida Industrial 456',
      website: 'https://megaparts.com',
    },
  });

  console.log(`Created ${2} suppliers`);

  // Create Parts
  console.log('Creating parts...');
  const parts = await Promise.all([
    prisma.part.create({
      data: {
        code: 'PART-001',
        name: 'Filtro de Aceite',
        description: 'Filtro de aceite universal',
        category: 'Filtros',
        brand: 'Premium',
        costPrice: 5.00,
        salePrice: 12.00,
        currentStock: 50,
        minStock: 10,
        maxStock: 100,
        location: 'Estante A1',
        supplierId: supplier1.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-002',
        name: 'Aceite de Motor 5W-30',
        description: 'Aceite sintético 5W-30 (1 galón)',
        category: 'Lubricantes',
        brand: 'Castrol',
        costPrice: 15.00,
        salePrice: 25.00,
        currentStock: 30,
        minStock: 15,
        maxStock: 60,
        location: 'Estante B2',
        supplierId: supplier1.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-003',
        name: 'Pastillas de Freno Delanteras',
        description: 'Pastillas de freno cerámicas',
        category: 'Frenos',
        brand: 'Brembo',
        costPrice: 45.00,
        salePrice: 85.00,
        currentStock: 20,
        minStock: 5,
        maxStock: 40,
        location: 'Estante C3',
        supplierId: supplier2.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-004',
        name: 'Discos de Freno Delanteros',
        description: 'Par de discos de freno ventilados',
        category: 'Frenos',
        brand: 'Brembo',
        costPrice: 80.00,
        salePrice: 150.00,
        currentStock: 15,
        minStock: 5,
        maxStock: 30,
        location: 'Estante C4',
        supplierId: supplier2.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-005',
        name: 'Batería 12V 60Ah',
        description: 'Batería de arranque libre de mantenimiento',
        category: 'Eléctrico',
        brand: 'Bosch',
        costPrice: 70.00,
        salePrice: 120.00,
        currentStock: 12,
        minStock: 5,
        maxStock: 25,
        location: 'Estante D1',
        supplierId: supplier1.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-006',
        name: 'Filtro de Aire',
        description: 'Filtro de aire de motor',
        category: 'Filtros',
        brand: 'K&N',
        costPrice: 8.00,
        salePrice: 18.00,
        currentStock: 40,
        minStock: 10,
        maxStock: 80,
        location: 'Estante A2',
        supplierId: supplier1.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-007',
        name: 'Bujías (Set de 4)',
        description: 'Juego de 4 bujías de platino',
        category: 'Sistema de Encendido',
        brand: 'NGK',
        costPrice: 20.00,
        salePrice: 40.00,
        currentStock: 25,
        minStock: 8,
        maxStock: 50,
        location: 'Estante E1',
        supplierId: supplier2.id,
      },
    }),
    prisma.part.create({
      data: {
        code: 'PART-008',
        name: 'Refrigerante (1 galón)',
        description: 'Refrigerante anticongelante verde',
        category: 'Lubricantes',
        brand: 'Prestone',
        costPrice: 10.00,
        salePrice: 20.00,
        currentStock: 35,
        minStock: 12,
        maxStock: 60,
        location: 'Estante B3',
        supplierId: supplier1.id,
      },
    }),
  ]);

  console.log(`Created ${parts.length} parts`);

  // Create Clients
  console.log('Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+1234567895',
      address: 'Calle Falsa 123, Ciudad',
      taxId: 'CLI-001',
      notes: 'Cliente frecuente, descuento del 5%',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'María García',
      email: 'maria.garcia@email.com',
      phone: '+1234567896',
      address: 'Avenida Siempre Viva 742',
      taxId: 'CLI-002',
    },
  });

  const client3 = await prisma.client.create({
    data: {
      name: 'Carlos López',
      email: 'carlos.lopez@email.com',
      phone: '+1234567897',
      address: 'Calle del Sol 456',
      taxId: 'CLI-003',
    },
  });

  console.log(`Created ${3} clients`);

  // Create Vehicles
  console.log('Creating vehicles...');
  const vehicle1 = await prisma.vehicle.create({
    data: {
      clientId: client1.id,
      licensePlate: 'ABC-123',
      vin: '1HGBH41JXMN109186',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Azul',
      mileage: 35000,
      notes: 'Mantenimiento regular cada 5000 km',
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      clientId: client2.id,
      licensePlate: 'XYZ-789',
      vin: '2HGBH41JXMN109187',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2019,
      color: 'Blanco',
      mileage: 42000,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      clientId: client3.id,
      licensePlate: 'DEF-456',
      vin: '3HGBH41JXMN109188',
      brand: 'Ford',
      model: 'Focus',
      year: 2021,
      color: 'Rojo',
      mileage: 18000,
    },
  });

  console.log(`Created ${3} vehicles`);

  // Create Appointments
  console.log('Creating appointments...');
  const appointment1 = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-2025-001',
      clientId: client1.id,
      vehicleId: vehicle1.id,
      userId: receptionistUser.id,
      status: 'SCHEDULED',
      scheduledDate: new Date('2025-10-15T10:00:00'),
      duration: 60,
      serviceType: 'Cambio de Aceite',
      description: 'Cambio de aceite y revisión general',
    },
  });

  console.log(`Created ${1} appointment`);

  console.log('✅ Database seeding completed successfully!');
  console.log('\n=== Login Credentials ===');
  console.log('Admin:');
  console.log('  Email: admin@tallerocampos.com');
  console.log('  Password: Admin123!');
  console.log('\nTechnician:');
  console.log('  Email: technician@tallerocampos.com');
  console.log('  Password: Admin123!');
  console.log('\nReceptionist:');
  console.log('  Email: receptionist@tallerocampos.com');
  console.log('  Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });