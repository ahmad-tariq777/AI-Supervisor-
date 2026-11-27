# AI Project Supervisor

An AI-powered platform that guides student teams from project idea discovery, through planning and execution, to progress monitoring and certification.

The platform is three applications in one repository:

| Folder | What it is | Stack | Default port |
| --- | --- | --- | --- |
| `backend/` | REST API (modular monolith) | Node.js, Express, MongoDB, Mongoose | 5000 |
| `ai-service/` | Internal AI service | Python, FastAPI, Ollama (Llama 3.2 3B) | 8000 |
| `frontend/` | Single-page app | React, Vite | 5173 |

Ollama runs on port 11434 and MongoDB on 27017.

## Prerequisites

- Node.js 22 or newer
- Python 3.11 or newer
- MongoDB Community Server running locally (or a MongoDB Atlas connection string)
- Ollama

## Start-up order

1. MongoDB
2. Ollama (with the model pulled)
3. AI service
4. Backend
5. Frontend

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Open the API health endpoints:

- http://localhost:5000/api/v1/health/live
- http://localhost:5000/api/v1/health/ready (reports the database connection)

Edit `.env` before the first run. `JWT_SECRET` and `JWT_REFRESH_SECRET` must be different, and `AI_SERVICE_KEY` must match the value used by the AI service.

Run the tests:

```bash
npm test
```

### Authentication (Sprint 1)

Endpoints under `/api/v1/auth`: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`.

- Registration always creates a Student account.
- Login returns a short-lived access token and a longer-lived refresh token. Lifetimes come from `ACCESS_TOKEN_TTL_MINUTES` and `REFRESH_TOKEN_TTL_DAYS`.
- Each refresh rotates the refresh token. Reusing an old refresh token ends all sessions of that account.
- Deactivated accounts cannot log in, refresh, or use an existing access token.

Create the first Super Admin once per installation. Set `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run seed:super-admin
```

The script does nothing if a Super Admin already exists. Remove the password from `.env` afterwards.

### Roles, profile and projects (Sprint 2)

All endpoints below need `Authorization: Bearer <accessToken>`.

| Endpoint | Roles | Purpose |
| --- | --- | --- |
| `GET /api/v1/users/me` | all human roles | View own profile |
| `PATCH /api/v1/users/me` | all human roles | Update `fullName`; students can also update `profile.skills` |
| `POST /api/v1/users/me/password` | all human roles | Change password with `currentPassword` and `newPassword`; returns 204 and ends all refresh sessions |
| `POST /api/v1/projects` | student | Create a project with `title`, `mode` (`individual` or `team`), optional `description` and `deadline` |
| `GET /api/v1/projects` | all human roles | List the projects the caller can access. Query: `page`, `limit` (max 100), `stage`, `mode` |
| `GET /api/v1/projects/:id` | all human roles | Open one project with the caller's access and the supervisor's name |

- `authorizeRole(...roles)` in `src/middleware/authorizeRole.js` guards a route by account role. It never treats the Super Admin as a wildcard.
- Skills are trimmed, de-duplicated without regard to case, and limited to 50 skills of 50 characters each.
- Project access: a student sees projects they created or belong to through a team, a supervisor sees projects assigned to them, and Sub Admins and Super Admins can inspect every project.
- `projectContext()` in `src/middleware/projectContext.js` loads the project, resolves the project-level role (Team Leader, Team Member, assigned supervisor, inspector) and sets `req.project` and `req.projectAccess`. Users outside a project get 404, so a project's existence is not revealed. Later routes can restrict by project role, for example `projectContext({ projectRoles: ['team_leader'], allowSupervisor: false })`.
- `src/modules/teams/team.model.js` holds the team record used to resolve project roles. Team routes and invitations arrive in Sprint 9.
- A new project starts in the Idea Discovery stage. The creator comes from the session, and `stage`, `methodology` and `supervisorId` cannot be set by the client.

Frontend pages added in Sprint 2: Profile (`/profile`, with the skills editor for students and password change), My projects (`/projects`), New project (`/projects/new`), Project overview (`/projects/:projectId`) and the Student dashboard (`/student`). The sidebar shows only the links the signed-in role may use. Changing the password signs the user out of every device, so the profile page sends the user back to the sign-in page afterwards.

## AI service

```bash
cd ai-service
python -m venv .venv
```

Activate the virtual environment:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Then install and run:

```bash
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Check http://localhost:8000/health. It returns `ok` only when Ollama is reachable and the configured model is installed.

Run the tests:

```bash
pytest
```

## Ollama (task S0-06)

1. Install Ollama from https://ollama.com/download
2. Pull the model:

```bash
ollama pull llama3.2:3b
```

3. Try a prompt in the terminal:

```bash
ollama run llama3.2:3b "Reply with one short sentence confirming you are ready."
```

4. Run the same check through the AI service code, from the `ai-service` folder:

```bash
python -m scripts.ollama_smoke_test
```

The default model needs about 2 GB of disk. About 16 GB of RAM is comfortable for the model, MongoDB and the three apps together; less works with slower responses.

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. You are sent to the sign-in page, or to your dashboard when already signed in. http://localhost:5173/status shows whether the backend and database are reachable.

## Environment files

Each app has its own `.env.example`. Copy it to `.env` and fill in the values. Never commit `.env` files.

| App | Variables |
| --- | --- |
| backend | `NODE_ENV`, `PORT`, `FRONTEND_ORIGIN`, `LOG_LEVEL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AI_SERVICE_URL`, `AI_SERVICE_KEY`, `GITHUB_TOKEN`, `CERT_BASE_URL` |
| ai-service | `ENVIRONMENT`, `LOG_LEVEL`, `AI_SERVICE_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `EMBEDDING_MODEL`, `VECTOR_STORE_PATH` |
| frontend | `VITE_API_BASE_URL` |

## Team workflow

- Branch rules and pull requests: [docs/branching.md](docs/branching.md)
- Task board and backlog: [docs/task-board.md](docs/task-board.md) and [docs/backlog.csv](docs/backlog.csv)
- Questions to confirm with the supervisor: [docs/open-decisions.md](docs/open-decisions.md)
