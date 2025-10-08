# RDRDC Property Management System

A comprehensive enterprise-grade property management system built for managing commercial and residential properties, tenants, leases, maintenance, financial operations, and project management.

## Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Core Features](#core-features)
- [System Flowchart](#system-flowchart)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Project Structure](#project-structure)

## System Overview

The RDRDC Property Management System is a full-stack web application designed to streamline property management operations. It provides comprehensive tools for managing properties, spaces, tenants, leases, financial tracking, maintenance requests, tax management, and project workflows.

### Key Capabilities

- Multi-property and multi-space management
- Tenant lifecycle management with automated workflows
- Lease management with support for multiple spaces per lease
- Financial operations including PDC monitoring and AR aging
- Tax management for both properties and individual spaces
- Maintenance request tracking and scheduling
- Document management with secure file storage
- Project management with Kanban boards
- Audit logging and activity tracking
- Role-based access control with 12 user roles
- Comprehensive reporting and analytics

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 with React 19.1.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom animations
- **UI Components**: Shadcn UI components
- **Forms**: React Hook Form 7 with Zod validation
- **Drag & Drop**: DnD Kit for Kanban boards
- **Charts**: Recharts for data visualization
- **Date Handling**: date-fns 4.1.0
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Theme Management**: next-themes

### Backend
- **Runtime**: Node.js with Next.js App Router
- **Authentication**: NextAuth v5 (beta.29) with JWT sessions
- **Database ORM**: Prisma 6.16.3
- **Primary Database**: PostgreSQL (via Prisma)
- **Secondary Database**: Microsoft SQL Server (mssql 12.0.0)
- **File Storage**: MinIO 8.0.6 (S3-compatible object storage)
- **Password Hashing**: bcryptjs 3.0.2

### Development Tools
- **Build Tool**: Turbopack
- **Linting**: ESLint 9
- **Code Quality**: TypeScript strict mode
- **Database Migrations**: Prisma Migrate

### PDF Generation
- **Library**: jsPDF 3.0.3 with jsPDF-AutoTable 5.0.2

## System Architecture

### Architecture Pattern

The system follows a modern **Layered Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  (Next.js Pages, React Components, Client-side Logic)       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│     (Server Actions, Validation, Business Rules)             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│        (Prisma ORM, Database Queries, File Storage)          │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Infrastructure Layer                    │
│    (PostgreSQL, MSSQL, MinIO, NextAuth, Middleware)         │
└─────────────────────────────────────────────────────────────┘
```

### Application Structure

#### 1. Presentation Layer

**Components** (`/components`)
- **Dashboard**: Analytics widgets, charts, and overview cards
- **Properties**: Property and space management interfaces
- **Tenants**: Tenant profile and lease management
- **Documents**: Document upload, viewing, and organization
- **Projects**: Kanban boards and task management
- **UI**: Reusable Radix UI components
- **Forms**: Multi-step form wizards with validation
- **Layouts**: Sidebar navigation, breadcrumbs, headers

**Pages** (`/app/(dashboard)`)
- Server-rendered pages using Next.js App Router
- Suspense boundaries for optimized loading
- Dynamic routing for detail views
- Protected routes with role-based access

#### 2. Business Logic Layer

**Server Actions** (`/lib/actions`)
- Property operations (CRUD, tax management, utilities)
- Tenant operations (profiles, leases, notices)
- space operations (floor configuration, taxes, utilities)
- Financial operations (PDC tracking, AR aging, payments)
- Document management (upload, retrieval, organization)
- Project management (boards, tasks, comments)
- Dashboard analytics and reporting
- Notification management
- Search functionality

**Validations** (`/lib/validations`)
- Zod schemas for type-safe form validation
- Business rule enforcement
- Data integrity checks

#### 3. Data Access Layer

**Prisma Client** (`/lib/prisma.ts`)
- Type-safe database queries
- Transaction management
- Query optimization with indexes
- Relationship eager loading

**Database Connections**
- Primary: PostgreSQL via Prisma ORM
- Secondary: MSSQL via mssql library (legacy system integration)
- File Storage: MinIO client for S3-compatible object storage

#### 4. Infrastructure Layer

**Authentication** (`auth.ts`, `auth.config.ts`, `middleware.ts`)
- NextAuth v5 with Prisma adapter
- JWT session strategy (8-hour sessions)
- Credential-based authentication with bcrypt
- Protected routes via middleware
- Audit logging for authentication events
- Role-based access control

**File Storage** (`/lib/minio.ts`)
- MinIO S3-compatible object storage
- Public and private bucket support
- Pre-signed URL generation for secure access
- Automatic bucket initialization

**Database** (`/prisma/schema.prisma`)
- 30+ models covering all business entities
- Comprehensive relationships with cascading rules
- Audit trail tracking
- Notification system integration

## Core Features

### 1. Property Management
- Create and manage multiple properties
- Track property details, leasable areas, addresses
- Property-level utilities and documents
- Property title management with encumbrance tracking
- Title movement tracking (requested, released, returned)
- Property tax management (annual and quarterly)
- Property-level reporting

### 2. Space Management
- Create spaces with flexible floor configurations
- Support for 5 floor types (Ground, Mezzanine, 2nd, 3rd, Rooftop)
- Individual rent calculation per floor type
- Space status tracking (Vacant, Occupied, Maintenance, Reserved)
- Space-level tax management
- Space-level utility accounts
- Space history and maintenance tracking
- Document attachment per space

### 3. Tenant Management
- Complete tenant profiles with business information
- Emergency contact management
- Business partner (BP) code assignment
- Multi-space lease support (one tenant, multiple spaces)
- Tenant status tracking (Active, Inactive, Pending)
- Document management per tenant
- Maintenance request submission
- Payment history tracking

### 4. Lease Management
- Create leases with multiple spaces
- Flexible lease terms and renewal tracking
- Security deposit management
- Automatic rent calculation from space configurations
- Lease status lifecycle (Pending, Active, Expired, Terminated)
- Termination tracking with reasons
- Payment schedule management

### 5. Financial Operations

**Credit & Collection**
- Tenant notice generation (1st, 2nd, Final notices)
- Notice item tracking with custom statuses
- PDC (Post-Dated Check) monitoring
- PDC status tracking (Open, Deposited, Returned, Bounced)
- AR Aging reports with MSSQL integration
- Payment tracking and reconciliation

**Tax Management**
- Property-level real property taxes
- Space-level space taxes
- Annual and quarterly tax support
- Payment tracking with due dates
- Processed by and marked by tracking
- File attachment support for tax documents

### 6. Maintenance Management
- Work request submission by tenants
- Priority-based categorization
- Assignment to maintenance staff
- Status tracking (Pending, Assigned, In Progress, Completed)
- Completion date tracking
- Multiple categories (Plumbing, Electrical, HVAC, etc.)

### 7. Project Management
- Multiple projects with team members
- Kanban boards with drag-and-drop
- Custom columns per board
- Task management with priorities
- Task assignment and tracking
- Comments and attachments
- Activity timeline
- Label system
- Due date tracking

### 8. Document Management
- Centralized document repository
- Type-based organization (Lease, Contract, Invoice, etc.)
- Property, space, and tenant-level documents
- Secure file upload to MinIO
- Document preview and download
- Search and filter capabilities
- Upload tracking (who, when)

### 9. Reporting & Analytics

**Dashboard Analytics**
- Real-time property and space statistics
- Occupancy rates and trends
- Financial overview (revenue, expenses)
- Maintenance request statistics
- Tax payment tracking
- Lease expiration alerts
- Payment status overview

**Reports**
- Occupancy reports
- Leasing reports
- Tax reports
- Maintenance reports
- Custom date range filtering
- Export capabilities (PDF)

### 10. System Features

**User Management**
- 12 distinct user roles with granular permissions
- Role-based access control (RBAC)
- User profiles with contact information
- Avatar support
- Role-specific navigation

**Audit System**
- Comprehensive activity logging
- Track all CRUD operations
- IP address and user agent tracking
- Metadata storage for context
- Entity-level tracking

**Notification System**
- Real-time notifications
- Priority-based alerts
- Multiple notification types
- Mark as read/unread
- Action URLs for quick navigation
- Expiration dates

**Global Search**
- Search across properties, spaces, tenants
- Command palette interface
- Keyboard shortcuts
- Quick navigation

## System Flowchart

### User Authentication Flow

```
┌─────────────┐
│   User      │
│  Accesses   │
│   System    │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│  Middleware  │ ◄── Route Protection
│   Checks     │     Session Validation
│   Session    │
└──────┬───────┘
       │
       ├─── Not Authenticated ──► Redirect to Login
       │
       ▼
  Authenticated
       │
       ▼
┌──────────────┐
│ NextAuth JWT │
│   Session    │
│  Validation  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Role-Based  │
│   Access     │
│   Control    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Dashboard   │
│   or Page    │
└──────────────┘
```

### Property & space Management Flow

```
┌─────────────┐
│   Create    │
│  Property   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Property Details           │
│  - Code, Name, Address      │
│  - Type (Res/Com/Mixed)     │
│  - Leasable Area            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Add Property Titles        │
│  - Title No, Lot No         │
│  - Registered Owner         │
│  - Encumbrance Status       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Create Spaces               │
│  - Space Number              │
│  - Link to Property Title   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Configure Space Floors      │
│  - Ground Floor (area/rate) │
│  - Mezzanine (area/rate)    │
│  - 2nd Floor (area/rate)    │
│  - 3rd Floor (area/rate)    │
│  - Rooftop (area/rate)      │
└──────┬──────────────────────┘
       │
       ▼
  ┌────────────────┐
  │  Total Rent =  │
  │  Sum of Floor  │
  │  Calculations  │
  └────────────────┘
```

### Tenant Leasing Flow

```
┌─────────────┐
│   Create    │
│   Tenant    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Tenant Information         │
│  - BP Code (unique)         │
│  - Personal Info            │
│  - Business Info            │
│  - Contact Details          │
│  - Emergency Contact        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Create Lease               │
│  - Start/End Date           │
│  - Security Deposit         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Select Spaces               │
│  (Multiple Selection)       │
│  - space 1: ₱XX,XXX         │
│  - space 2: ₱XX,XXX         │
│  - space 3: ₱XX,XXX         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Total Rent Calculation     │
│  = Sum of Selected spaces    │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Lease Status: PENDING      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Activate Lease             │
│  - Update space Status       │
│  - Status: ACTIVE           │
└──────────────────────────────┘
```

### Credit & Collection Flow

```
┌─────────────────┐
│  PDC Entry      │
│  (Post-Dated    │
│   Checks)       │
└────────┬────────┘
         │
         ▼
┌───────────────────────────┐
│  PDC Details              │
│  - Check No, Bank Name    │
│  - Due Date, Amount       │
│  - Reference No           │
│  - Tenant BP Code         │
│  - Status: Open           │
└────────┬──────────────────┘
         │
         ▼
┌────────────────────────────┐
│  PDC Monitoring            │
│  - Track Due Dates         │
│  - Status Updates          │
│  - Deposit/Return/Bounce   │
└────────┬───────────────────┘
         │
         ├──► Overdue? ──┐
         │               │
         ▼               ▼
    No Action      ┌────────────┐
                   │  Generate  │
                   │  1st Notice│
                   └──────┬─────┘
                          │
                   Still Overdue?
                          │
                          ▼
                   ┌────────────┐
                   │  Generate  │
                   │  2nd Notice│
                   └──────┬─────┘
                          │
                   Still Overdue?
                          │
                          ▼
                   ┌────────────┐
                   │  Generate  │
                   │Final Notice│
                   └──────┬─────┘
                          │
                          ▼
                   ┌────────────┐
                   │  Escalate  │
                   │to Finance  │
                   └────────────┘
```

### Document Management Flow

```
┌─────────────┐
│   Upload    │
│  Document   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Document Details           │
│  - Name, Description        │
│  - Type (Lease/Contract)    │
│  - File Selection           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Associate with Entity      │
│  - Property, or             │
│  - Space, or                 │
│  - Tenant                   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Upload to MinIO            │
│  - Generate Unique Filename │
│  - Store in S3 Bucket       │
│  - Get Public URL           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Save to Database           │
│  - URL, Metadata            │
│  - Uploaded By, Timestamp   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Document Available         │
│  - View                     │
│  - Download                 │
│  - Delete (if authorized)   │
└──────────────────────────────┘
```

### Project Management Flow (Kanban)

```
┌─────────────┐
│   Create    │
│   Project   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Project Setup              │
│  - Name, Description        │
│  - Owner, Members           │
│  - Start/End Date           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Create Board               │
│  (from template or custom)  │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Board Columns              │
│  - To Do                    │
│  - In Progress              │
│  - Review                   │
│  - Done                     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Create Tasks               │
│  - Title, Description       │
│  - Priority, Due Date       │
│  - Assign to Member         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Task Operations            │
│  - Drag to Move Columns     │
│  - Add Comments             │
│  - Add Attachments          │
│  - Update Status            │
│  - Add Labels               │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Activity Tracking          │
│  - All changes logged       │
│  - Timeline view            │
└──────────────────────────────┘
```

### Tax Management Flow

```
┌──────────────────────┐
│  Property Tax Entry  │
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────┐
│  Tax Details                │
│  - Tax Declaration No       │
│  - Tax Year                 │
│  - Amount                   │
│  - Due Date                 │
│  - Annual/Quarterly         │
│  - Quarter Number (if Q)    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Link to Property Title     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Tax Monitoring             │
│  - Track Due Dates          │
│  - Payment Reminders        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Mark as Paid               │
│  - Paid Date                │
│  - Processed By             │
│  - Attach Receipt           │
│  - Remarks                  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Generate Reports           │
│  - Paid/Unpaid Summary      │
│  - Quarterly Reports        │
│  - Annual Reports           │
└──────────────────────────────┘
```

## Database Schema

### Core Entities

**Users & Authentication**
- `User` - System users with roles
- `Account` - OAuth account linking
- `Session` - Active user sessions
- `VerificationToken` - Email verification

**Property Management**
- `Property` - Buildings and facilities
- `PropertyTitles` - Legal property titles
- `PropertyTitleMovement` - Title tracking
- `PropertyTax` - Property-level taxes
- `space` - Individual spaces/spaces
- `spaceFloor` - Floor configurations
- `spaceTax` - space-level taxes
- `PropertyUtility` - Property utilities
- `spaceUtilityAccount` - space-level utilities
- `UtilityBill` - Utility billing

**Tenant & Lease Management**
- `Tenant` - Tenant profiles
- `Lease` - Lease contracts
- `Leasespace` - Lease-space junction (many-to-many)
- `Payment` - Payment records
- `PDC` - Post-dated checks

**Operations**
- `MaintenanceRequest` - Work orders
- `Document` - File management
- `TenantNotice` - Collection notices
- `NoticeItem` - Notice line items

**Project Management**
- `Project` - Projects
- `ProjectMember` - Team members
- `Board` - Kanban boards
- `Column` - Board columns
- `Task` - Project tasks
- `TaskComment` - Task discussions
- `TaskAttachment` - Task files
- `TaskActivity` - Task history
- `TaskLabel` - Task labels

**System**
- `AuditLog` - Activity tracking
- `Notification` - User notifications

### Key Relationships

1. **One Property → Many spaces**
2. **One Property → Many Titles**
3. **One Title → Many Property Taxes**
4. **One Title → Many spaces** (optional link)
5. **One space → Many Floor Configurations**
6. **One space → Many space Taxes**
7. **One Tenant → Many Leases**
8. **One Lease ↔ Many spaces** (via Leasespace)
9. **One space → Many Maintenance Requests**
10. **One Project → Many Boards**
11. **One Board → Many Columns**
12. **One Column → Many Tasks**

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- MinIO server (or S3-compatible storage)
- Microsoft SQL Server (optional, for AR aging integration)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd new-pms-v3
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables (see [Environment Configuration](#environment-configuration))

4. Run Prisma migrations
```bash
npx prisma migrate dev
```

5. Generate Prisma Client
```bash
npx prisma generate
```

6. Run the development server
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm run start
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/pms_db"
DIRECT_URL="postgresql://user:password@localhost:5432/pms_db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# MinIO Configuration
MINIO_ENDPOINT="s3-api.rdrealty.com.ph"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_DOCUMENTS_BUCKET="pms-bucket"

# MSSQL Configuration (Optional - for AR Aging)
DB_HOST="your-mssql-host"
DB_NAME="your-database-name"
DB_USER="your-username"
DB_PASSWORD="your-password"
```

## Project Structure

```
new-pms-v3/
├── app/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/            # Main dashboard
│   │   ├── properties/           # Property management
│   │   ├── tenants/              # Tenant management
│   │   ├── documents/            # Document management
│   │   ├── projects/             # Project management
│   │   ├── notices/              # Collection notices
│   │   ├── pdc-monitoring/       # PDC tracking
│   │   ├── ar-aging/             # AR aging reports
│   │   ├── taxes/                # Tax management
│   │   ├── maintenance/          # Maintenance requests
│   │   ├── reports/              # Analytics & reports
│   │   ├── users/                # User management
│   │   └── system/               # System settings
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── upload/               # File upload
│   │   ├── ar-aging/             # AR aging data
│   │   └── minio/                # MinIO operations
│   ├── globals.css               # Global styles
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard widgets
│   ├── properties/               # Property components
│   ├── tenants/                  # Tenant components
│   ├── spaces/                    # space components
│   ├── documents/                # Document components
│   ├── projects/                 # Project/Kanban components
│   ├── sidebar/                  # Navigation sidebar
│   ├── breadcrumb/               # Breadcrumb navigation
│   ├── notifications/            # Notification center
│   ├── search/                   # Global search
│   └── ui/                       # Reusable UI components
│
├── lib/
│   ├── actions/                  # Server actions
│   │   ├── property-actions.ts
│   │   ├── tenant-actions.ts
│   │   ├── space-actions.ts
│   │   ├── lease-actions.ts
│   │   ├── document-actions.ts
│   │   ├── project-actions.ts
│   │   ├── pdc-actions.ts
│   │   └── ...
│   ├── validations/              # Zod schemas
│   ├── utils/                    # Utility functions
│   ├── auth-actions/             # Auth operations
│   ├── prisma.ts                 # Prisma client
│   ├── minio.ts                  # MinIO client
│   ├── database.ts               # MSSQL connection
│   └── utils.ts                  # General utilities
│
├── prisma/
│   └── schema.prisma             # Database schema
│
├── types/                        # TypeScript types
├── public/                       # Static assets
├── auth.ts                       # NextAuth configuration
├── auth.config.ts                # Auth config
├── middleware.ts                 # Route protection
├── routes.ts                     # Route definitions
└── package.json                  # Dependencies
```

## User Roles

The system supports 12 distinct user roles with varying permissions:

1. **ADMIN** - Full system access
2. **OWNER** - Owner-level access with reporting
3. **MANAGER** - Property management operations
4. **STAFF** - General staff operations
5. **TENANT** - Limited tenant portal access
6. **TREASURY** - Financial operations focus
7. **PURCHASER** - Procurement operations
8. **ACCTG** - Accounting operations
9. **VIEWER** - Read-only access
10. **STOCKROOM** - Inventory management
11. **MAINTENANCE** - Maintenance operations
12. **VIEWER** - Read-only monitoring

## Security Features

- JWT-based authentication with 8-hour sessions
- Password hashing with bcryptjs
- Role-based access control on all routes
- Middleware-level route protection
- Audit logging for all critical operations
- IP address and user agent tracking
- Secure file upload to isolated storage
- SQL injection protection via Prisma ORM
- CSRF protection via NextAuth

## Performance Optimizations

- React Server Components for reduced bundle size
- Suspense boundaries for granular loading states
- Prisma query optimization with select/include
- Database indexing on frequently queried fields
- Connection pooling for database connections
- Static asset optimization
- Turbopack for faster development builds
- Image optimization with Next.js Image component

## Contributing

This is a proprietary system for RDRDC. For internal development guidelines, please contact the development team.

## License

Proprietary - All rights reserved by RD Realty Development Corporation.

## Support

For technical support or questions, contact the IT department.

---

**Built with ❤️ for RDRDC Property Management**
