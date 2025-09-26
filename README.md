# Taller Mecánico - Auto Repair Shop Management System

A comprehensive management system for auto repair shops with web and mobile applications, featuring real-time synchronization, offline support, and complete business workflow automation.

## Features

- **Client Management**: Complete customer database with history tracking
- **Vehicle Registry**: Detailed vehicle information and service history
- **Work Orders**: Full workflow from draft to completion with status tracking
- **Inventory Management**: Parts tracking with stock alerts and supplier management
- **Invoicing & Payments**: Professional invoices with multiple payment methods
- **Real-time Sync**: Live updates across all devices
- **Offline Support**: Work without internet, sync when connected
- **Multi-platform**: Web, Android, and iOS applications

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Mobile**: React Native with Expo
- **Real-time**: Socket.io
- **Authentication**: JWT

## Quick Start with Docker

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taller-mecanico.git
cd taller-mecanico
```

2. Create environment file:
```bash
cp backend/.env.example backend/.env
```

3. Start with Docker Compose:
```bash
docker-compose up -d
```

4. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PgAdmin: http://localhost:5050

## Manual Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Run database migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. Start development server:
```bash
npm run dev
```

### Mobile Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start Expo:
```bash
npx expo start
```

## Project Structure

```
taller-mecanico/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/       # Database schema
├── frontend/         # Next.js web application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── store/
├── mobile/          # React Native mobile app
│   └── src/
└── shared/          # Shared types and utilities
```

## API Documentation

The API follows RESTful principles. Base URL: `http://localhost:3001/api`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Clients
- `GET /clients` - List all clients
- `GET /clients/:id` - Get client details
- `POST /clients` - Create new client
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client

### Vehicles
- `GET /vehicles` - List all vehicles
- `GET /vehicles/:id` - Get vehicle details
- `POST /vehicles` - Create new vehicle
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Delete vehicle

### Work Orders
- `GET /work-orders` - List all work orders
- `GET /work-orders/:id` - Get work order details
- `POST /work-orders` - Create new work order
- `PUT /work-orders/:id` - Update work order
- `PATCH /work-orders/:id/status` - Update status

### Inventory
- `GET /inventory/parts` - List all parts
- `POST /inventory/parts` - Add new part
- `POST /inventory/parts/:id/adjust-stock` - Adjust stock levels

### Invoices
- `GET /invoices` - List all invoices
- `POST /invoices` - Create new invoice
- `GET /invoices/:id/export/pdf` - Export as PDF

### Payments
- `GET /payments` - List all payments
- `POST /payments` - Record new payment

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

## Deployment

### Production Build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# Mobile
cd mobile && expo build
```

### Environment Variables

Create `.env.production` files with production values for:
- Database credentials
- JWT secrets
- API URLs
- Cloud storage keys

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@tallermecanico.com or create an issue in the repository.