# Shaadi Mantra - Clean Directory Structure

```
Shaadi_Mantra/
├── backend/                # Backend API server (Node.js, Express, MongoDB)
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # API controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic/services
│   │   └── utils/         # Utility functions
│   ├── scripts/           # Backend scripts
│   ├── package.json       # Backend dependencies/scripts
│   └── start.js           # Backend entry point
├── frontend/               # Next.js frontend (React)
│   ├── src/
│   │   ├── app/           # Next.js app directory (pages, layouts, routes)
│   │   ├── components/    # React components
│   │   ├── services/      # API and business logic for frontend
│   │   └── utils/         # Frontend utilities
│   ├── public/            # Static assets (images, icons, etc.)
│   ├── package.json       # Frontend dependencies/scripts
│   └── next.config.js     # Next.js config
├── scripts/                # Project-level scripts (build, deploy, etc.)
├── postman/                # Postman API collections
├── docs/                   # Documentation (API, architecture, etc.)
├── .env                    # Unified environment config (static/dev/prod)
├── package.json            # Root scripts (run both frontend/backend, lint, etc.)
├── API_TESTING_GUIDE.md    # API testing instructions
├── DEV_SETUP.md            # Development setup guide
├── DIRECTORY_STRUCTURE.md  # This file
├── README.md               # Project overview
└── ... (other docs)
```

## Key Points
- **No shared/ directory**: All code is now clearly separated into backend and frontend.
- **No empty or duplicate folders**: All stale, empty, or legacy files/folders have been removed.
- **Unified .env at root**: All environment variables for static, dev, and prod are managed in a single file.
- **Scripts**: Use `npm run static:all`, `npm run dev:all`, or `npm run prod:all` to run both frontend and backend for each environment.
- **Linting**: Run `npm run lint` in `frontend/` for code quality. Fix issues as flagged by the linter.
- **Docs**: All documentation is in the `docs/` folder or as top-level markdown files.

## Next Steps
- See `DEV_SETUP.md` for setup and workflow instructions.
- See `API_TESTING_GUIDE.md` for API testing and Postman usage.
- Use the unified scripts and .env for all environments.
