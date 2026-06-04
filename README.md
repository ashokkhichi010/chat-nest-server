# Chat-Application: Back-end Service

[![NestJS](https://img.shields.io/badge/Framework-NestJS-E0234E?logo=nestjs)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Swagger](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?logo=swagger)](http://localhost:4040/api)

The backbone of the Chat-Application ecosystem, providing secure, real-time services for communication, gaming, and trading simulation.

## 🛠️ Tech Stack
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: MongoDB via Mongoose
- **Real-time**: Socket.io
- **Auth**: JWT & Passport
- **Documentation**: Swagger/OpenAPI
- **Logging**: Custom Morgan & Interceptor-based logging

## 📂 Core Modules

### 🔐 Authentication (`/auth`, `/users`)
- Robust JWT-based authentication flow.
- Role-based access control (Admin/User).
- Password encryption using Bcrypt.

### 🎮 Gaming Engines (`/chess`, `/ludo`)
- **Stateful Logic**: Server-side game state management to prevent cheating.
- **Socket Gateways**: Dedicated namespaces for chess and ludo synchronization.
- **Multi-mode support**: Handling different player configurations (Offline/Bot/Online).

### 📈 Trading Simulation (`/smartapi`, `/trading-simulation`)
- **Integration**: Angel One (SmartAPI) integration for fetching real-time market indices.
- **Virtual Portfolio**: Tracking user trades and balances without real financial risk.
- **AI Recommendations**: Feature-ready module for stock analysis and suggestions.

### 💬 Messaging (`/message`, `/gateways`)
- Real-time message delivery.
- Message persistence in MongoDB.
- Support for notifications and unread counts.

## 🚀 Development Workflow

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Important variables:
- `MONGODB_URL`: Connection string.
- `JWT_SECRET`: Secret key for token signing.
- `SMARTAPI_KEY`: Credentials from Angel One developer portal.

### Running the Server
```bash
# Development
npm run start:dev

# Production Build
npm run build
npm run start:prod
```

### API Documentation
Once running, visit: `http://localhost:4040/api` to view the interactive Swagger documentation.

## 🏗️ Architecture Highlights

### Request Lifecycle
1.  **Guards**: Validating JWT tokens and user permissions.
2.  **Interceptors**: Standardizing response formats and logging performance metrics.
3.  **Pipes**: Data transformation and validation via `class-validator`.
4.  **Filters**: Centralized exception handling to ensure consistent error responses.

### Socket.io Implementation
The server uses dedicated Gateways to manage real-time traffic. Each gateway handles:
- Connection/Disconnection management.
- Room-based broadcasting (for group chats and game boards).
- Acknowledgements for critical actions (e.g., "Roll Dice").

## 🧪 Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 🛠️ Maintenance & Cleanup
- **Logs**: Located in the `/logs` directory (if configured).
- **Format**: `npm run format` uses Prettier for code consistency.
- **Lint**: `npm run lint` uses ESLint with strict TypeScript rules.

## ❓ Troubleshooting

### Connection Refused (MongoDB)
Ensure MongoDB is running locally or that your IP is whitelisted in MongoDB Atlas. Check the `MONGODB_URL` in your `.env`.

### JWT Secret Missing
The app will fail to start if `JWT_SECRET` is not provided. Generate a strong key for local development.

### SmartAPI Errors
Ensure your `SMARTAPI_CLIENT_ID` and `PASSWORD` are correct. Some features may require an active TOTP or a valid session from the Angel One portal.
