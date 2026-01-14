# Grocery Comparison App

A modern grocery price comparison application built with Next.js, featuring a layered architecture pattern.

## 🏗️ Architecture

This application follows a **layered architecture pattern** with clear separation of concerns:

- **Server Layer**: Request routing and orchestration
- **Middleware Layer**: Authentication, CORS, request processing
- **Controller Layer**: Business logic and validation
- **Model Layer**: Data models and operations
- **Database Layer**: Database abstraction

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
app/
├── api/              # Next.js API Routes
├── server/            # Server Layer
├── middleware/        # Middleware Layer
├── controller/        # Controller Layer
├── models/            # Model Layer
├── database/          # Database Layer
└── init.ts           # Application initialization

lib/
├── api.ts            # API client functions
├── types.ts          # Type definitions
└── store.ts          # State management
```

## 🔧 Features

- Price comparison across multiple stores
- Product search and filtering
- Category-based browsing
- Shopping cart management
- JSON-RPC API
- RESTful API endpoints

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [README-ARCHITECTURE.md](./README-ARCHITECTURE.md) - Quick architecture reference
