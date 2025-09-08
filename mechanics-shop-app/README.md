# Mechanics Shop Management System

A comprehensive web-based management system for auto repair shops, built with modern technologies for scalability and ease of use.

## 🚀 Features

- **Dashboard**: Real-time overview of shop operations with key metrics
- **Client Management**: Complete customer database with contact info and service history
- **Vehicle Management**: Track vehicle details, service history, and maintenance schedules
- **Work Order Management**: Full service order lifecycle from creation to completion
- **User Authentication**: Secure login with role-based access control
- **Multi-tenant Support**: Support for multiple shops with data isolation

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **TypeScript** - Type safety and better development experience
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Professional component library
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Vite** - Fast build tool

## 🏗️ Project Structure

```
mechanics-shop-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── database.sql
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with the following key entities:

- **Users** - Authentication and user management
- **Shops** - Multi-tenant shop information
- **Clients** - Customer database
- **Vehicles** - Vehicle information and history
- **Work Orders** - Service orders and job tracking
- **Parts Inventory** - Parts management and pricing
- **Financial Transactions** - Billing and payment tracking
- **Schedules** - Appointment and service scheduling

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Database Setup

1. Create a PostgreSQL database:
```bash
createdb mechanics_shop
```

2. Run the database schema:
```bash
psql -d mechanics_shop -f backend/database.sql
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/mechanics_shop
JWT_SECRET=your-super-secret-jwt-key-here
```

5. Start the development server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:3000

## 📱 Usage

### First Time Setup

1. Start both backend and frontend servers
2. Navigate to http://localhost:3000
3. Click "Register" to create a new account
4. Fill in your details and shop name
5. Login with your credentials
6. Start adding clients and managing work orders!

### Default Login (if using sample data)

- Email: `admin@mechanic.shop`
- Password: `password` (This is hashed as `$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`)

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Request validation
- SQL injection prevention
- XSS protection headers

## 🎨 UI Features

- Responsive design for mobile and desktop
- Material Design components
- Real-time data updates
- Intuitive navigation
- Professional color scheme
- Loading states and error handling

## 🚀 Deployment

The application is ready for deployment on cloud platforms:

- **Backend**: Can be deployed on Heroku, AWS, DigitalOcean, etc.
- **Frontend**: Can be deployed on Netlify, Vercel, AWS S3, etc.
- **Database**: PostgreSQL on AWS RDS, Google Cloud SQL, etc.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please create an issue in the GitHub repository.

---

Built with ❤️ for auto repair shops worldwide.