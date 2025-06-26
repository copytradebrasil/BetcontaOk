# BetConta - Banco Digital para Apostas Esportivas

## Overview

This is a full-stack TypeScript application for a digital banking platform specialized in sports betting management. The system provides master accounts for users and child accounts for managing different betting houses, with integrated KYC verification, PIX transactions, and an affiliate program. The platform includes both user-facing functionality and a comprehensive admin panel for managing operations.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and data layers:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Express sessions with PostgreSQL storage
- **File Uploads**: Multer for handling multipart/form-data
- **Authentication**: Simple session-based auth for both users and admin

### Database Architecture
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with connection pooling
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: WebSocket-based connection with retry logic

## Key Components

### User Management System
- **Master Accounts**: Primary user accounts with full profile management
- **Child Accounts**: Sub-accounts for different betting houses with individual KYC status
- **KYC Verification**: Document upload and verification workflow
- **Profile Management**: Complete user profile with address and banking details

### Financial System
- **PIX Integration**: Deposit and withdrawal transaction management
- **Balance Management**: Real-time balance tracking across accounts
- **Transaction History**: Complete audit trail of all financial operations
- **QR Code Management**: Custom QR code generation for transactions

### Admin Panel
- **Dashboard**: Real-time statistics and metrics
- **User Management**: Complete oversight of master and child accounts
- **KYC Approval**: Document review and status management
- **Financial Oversight**: Transaction monitoring and reporting
- **System Maintenance**: Alert management and system configuration

### Affiliate Program
- **Referral System**: User-to-user referral tracking
- **Commission Management**: Automated commission calculations
- **Sales Tracking**: Complete sales and conversion metrics
- **Request Management**: Affiliate application and approval workflow

## Data Flow

### User Registration & Authentication
1. User registers with basic information
2. Session is created and stored in PostgreSQL
3. User completes profile with KYC documents
4. Admin reviews and approves/rejects KYC
5. User gains access to full platform features

### Child Account Creation
1. User creates child account for specific betting house
2. System generates unique account identifiers
3. KYC documents are submitted for the child account
4. Admin reviews and updates status
5. Account becomes active upon approval

### Transaction Processing
1. User initiates PIX transaction (deposit/withdrawal)
2. Transaction is recorded with pending status
3. External PIX processing occurs
4. Transaction status is updated
5. User balance is adjusted accordingly

### Admin Operations
1. Admin logs in with hardcoded credentials
2. Dashboard displays real-time metrics
3. Admin can review and approve KYC documents
4. Financial transactions can be monitored
5. System alerts and maintenance can be managed

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **express**: Web server framework
- **multer**: File upload handling

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling
- **tailwindcss**: CSS framework

### External Services
- **Neon Database**: Managed PostgreSQL hosting
- **ViaCEP API**: Brazilian postal code address lookup
- **Replit**: Development and deployment platform

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts development server
- **Port**: Application runs on port 5000
- **Hot Reload**: Vite provides instant feedback during development
- **Database**: Connected to Neon serverless PostgreSQL

### Production Build
- **Frontend**: Built with Vite to static assets
- **Backend**: Bundled with esbuild for Node.js execution
- **Deployment**: Replit autoscale deployment
- **Environment**: Production mode with optimized builds

### Database Management
- **Migrations**: Managed through Drizzle Kit
- **Schema**: Centralized in `shared/schema.ts`
- **Connection Pooling**: Configured for production scalability
- **Retry Logic**: Built-in database operation retry with exponential backoff

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Fixed deployment error by removing missing asset reference
- June 26, 2025. Created contas_extrato and deposito_qrcode database tables
- June 26, 2025. Configured SSH key for GitHub integration