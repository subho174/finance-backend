# Finance Data Processing & Access Control Backend

An enterprise-ready finance dashboard backend built for security, scalability, and detailed financial insights. This project demonstrates advanced API design, role-based access control (RBAC), and efficient data aggregation.

## Quick Start

To get the application running locally in less than 2 minutes:

1.  **Clone & Install**
    ```bash
    pnpm install
    ```
2.  **Environment Setup**
    Create a `.env` file in the root directory (refer to [.env.example](.env.example) or use the following):
    ```env
    PORT=8000
    DATABASE_URL=postgresql://neondb_owner:[EMAIL_ADDRESS]/neondb?sslmode=require&channel_binding=require
    TOKEN_SECRET=your_jwt_secret
    TOKEN_EXPIRY=7d
    BASE_URL=http://localhost:8000
    ADMIN_EMAIL=admin@gmail.com
    ADMIN_PASSWORD=Admin@123
    ```
3.  **Database Initialisation**
    ```bash
    pnpm db:generate    # Generates the schema
    pnpm db:migrate    # Migrates the schema to the database
    pnpm db:seed    # Creates the initial Admin user
    ```
4.  **Run Development Server**
    ```bash
    pnpm dev
    ```

---

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Framework**: Express 5.x (Modern Async handling)
- **ORM**: Drizzle ORM (Type-safe & Lightweight)
- **Database**: PostgreSQL (Neon Database)
- **Validation**: Zod (Schema-first validation)
- **Security**: JWT (Cookies), Bcrypt (Hashing)
- **Documentation**: Swagger / OpenAPI 3.1.0

---

## Access Control Logic (RBAC)

The system enforces three distinct roles to ensure data privacy and administrative control:

| Role        | Permissions                                                                                  |
| :---------- | :------------------------------------------------------------------------------------------- |
| **Viewer**  | Personal data access only. Can see their own transactions and dashboard. Cannot create/edit. |
| **Analyst** | Global read-only access. Can see all user's transactions and aggregate summaries.            |
| **Admin**   | Full Management access. Can CRUD any transaction and manage User roles/status.               |

> [!TIP]
> **Row-Level Security**: Even for shared endpoints like `GET /transactions`, the backend automatically filters results based on the logged-in user's role to prevent data leakage.

---

## Controller Logic & Architecture

### 1. Authentication (`auth.controller.ts`)

- **JWT via Cookies**: Uses `httpOnly` secure cookies to mitigate XSS attacks.
- **Security Protocols**: Implements password hashing with `bcrypt` (10 rounds) and strict input validation.
- **Session Management**: Supports safe Logout by clearing client-side cookies.

### 2. User Management (`user.controller.ts`)

- **Admin Supremacy**: Only Admins can modify other users.
- **Safety Checks**: Prevents an Admin from deactivating their own account or demoting themselves, ensuring the system remains manageable.
- **Direct User Creation**: Admins can bypass public signup to create users with specific roles (Analyst/Viewer) for team onboarding.

### 3. Financial Records (`transaction.controller.ts`)

- **Soft Deletion**: Implements `deletedAt` timestamps. Data is never permanently erased, allowing for audit trails and recovery.
- **Complex Filtering**: Supports multi-parameter filtering (Date range, Category, Type) directly at the database level for performance.

### 4. Dashboard Summary (`summary.controller.ts`)

- **Optimized Aggregations**: Uses advanced Drizzle `sql` queries to perform calculations (`sum`, `groupBy`, `ROLLUP`) directly in PostgreSQL.
- **Categorisation**: Automatically groups totals by category (Salary, Rent, Food, etc.) and calculates Net Balance in real-time.
- **Time-Series Analysis**: provides monthly trend data, ideal for frontend charting libraries.

---

## API Documentation

The project includes an interactive **Swagger UI**. Once the server is running, navigate to:

**[http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)**

From here, you can:

- Explore all endpoints and their required schemas.
- Use the "Try it out" feature to test requests directly.
- View detailed failure responses (401, 403, 404) for robust error handling testing.

---

## Design Philosophy

- **Validation-First**: No request reaches the controller logic without passing through a Zod schema validation middleware.
- **Centralised Error Handling**: A unified `ApiError` utility ensures that every failure returns a consistent JSON structure and appropriate HTTP status code.
- **DRY Architecture**: Reusable middleware for authentication and role authorization (`authorizeRoles`).
- **Comprehensive Documentation**: Every controller and utility is documented using JSDoc for maximum maintainability.

---

## Security & Rate Limiting

To protect against DDoS attacks, brute-force attempts, and API abuse, the system implements tiered rate limiting:

- **General API Limiter**: Limits all generic `/api/v1` requests to **100 requests per 15 minutes** per IP.
- **Auth Limiter**: Implements a stricter policy for `/auth` routes (Login/Signup), limiting attempts to **15 per 15 minutes** to prevent account brute-forcing.
