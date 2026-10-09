# Express.js & Backend Development Best Practices

A comprehensive reference guide for backend architecture, REST API design, database modeling, authentication, security, and Express.js best practices for the **Pet Adoption & Rescue Management System**.

---

## 1. Project Architecture & Code Organization

### 1.1 Layered Controller-Service-Repository Pattern
To maintain scalability, testability, and clear separation of concerns, the backend strictly follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     HTTP Request                        │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Routing Layer                        │
│            (Express Router + Middleware)                │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Controller Layer                      │
│     (HTTP req parsing, validation, response formatting) │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
│   (Business rules, transactions, workflows, state)      │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Repository / Data Access Layer            │
│       (PostgreSQL queries, ORM/Query Builder, Supabase) │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Database Storage                      │
└─────────────────────────────────────────────────────────┘
```

- **Routes (`src/routes/`)**: Define HTTP verbs, endpoint paths, and attach authentication, authorization, and validation middlewares.
- **Controllers (`src/controllers/`)**: Handle HTTP requests, unpack parameters/body, call service methods, and return standard API responses. **No database queries or heavy business logic allowed in controllers.**
- **Services (`src/services/`)**: Implement core domain logic, status transition rules, transaction boundaries, and orchestration.
- **Repositories / Models (`src/models/` or `src/repositories/`)**: Abstract database interactions using parameterized SQL queries, query builders (e.g. Kysely, Knex, Drizzle), or Supabase client calls.
- **Middlewares (`src/middlewares/`)**: Reusable request processing hooks (Auth JWT verification, RBAC, input validation, error handling, rate limiting).

---

### 1.2 Recommended Folder Structure

```
backend/
├── src/
│   ├── config/             # App configuration, database pool, env vars
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── controllers/        # Request handlers per domain entity
│   │   ├── authController.ts
│   │   ├── petController.ts
│   │   ├── shelterController.ts
│   │   ├── applicationController.ts
│   │   ├── inquiryController.ts
│   │   └── adminController.ts
│   ├── services/           # Domain business logic & transactions
│   │   ├── authService.ts
│   │   ├── petService.ts
│   │   ├── shelterService.ts
│   │   ├── applicationService.ts
│   │   ├── inquiryService.ts
│   │   └── adminService.ts
│   ├── repositories/       # Database access layer / SQL queries
│   │   ├── petRepository.ts
│   │   ├── shelterRepository.ts
│   │   ├── applicationRepository.ts
│   │   └── userRepository.ts
│   ├── routes/             # Express router definitions
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── petRoutes.ts
│   │   ├── shelterRoutes.ts
│   │   ├── applicationRoutes.ts
│   │   ├── inquiryRoutes.ts
│   │   └── adminRoutes.ts
│   ├── middlewares/        # Custom Express middlewares
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── validators/         # Zod schemas for request payload validation
│   │   ├── authValidator.ts
│   │   ├── petValidator.ts
│   │   └── applicationValidator.ts
│   ├── types/              # TypeScript interfaces and type definitions
│   │   ├── express.d.ts
│   │   └── index.ts
│   ├── utils/              # Helper functions, logger, custom error classes
│   │   ├── AppError.ts
│   │   ├── asyncWrapper.ts
│   │   └── logger.ts
│   └── app.ts              # Express application setup
├── migrations/             # SQL database migration scripts
├── seeds/                  # Initial dev test data seeds
├── tests/                  # Integration & unit test suites
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 2. Database Schema & Data Modeling

### 2.1 Entity Relationship & Schema Design
The backend database (PostgreSQL / Supabase) must mirror the frontend TypeScript interfaces while maintaining relational integrity, foreign key constraints, and performance indexes.

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('adopter', 'shelter_staff', 'platform_admin');
CREATE TYPE species_type AS ENUM ('dog', 'cat', 'rabbit', 'bird', 'other');
CREATE TYPE age_group_type AS ENUM ('puppy-kitten', 'young', 'adult', 'senior');
CREATE TYPE pet_size_type AS ENUM ('small', 'medium', 'large');
CREATE TYPE gender_type AS ENUM ('male', 'female');
CREATE TYPE pet_status_type AS ENUM ('Available', 'In Process', 'Adopted', 'Fostered');
CREATE TYPE pet_visibility_type AS ENUM ('public', 'private');
CREATE TYPE application_status_type AS ENUM ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Adopted');
CREATE TYPE housing_type AS ENUM ('house', 'apartment', 'condo', 'other');

-- 1. Shelters Table
CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  operating_hours VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'adopter',
  shelter_id UUID REFERENCES shelters(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pets Table
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  species species_type NOT NULL,
  breed VARCHAR(255) NOT NULL,
  age_years NUMERIC(4, 1) NOT NULL CHECK (age_years >= 0),
  age_group age_group_type NOT NULL,
  size pet_size_type NOT NULL,
  gender gender_type NOT NULL,
  temperament TEXT[] NOT NULL DEFAULT '{}',
  shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  visibility pet_visibility_type NOT NULL DEFAULT 'public',
  description TEXT NOT NULL,
  medical_history TEXT[] NOT NULL DEFAULT '{}',
  behavioral_notes TEXT NOT NULL DEFAULT '',
  status pet_status_type NOT NULL DEFAULT 'Available',
  image_url TEXT NOT NULL,
  gallery TEXT[] NOT NULL DEFAULT '{}',
  vaccinated BOOLEAN NOT NULL DEFAULT false,
  spayed_neutered BOOLEAN NOT NULL DEFAULT false,
  good_with_kids BOOLEAN NOT NULL DEFAULT false,
  good_with_pets BOOLEAN NOT NULL DEFAULT false,
  date_added DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Adoption Applications Table
CREATE TABLE adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  housing_type housing_type NOT NULL,
  has_other_pets BOOLEAN NOT NULL DEFAULT false,
  experience TEXT NOT NULL,
  reason TEXT NOT NULL,
  status application_status_type NOT NULL DEFAULT 'Submitted',
  staff_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Application Status Audit History Table
CREATE TABLE application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES adoption_applications(id) ON DELETE CASCADE,
  status application_status_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Inquiries Table
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  from_name VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Favorites Watchlist Table
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, pet_id)
);
```

---

### 2.2 Performance Indexing Strategy
To support high-throughput browsing, search filtering, and role-based data partitioning, add targeted indexes:

```sql
-- Public catalog browsing filters (visibility + status + species/breed/age/size)
CREATE INDEX idx_pets_public_catalog ON pets (visibility, status, species) WHERE visibility = 'public';
CREATE INDEX idx_pets_shelter_id ON pets (shelter_id);

-- User applications lookup
CREATE INDEX idx_applications_applicant ON adoption_applications (applicant_id);
CREATE INDEX idx_applications_pet ON adoption_applications (pet_id);
CREATE INDEX idx_applications_status ON adoption_applications (status);

-- Shelter inquiries lookup
CREATE INDEX idx_inquiries_pet ON inquiries (pet_id);
```

---

## 3. RESTful API Endpoints & Contract Standards

### 3.1 Consistent API Response Format
All API responses must follow a predictable, standardized JSON envelope:

```typescript
// ✅ Success Response Envelope
interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ❌ Error Response Envelope
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
```

---

### 3.2 Endpoint Registry Specification

| Method | Endpoint Path | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| `POST` | `/api/v1/auth/signup` | Public | Register new adopter or shelter staff account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and issue JWT access token |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate session (consumes refresh token, reissues both cookies) |
| `POST` | `/api/v1/auth/logout` | Public | Revoke session refresh token and clear auth cookies |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch active user profile |
| **Public Pets Catalog** | | | |
| `GET` | `/api/v1/pets` | Public | List public pets with filtering & pagination |
| `GET` | `/api/v1/pets/:id` | Public | Get public pet detail by ID |
| **Shelters** | | | |
| `GET` | `/api/v1/shelters` | Public | List partner shelters |
| `GET` | `/api/v1/shelters/:id` | Public | Get shelter detail & active public listings count |
| `POST` | `/api/v1/shelters` | `platform_admin` | Register new shelter |
| `PATCH` | `/api/v1/shelters/:id` | `shelter_staff` / `admin` | Update shelter profile |
| **Shelter Inventory Management** | | | |
| `GET` | `/api/v1/shelter/listings` | `shelter_staff` | List all pets (public + private inventory) for staff's shelter |
| `POST` | `/api/v1/shelter/listings` | `shelter_staff` | Create new pet listing (public or private) |
| `PATCH` | `/api/v1/shelter/listings/:id` | `shelter_staff` | Update pet listing details / toggle visibility |
| `DELETE` | `/api/v1/shelter/listings/:id` | `shelter_staff` | Archive / remove pet record |
| **Adoption Applications** | | | |
| `POST` | `/api/v1/applications` | `adopter` | Submit adoption application for a pet |
| `GET` | `/api/v1/applications/my` | `adopter` | Get logged-in user's submitted applications |
| `GET` | `/api/v1/shelter/applications` | `shelter_staff` | List applications submitted to staff's shelter |
| `PATCH` | `/api/v1/shelter/applications/:id/status` | `shelter_staff` | Update status (`Approved`, `Rejected`, `Hold`) + staff note |
| **Inquiries** | | | |
| `POST` | `/api/v1/inquiries` | Public / `adopter` | Submit direct inquiry for a pet |
| `GET` | `/api/v1/shelter/inquiries` | `shelter_staff` | Fetch inquiries inbox for staff's shelter |
| `PATCH` | `/api/v1/shelter/inquiries/:id/resolve` | `shelter_staff` | Mark inquiry as resolved |
| **Platform Admin Governance** | | | |
| `GET` | `/api/v1/admin/stats` | `platform_admin` | System-wide overview dashboard KPI stats |
| `GET` | `/api/v1/admin/users` | `platform_admin` | List all platform registered users |
| `PATCH` | `/api/v1/admin/users/:id/role` | `platform_admin` | Reassign user role (`adopter`, `shelter_staff`, `platform_admin`) |

---

## 4. Authentication & Role-Based Access Control (RBAC)

### 4.1 JWT Authentication Middleware
Sessions use short-lived access JWTs (default 15m) in the `paws_at` **httpOnly** cookie plus
opaque refresh tokens (default 30d, SHA-256 hashed in `refresh_tokens`) in the `paws_rt`
httpOnly cookie, rotated on every `POST /auth/refresh`. `authenticate` reads the cookie first
and still accepts an `Authorization: Bearer <token>` header as a fallback for API clients.

```typescript
// src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  email: string;
  role: 'adopter' | 'shelter_staff' | 'platform_admin';
  shelterId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing token.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};
```

---

### 4.2 Authorization Middleware (RBAC)
Enforce access restrictions based on user roles defined in `SYSTEM_REQUIREMENTS.md`.

```typescript
// src/middlewares/authorize.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { UserRole } from '../types';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Forbidden. You do not have permission to perform this action.', 403));
    }

    next();
  };
};
```

---

### 4.3 Shelter Tenant Isolation Guard
Ensure shelter staff members can **ONLY** view or mutate resources (pets, applications, inquiries) belonging to their assigned shelter.

```typescript
// src/middlewares/verifyShelterOwnership.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const verifyShelterOwnership = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Unauthorized', 401));
  }

  // Platform admins override tenant bounds
  if (req.user.role === 'platform_admin') {
    return next();
  }

  const targetShelterId = req.params.shelterId || req.body.shelterId || req.query.shelterId;

  if (req.user.role === 'shelter_staff' && req.user.shelterId !== targetShelterId) {
    return next(new AppError('Forbidden. Access restricted to assigned shelter data.', 403));
  }

  next();
};
```

---

## 5. Input Validation, Sanitization & Security

### 5.1 Request Payload Validation with Zod
Never trust client input. Validate request body, params, and query strings using declarative Zod schemas before passing control to business services.

```typescript
// src/validators/petValidator.ts
import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(100),
  species: z.enum(['dog', 'cat', 'rabbit', 'bird', 'other']),
  breed: z.string().min(1, 'Breed is required'),
  ageYears: z.number().min(0, 'Age must be non-negative'),
  ageGroup: z.enum(['puppy-kitten', 'young', 'adult', 'senior']),
  size: z.enum(['small', 'medium', 'large']),
  gender: z.enum(['male', 'female']),
  temperament: z.array(z.string()).default([]),
  shelterId: z.string().uuid('Invalid shelter ID format'),
  visibility: z.enum(['public', 'private']).default('public'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  medicalHistory: z.array(z.string()).default([]),
  behavioralNotes: z.string().optional().default(''),
  status: z.enum(['Available', 'In Process', 'Adopted', 'Fostered']).default('Available'),
  imageUrl: z.string().url('Invalid image URL format'),
  gallery: z.array(z.string().url()).default([]),
  vaccinated: z.boolean().default(false),
  spayedNeutered: z.boolean().default(false),
  goodWithKids: z.boolean().default(false),
  goodWithPets: z.boolean().default(false),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
```

```typescript
// src/middlewares/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request input parameters.',
            details,
          },
        });
      }
      next(error);
    }
  };
};
```

---

### 5.2 Security Hardening Checklist
- **Helmet.js**: Attach security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- **CORS Configuration**: Restrict origin strictly to trusted domain (`http://localhost:5173` in dev, production domain in prod).
- **Rate Limiting**: Prevent brute force login attempts and API abuse.
- **SQL Injection Prevention**: Use parameterized queries (`$1, $2`) or ORM abstractions. **Never concatenate raw query strings with user input.**

```typescript
// Security configuration in src/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:5173',
    credentials: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please try again later.',
    },
  },
});

app.use('/api/', apiLimiter);
```

---

## 6. Error Handling & Exception Management

### 6.1 Custom AppError Hierarchy
Distinguish between expected operational errors (e.g. invalid inputs, resource not found, unauthorized) and unexpected programmer bugs (e.g. syntax errors, unhandled rejections).

```typescript
// src/utils/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
```

---

### 6.2 Global Error Handler Middleware
Catch all uncaught operational errors and system exceptions in one centralized middleware.

```typescript
// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error occurred.';
  let code = 'INTERNAL_SERVER_ERROR';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = statusCode === 404 ? 'NOT_FOUND' : statusCode === 403 ? 'FORBIDDEN' : 'BAD_REQUEST';
  } else {
    logger.error('Unexpected System Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

---

## 7. Business Logic & Transaction Management

### 7.1 Application Status Workflow & Atomic DB Transactions
When a shelter staff member updates an adoption application status to `Approved` or `Adopted`, three operations **MUST** complete atomically:
1. The application status and audit history table are updated.
2. The pet status is automatically set to `In Process` or `Adopted`.
3. Every other open application for the same pet is auto-rejected with its own audit history entry (one accepted adopter per pet).

If either step fails, the entire transaction must be rolled back (`ROLLBACK`).

```typescript
// src/services/applicationService.ts
import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import { ApplicationStatus } from '../types';

export const updateApplicationStatus = async (
  applicationId: string,
  staffShelterId: string,
  newStatus: ApplicationStatus,
  note?: string
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch application & verify shelter ownership
    const appRes = await client.query(
      `SELECT a.*, p.shelter_id 
       FROM adoption_applications a
       JOIN pets p ON a.pet_id = p.id
       WHERE a.id = $1`,
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError('Application not found', 404);
    }

    const appRecord = appRes.rows[0];

    if (appRecord.shelter_id !== staffShelterId) {
      throw new AppError('Forbidden. Application belongs to another shelter.', 403);
    }

    // 2. Update application status
    await client.query(
      `UPDATE adoption_applications 
       SET status = $1, staff_notes = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [newStatus, note || null, applicationId]
    );

    // 3. Append to application_history audit log
    await client.query(
      `INSERT INTO application_history (application_id, status, note) 
       VALUES ($1, $2, $3)`,
      [applicationId, newStatus, note || null]
    );

    // 4. Update pet status accordingly + auto-reject competing applications
    if (newStatus === 'Approved') {
      await client.query(
        `UPDATE pets SET status = 'In Process', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [appRecord.pet_id]
      );
    } else if (newStatus === 'Adopted') {
      await client.query(
        `UPDATE pets SET status = 'Adopted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [appRecord.pet_id]
      );
    }

    await client.query('COMMIT');

    return { applicationId, newStatus };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## 8. File Uploads & Media Storage Strategy

### 8.1 Image Upload Pipeline
- **Local Development**: Use `multer` to write images to `public/uploads/` directory served as static assets.
- **Production (Supabase / S3)**: Stream file buffers directly to Supabase Storage Buckets (`pets-gallery`, `shelter-logos`, `avatars`).

```typescript
// src/middlewares/upload.ts
import multer from 'multer';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP) are allowed.', 400));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});
```

---

## 9. Configuration & Structured Logging

### 9.1 Environment Variable Validation
Validate environment variables on server boot to fail fast if required secrets are missing.

```typescript
// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

---

## 10. Production Deployment & Supabase Migration Checklist

### 10.1 Express.js to Supabase Cloud Transition Plan
When migrating from local Node/Express + PostgreSQL to Supabase Cloud:
1. **Schema Migration**: Execute SQL DDL scripts (`migrations/`) in Supabase SQL Editor to initialize tables, indexes, and custom enums.
2. **Row-Level Security (RLS)**: Enable RLS on all tables and attach security policies mirroring Express RBAC:
   - `pets`: Public `SELECT` allowed where `visibility = 'public'`. Shelter staff `ALL` allowed for pets matching `shelter_id = auth.jwt() ->> 'shelter_id'`.
   - `adoption_applications`: Adopter `SELECT`/`INSERT` allowed for `applicant_id = auth.uid()`. Shelter staff `SELECT`/`UPDATE` allowed for their shelter's pets.
3. **Environment Configuration**: Swap database credentials in `.env` to point to Supabase Managed PostgreSQL pool connection string (`postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`).

---

## 11. Backend Developer Quality Checklist

- [ ] All endpoint handlers use `asyncWrapper` or native Express 5 async error handling.
- [ ] Every incoming route payload is validated via Zod schema before hitting the database.
- [ ] Role-Based Access Control (`authorize`) is enforced on all protected routes.
- [ ] Multi-table mutations (e.g., application approval + pet status update) execute inside a database transaction (`BEGIN ... COMMIT / ROLLBACK`).
- [ ] Sensitive user data (passwords) is hashed using bcrypt/argon2 with salt rounds >= 10.
- [ ] Sensitive credentials/secrets are NEVER committed to version control (`.env` in `.gitignore`).
