# GeoSample Explorer – GitHub Issues Backlog

A prioritized backlog for agile development. Each item can be created as a GitHub Issue.

---

## Epic 1: Backend API & Data Model

### Issue #1: Set up ASP.NET Core Web API project
**Priority:** High

**Description:**  
Create a new ASP.NET Core 8 Web API project with basic configuration (CORS, JSON serialization, Swagger).

**Acceptance criteria:**
- [ ] Project targets .NET 8
- [ ] Swagger UI available at `/swagger`
- [ ] CORS configured for local frontend origin
- [ ] API returns JSON with camelCase property names

---

### Issue #2: Define Observation entity and DbContext
**Priority:** High

**Description:**  
Create the Observation entity model and EF Core DbContext with SQLite.

**Acceptance criteria:**
- [ ] Entity has Id, Name, Type, Region, Latitude, Longitude, Description, ObservedAt
- [ ] Field lengths and constraints defined (e.g. Name max 120)
- [ ] DbContext configured for SQLite
- [ ] Connection string in appsettings.json

---

### Issue #3: Add initial migration and seed data
**Priority:** High

**Description:**  
Create EF Core migration and seed 10–15 sample observations for development.

**Acceptance criteria:**
- [ ] Migration creates Observations table
- [ ] Seed data includes variety of types (Soil, Water, Rock, Mineral) and regions
- [ ] Database created/updated on app startup
- [ ] Seed runs only when table is empty

---

### Issue #4: Implement GET /api/observations endpoint
**Priority:** High

**Description:**  
Add endpoint to list all observations with optional query filters.

**Acceptance criteria:**
- [ ] Returns 200 with JSON array of observations
- [ ] Supports `?search=`, `?type=`, `?region=` query parameters
- [ ] Uses DTO for response (no entity exposure)
- [ ] Results ordered by name

---

### Issue #5: Implement GET /api/observations/{id} endpoint
**Priority:** High

**Description:**  
Add endpoint to fetch a single observation by ID.

**Acceptance criteria:**
- [ ] Returns 200 with observation JSON when found
- [ ] Returns 404 when ID does not exist
- [ ] Uses DTO for response

---

### Issue #6: Add GeoJSON endpoint
**Priority:** Medium

**Description:**  
Add GET /api/observations/geojson returning RFC 7946 FeatureCollection.

**Acceptance criteria:**
- [ ] Returns FeatureCollection with Point features
- [ ] Coordinates in [longitude, latitude] order
- [ ] Properties include id, name, type, region, observedAt
- [ ] Supports same filters as GET /api/observations

---

## Epic 2: Frontend Map & List UI

### Issue #7: Set up React + Vite + TypeScript project
**Priority:** High

**Description:**  
Create frontend project with React 18, Vite, and TypeScript.

**Acceptance criteria:**
- [ ] Vite dev server runs on port 5173
- [ ] TypeScript strict mode enabled
- [ ] Proxy configured for /api → backend
- [ ] Leaflet CSS included in index.html

---

### Issue #8: Create Observation type and API service
**Priority:** High

**Description:**  
Define TypeScript interfaces and fetch functions for observations API.

**Acceptance criteria:**
- [ ] Observation interface matches API response
- [ ] ObservationFormData interface for create/update
- [ ] fetchObservations() with optional filter params
- [ ] API base URL from environment variable

---

### Issue #9: Implement MapView with Leaflet
**Priority:** High

**Description:**  
Display observations as markers on an interactive map.

**Acceptance criteria:**
- [ ] Map renders with OpenStreetMap tiles
- [ ] One marker per observation at correct coordinates
- [ ] Marker click opens popup with name, type, region
- [ ] Map fills available space in layout

---

### Issue #10: Implement ObservationList component
**Priority:** High

**Description:**  
Display observations in a scrollable sidebar list.

**Acceptance criteria:**
- [ ] List shows name, type, region per item
- [ ] Clicking item selects it (visual highlight)
- [ ] Empty state when no observations
- [ ] List scrolls when content overflows

---

### Issue #11: Create AppLayout (header, left panel, map panel)
**Priority:** High

**Description:**  
Define main layout structure for the application.

**Acceptance criteria:**
- [ ] Header with app title
- [ ] Left panel (fixed width) for filters and list
- [ ] Right panel (flex) for map
- [ ] Responsive to viewport size

---

## Epic 3: Filtering & Selection UX

### Issue #12: Add FiltersPanel with search and dropdowns
**Priority:** High

**Description:**  
Implement filter controls for name, type, and region.

**Acceptance criteria:**
- [ ] Search input filters by name (debounced 300–500 ms)
- [ ] Type dropdown populated from current data
- [ ] Region dropdown populated from current data
- [ ] Reset filters button clears all filters

---

### Issue #13: Wire filters to backend API
**Priority:** High

**Description:**  
Ensure filter changes trigger API requests with query parameters.

**Acceptance criteria:**
- [ ] Filtering performed server-side (not client-side only)
- [ ] List and map update when filters change
- [ ] Loading state shown during fetch
- [ ] Error message displayed on API failure

---

### Issue #14: Implement selection (list + map)
**Priority:** High

**Description:**  
Allow users to select an observation from list or map; show details.

**Acceptance criteria:**
- [ ] Clicking list item selects observation and highlights it
- [ ] Clicking marker selects observation
- [ ] Map centers on selected observation
- [ ] Selection cleared when filtered out

---

### Issue #15: Add ObservationDetailCard
**Priority:** High

**Description:**  
Display selected observation details in a card below the map.

**Acceptance criteria:**
- [ ] Shows Name, Type, Region, Coordinates, ObservedAt, Description
- [ ] Placeholder when nothing selected
- [ ] Close button clears selection
- [ ] Edit and Delete buttons (see Epic 4)

---

### Issue #16: Sync filter state to URL
**Priority:** Low

**Description:**  
Persist filter values in URL query string for sharing.

**Acceptance criteria:**
- [ ] URL updates when filters change (replaceState)
- [ ] Filters restored from URL on page load
- [ ] Shareable links preserve filter state

---

## Epic 4: CRUD & Validation

### Issue #17: Implement POST /api/observations
**Priority:** High

**Description:**  
Add endpoint to create new observations.

**Acceptance criteria:**
- [ ] Accepts JSON body with required fields
- [ ] Returns 201 with Location header and created resource
- [ ] Returns 400 with validation errors for invalid payload
- [ ] Uses CreateObservationDto with DataAnnotations

---

### Issue #18: Implement PUT and DELETE endpoints
**Priority:** High

**Description:**  
Add update and delete endpoints for observations.

**Acceptance criteria:**
- [ ] PUT returns 200 with updated resource, 404 if not found
- [ ] DELETE returns 204, 404 if not found
- [ ] Validation on PUT matches create
- [ ] Proper HTTP status codes for all cases

---

### Issue #19: Create ObservationForm (create + edit)
**Priority:** High

**Description:**  
Reusable form component for adding and editing observations.

**Acceptance criteria:**
- [ ] Same form used for create and edit modes
- [ ] All fields: Name, Type, Region, Lat, Lon, ObservedAt, Description
- [ ] Frontend validation (required fields, lat/lon ranges)
- [ ] Loading state and double-submit prevention

---

### Issue #20: Display backend validation errors
**Priority:** Medium

**Description:**  
Show API validation errors to the user in the form.

**Acceptance criteria:**
- [ ] Field-level errors shown below inputs
- [ ] General error message above form
- [ ] ApiError class parses ASP.NET validation response
- [ ] Errors cleared when form is resubmitted or cancelled

---

### Issue #21: Add delete confirmation
**Priority:** Medium

**Description:**  
Confirm before deleting an observation.

**Acceptance criteria:**
- [ ] User prompted before delete (e.g. confirm dialog)
- [ ] Delete only proceeds on confirmation
- [ ] List and map refresh after successful delete
- [ ] Selection cleared if deleted item was selected

---

## Epic 5: Testing & Documentation

### Issue #22: Add backend integration tests
**Priority:** High

**Description:**  
Set up xUnit tests using WebApplicationFactory.

**Acceptance criteria:**
- [ ] GET /api/observations returns 200
- [ ] Filtering by type works
- [ ] GET /api/observations/{id} returns 404 for unknown id
- [ ] POST with invalid payload returns 400
- [ ] POST with valid payload returns 201
- [ ] In-memory database for test isolation

---

### Issue #23: Add GitHub Actions workflows
**Priority:** Medium

**Description:**  
CI workflows for frontend build and backend build/test.

**Acceptance criteria:**
- [ ] Frontend workflow builds on push/PR when frontend/ changes
- [ ] Backend workflow builds and runs tests
- [ ] Workflows run on main and develop branches
- [ ] Clear job names and steps

---

### Issue #24: Write README with run instructions
**Priority:** High

**Description:**  
Document project setup, architecture, and usage.

**Acceptance criteria:**
- [ ] Prerequisites listed (Node, .NET)
- [ ] Backend and frontend run commands
- [ ] API endpoints summarized
- [ ] Environment variables documented
- [ ] Architecture diagram or description

---

### Issue #25: Add API documentation (Swagger)
**Priority:** Low

**Description:**  
Ensure Swagger documents all endpoints clearly.

**Acceptance criteria:**
- [ ] All endpoints have summary/description
- [ ] Response types and status codes documented
- [ ] Swagger UI accessible in development
- [ ] GeoJSON endpoint documented

---

## Epic 6: Deployment Readiness

### Issue #26: Make API URL configurable
**Priority:** High

**Description:**  
Frontend must use environment variable for backend URL.

**Acceptance criteria:**
- [ ] VITE_API_BASE_URL used for API calls
- [ ] Empty = relative URLs (proxy)
- [ ] .env.example documents the variable
- [ ] Production build uses configured URL

---

### Issue #27: Make CORS configurable per environment
**Priority:** High

**Description:**  
Backend CORS origins from configuration, not hardcoded.

**Acceptance criteria:**
- [ ] Cors:AllowedOrigins in appsettings
- [ ] Development allows localhost:5173
- [ ] Production has empty default (override in Azure)
- [ ] Program.cs reads from configuration

---

### Issue #28: Add production appsettings structure
**Priority:** Medium

**Description:**  
Environment-specific configuration without secrets in repo.

**Acceptance criteria:**
- [ ] appsettings.Production.json with sensible defaults
- [ ] Connection string override via Azure App Settings
- [ ] No secrets committed
- [ ] Example/template for production config

---

### Issue #29: Document Azure deployment
**Priority:** Medium

**Description:**  
Add deployment instructions for Azure Static Web Apps and App Service.

**Acceptance criteria:**
- [ ] Frontend: Static Web Apps setup and build config
- [ ] Backend: App Service publish and Application Settings
- [ ] CORS and connection string configuration steps
- [ ] Notes on SQLite vs Azure SQL for production

---

### Issue #30: Add deployment workflow drafts
**Priority:** Low

**Description:**  
GitHub Actions workflows that build frontend and backend (deploy optional).

**Acceptance criteria:**
- [ ] Frontend build workflow produces dist artifact
- [ ] Backend build/test workflow runs on backend changes
- [ ] Path filters so only relevant changes trigger
- [ ] Ready to extend with deploy steps

---

## Summary

| Epic | Issues | High | Medium | Low |
|------|--------|------|--------|-----|
| 1. Backend API & Data Model | 6 | 5 | 1 | 0 |
| 2. Frontend Map & List UI | 5 | 5 | 0 | 0 |
| 3. Filtering & Selection UX | 5 | 4 | 0 | 1 |
| 4. CRUD & Validation | 5 | 3 | 2 | 0 |
| 5. Testing & Documentation | 4 | 2 | 1 | 1 |
| 6. Deployment Readiness | 5 | 2 | 2 | 1 |
| **Total** | **30** | **21** | **6** | **3** |

---

*Use this backlog to create GitHub Issues. Consider using labels: `epic-1`, `epic-2`, etc., and `priority: high/medium/low`.*
