# ShaadiMantra Development Setup Guide

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Git**
- **VS Code** (recommended)

## Environment Configuration

### 1. Unified Environment File

Create a single `.env` file at the project root. Example:

```
# --- General ---
NODE_ENV=development
PORT=4500

# --- Data Source ---
DATA_SOURCE=mongodb         # Options: mongodb, static
USE_MONGODB=true           # true for MongoDB, false for static/mock

# --- MongoDB ---
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra_dev?retryWrites=true&w=majority
MONGODB_PRODUCTION_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra?retryWrites=true&w=majority
MONGODB_TEST_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shaadimantra_test?retryWrites=true&w=majority
DATABASE_NAME=shaadimantra_dev

# --- JWT ---
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# --- Email ---
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@shaadimantra.com
ENABLE_EMAIL=false

# --- API Base URL for Frontend ---
# Set this for the frontend to point to the correct backend port
# For static:   NEXT_PUBLIC_API_BASE_URL=http://localhost:3500
# For dev:      NEXT_PUBLIC_API_BASE_URL=http://localhost:4500
# For prod:     NEXT_PUBLIC_API_BASE_URL=http://localhost:5500
NEXT_PUBLIC_API_BASE_URL=http://localhost:4500
```

### 2. Install Dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 3. Running the Application

#### **Static Backend (port 3500):**
```bash
npm run static:backend
npm run static:frontend
```

#### **Dev Backend (port 4500):**
```bash
npm run dev:backend
npm run dev:frontend
```

#### **Prod Backend (port 5500):**
```bash
npm run prod:backend
npm run prod:frontend
```

#### **Run Both (static/dev/prod):**
```bash
npm run static:all
npm run dev:all
npm run prod:all
```

### 4. Linting & Code Cleanup

Run the linter and auto-fix issues:
```bash
cd frontend
npm run lint
npm run lint:fix # (if available)
```
- Remove unused variables, fix hook dependencies, and escape JSX characters as flagged by the linter.

### 5. Directory Structure

See `DIRECTORY_STRUCTURE.md` for a full overview of the cleaned and unified project layout.

### 6. Troubleshooting
- If you see port conflicts, kill the process using the port (`lsof -ti:PORT` and `kill -9 PID`).
- If you see linter errors, follow the linter output to fix unused variables, dependencies, or JSX issues.
- For environment switching, just update `.env` and restart the relevant npm script.

---

Your ShaadiMantra development environment is now ready for static, dev, or prod workflows with a single unified setup!
