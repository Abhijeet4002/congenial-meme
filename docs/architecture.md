# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

✅ **Completed plan locked in. Priority order: data models → API routes → frontend components.**

- Presentation tier decision: React 19 components fetch from `/api/*` routes. Vite proxies to localhost:8000. Components render activity feeds and leaderboard tables with Bootstrap styling.
- Logic tier decision: Express routes handle validation (return 400/404 for invalid input, never 500 from cast errors). Services compute derived data (e.g., leaderboard rankings, suggestion reasons). Mongoose handles schema validation.
- Data tier decision: Mongoose models with strict validation. User requires name, email, fitnessGoal. Team requires name, mascot, members array. Activity requires type, user ref, team ref, minutes; computes points and occurredAt. Workout defines suggestion templates with focus, title, minutes, difficulty.
- Activity tracking approach: POST /api/activities validates both userId and teamId as valid ObjectIds, looks them up, rejects with 400 if invalid, computes points based on type (cardio=5pt/min, strength=4pt/min), stores occurredAt as now().
- Team management approach: POST /api/teams requires name, rejects with 400 if missing, accepts mascot and optional members array, returns 201 on creation.
- Leaderboard approach: GET /api/leaderboard queries all teams, sums their activities' points, sorts descending, adds 1-based rank, returns in { leaderboard: [...] } format.
- Workout suggestions approach: GET /api/workouts/suggestions/:userEmail finds user by email (404 if not found), analyzes recent activity types, recommends matching workout with focus and reason explaining the recommendation logic.

## Test plan

✅ **Baseline captured. All commands verified with MongoDB running on port 27017.**

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend`
  - **Red baseline**: 1/5 passed. Test failures:
    - `requires meaningful user identity and goals` — expects User validation errors for name, email, fitnessGoal (currently undefined)
    - `requires teams to have a name, mascot, and members array` — expects Team validation errors for name, mascot (currently undefined)
    - `requires activities to connect users, teams, types, minutes, points, and dates` — expects Activity validation errors for type, user, team, minutes (currently undefined)
    - `defines workout suggestions with focus, duration, and difficulty` — expects Workout validation errors for focus, minutes, difficulty (currently undefined)
    - `seeds representative data for all four capabilities idempotently` — ✅ PASSING
  - **Green goal**: 5/5 passed when models add required field validation (Mongoose schema)

- **API command**: `npm run test:api --prefix octofit-tracker/backend`
  - **Red baseline**: 0/4 passed. Test failures:
    - `creates and lists valid activities while rejecting invalid input` — routes return 501 (not implemented), expect 400 for invalid userId/teamId
    - `creates teams and exposes members` — routes return 501, expect 400 for missing name and 201 on creation
    - `orders leaderboard entries by total points` — GET /api/leaderboard returns empty array [], expect ranked teams by total points descending
    - `suggests workouts that match each user activity pattern` — suggestions missing reason field explaining the recommendation
  - **Green goal**: 4/4 passed when routes implement validation, services compute points/leaderboard/suggestions with reason

- **Frontend command**: `npm test --prefix octofit-tracker/frontend`
  - **Red baseline**: 0/15 passed. UI renders navigation and "Implementation pending" messages; can't find activity data because `/api/activities` returns 501
  - **Green goal**: 15/15 passed when components fetch and render activity feeds, leaderboard tables, team info

- **Backend build command**: `npm run build --prefix octofit-tracker/backend`
  - Verifies TypeScript compilation and no syntax errors

- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend`
  - Verifies Vite bundling and no missing dependencies
