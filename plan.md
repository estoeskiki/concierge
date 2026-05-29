# Kiki Implementation Plan

This document outlines the phased development plan for Kiki (formerly Kikiosk), incorporating the "cheapest path first" philosophy. Based on feedback, the focus is heavily weighted towards building an exceptional, highly-forgiving search directory first, with complex interactive wayfinding deferred to the end.

## Key Architecture Decisions

> [!NOTE]
> - **Language:** The kiosk will operate entirely in **Spanish**.
> - **Input Hardware:** The kiosk will run on Android touchscreens. We will rely on the native Android OS soft keyboard triggered automatically on input focus, eliminating the need for a custom React on-screen keyboard.
> - **Admin Roles (RBAC):** The system features Role-Based Access Control. Mall Admins can edit all stores within their mall, while Store Managers are restricted to editing only their specific assigned store.
> - **Aesthetics:** The UI will follow the `DESIGN.md` specification but adapted for **Light Mode** (Space Grotesk & Syne fonts, Lime Green `#ccff00` primary, Hot Pink `#ff6b98` secondary).
> - **Kiosk Identity & Auth:** There is one web app deployment shared across all malls and kiosks. Each physical kiosk device authenticates via a dedicated Supabase Auth service account (email + password). The JWT carries `app_metadata: { mall_id, kiosk_id }` which automatically scopes all RLS-protected queries to the correct mall — no env vars needed. Setup is a one-time manual login on the device via a hidden setup screen (e.g. tap logo 5×); Supabase persists the session to `localStorage` and auto-refreshes it on every subsequent boot. Provisioning a new kiosk = create an auth user via admin script + insert a row in the `kiosks` table.
> - **Kiosk Physical Location:** Each kiosk row in the `kiosks` table stores `x`, `y`, `floor` coordinates on the mall floor plan (origin = main entrance, units = meters). Stores and bathrooms also carry `x`, `y`, `floor`. Client-side Euclidean distance is computed on boot after fetching the kiosk's own coordinates, giving per-kiosk distance ordering for bathrooms and stores. Multi-floor routing (Phase 6) builds on this same coordinate foundation.

---

## Phase 1: Foundation & Data Architecture [DONE]

Establish the baseline infrastructure, database schema, and frontend scaffolding.

### Supabase Backend Setup
- Configure Multi-tenant Schema (`malls`, `stores`, `categories`, `brands`, `tags`).
- Enable `pgvector` extension for semantic search embeddings.
- Set up Row Level Security (RLS) policies.

### Kiosk Frontend Scaffolding
- Initialize Vite + React (TypeScript) project.
- Implement the Design System (CSS variables, Light Mode, Space Grotesk/Syne fonts, Lime/Pink palette).
- Setup React Router for client-side SPA navigation (`/`, `/results`, `/chat`, `/store/:id`).

---

## Phase 2: Core Directory & The Search Cascade [DONE]

Build the primary user interfaces and implement the free, instant, client-side search logic.

### User Interface Screens
- **HomeScreen:** Category grid, Mall Header, Search Bar.
- **ResultsScreen:** 2-column grid of store cards.
- **StoreDetailScreen:** Base layout (static map placeholder, brand chips, category tags).

### Search Engine Integration (MiniSearch)
- Implement Step 1: Exact Brand Match (Fast array filtering).
- Implement Step 2: Integrate `MiniSearch` for instant full-text tokenization and fuzzy matching (handles typos naturally).
- Build the "Search Orchestrator" hook that routes to results if found, or escalates to AI if not.

---

## Phase 3: AI & Semantic Search (The "Type Whatever" Layer) [TODO]

Implement the intelligent fallback layer to handle natural language queries using `pgvector` and Gemini. This is the core "magic" of Kiki.

### 👩‍💻 User Responsibilities (Supabase Dashboard & CLI)
To make this feature work, you must execute the following outside of the codebase:
1. **Initialize & Link:** Run `npx supabase init` and `npx supabase link --project-ref <your-id>` to connect the local code to your cloud database.
2. **Push the Schema:** Run `npx supabase db push` to create the `vector` extension and the RPC functions in your cloud database.
3. **Set Secrets:** Run `npx supabase secrets set GEMINI_API_KEY=your_key_here`. The Edge Function needs this to call the Google APIs.
4. **Deploy Function:** Run `npx supabase functions deploy chat` to push the AI logic to the cloud.

### 🤖 AI Responsibilities (Code Implementation)
I am responsible for writing the following exact architecture:
1. **The Vector SQL (`002_vector_search.sql`):** Write the Postgres RPC function `match_stores` that calculates the cosine distance (`<=>`) between the user's query embedding and the stores' embeddings.
2. **The Embedding Step:** Update the Edge Function to intercept the user query and call the `text-embedding-004` API to convert their text into an array of 768 floating-point numbers.
3. **The RAG Pipeline:** Execute the `match_stores` RPC via the Supabase client using that embedding array to retrieve the top 5 most semantically relevant stores.
4. **The Conversational Step:** Pass only those 5 stores to the `gemini-1.5-flash` model, enforcing a strict JSON output schema so the frontend can render the `StoreCards` perfectly.

---

## Phase 4: Data Ingestion Pipeline & Admin Portal [TODO]

Build the tools necessary for stores to upload and manage the information that powers the AI, and the background pipelines that process it.

### The 3-Step Data Ingestion Pipeline
This is the core architecture to ensure high semantic accuracy at scale without burdening store owners:
1. **Input (Frictionless):** Store owners or Mall Admins provide only basic info via a simple UI or CSV: `Name`, `Category`, `Official Brands` (e.g., Dior, Nike), and a `Short Description`.
2. **AI Enrichment Layer:** A Supabase Database Webhook triggers an Edge Function whenever a store is added/updated. This function calls the LLM to generate a rich list of SEO keywords, synonyms, and product variations based on the raw input (crossing Category + Brands + Description).
3. **Vectorization & Storage:** The LLM generates the embedding vector from the enriched text. The data is saved to the DB:
   - `description` (Clean, for the UI)
   - `search_keywords` (Hidden, for exact local matching in MiniSearch)
   - `embedding` (For semantic fallback search via pgvector)

### Admin Dashboard (Web App)
- Create a separate Vite/React app for Mall Administrators and Store Managers.
- Implement Supabase Auth with Role-Based Access Control (RBAC).
- Configure Row Level Security (RLS) policies:
  - `mall_admin` role: Can edit all stores associated with their `mall_id`.
  - `store_manager` role: Can only edit the store associated with their specific `store_id`.
- Build CRUD interfaces tailored to user permissions.

---

## Phase 5: Production Readiness & Kiosk Optimization [TODO]

Ensure the kiosk application can run 24/7 without crashing.

### Offline Resilience & Realtime Sync
- Integrate `localForage` (IndexedDB) to cache the store catalog.
- Ensure Steps 1 and 2 work perfectly even if the mall's internet goes down.
- **Supabase Realtime:** Listen to `postgres_changes` on the `stores` table via WebSockets to silently update the `MiniSearch` index without refreshing the app.
- **Inactivity Fallback Sync:** Do a silent, full-catalog background fetch every time the 120-second inactivity timer triggers to guarantee data integrity.

### Memory & Hardware Management
- Implement the "Nightly Flush" (auto-reload the browser tab at 3:00 AM to clear RAM).
- Setup the 120-second inactivity session timeout.

---

## Phase 6: Interactive Wayfinding (Deferred) [TODO]

Replace the static map placeholder with the dynamic, SVG-based routing engine.

### Pathfinding Engine & SVG Rendering
- Digitize mall floorplans into interactive SVG format.
- Implement the client-side A* (A-star) algorithm to calculate routes.
- Bind the A* output to the SVG with CSS animation for the glowing "marching ants" route.

### Mobile Handoff
- Integrate a QR Code generator on the `StoreDetailScreen`.
- Link to a mobile web view for users to take the route with them.

---

## Verification Plan

### Automated Tests
JW- Test the Search Cascade to verify fallback logic (Exact -> Full Text -> Semantic -> Conversational).
- Verify Admin Portal data updates trigger `pgvector` embedding regeneration.

### Manual Verification
- Deploy to a staging URL and load it on a physical tablet device.
- Test complex, ambiguous queries to ensure Gemini routes to the correct stores based on Admin-provided data.
