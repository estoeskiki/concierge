# Admin Portal Plan

## Architecture

Same Vite project, auth-gated routing. One deployment — the Supabase session role determines which experience loads:

```
App loads → check Supabase session
  ├─ No session            → LoginScreen
  ├─ role = kiosk          → KioskApp  (current app, unchanged)
  ├─ role = store_manager  → AdminApp  (scoped to their store)
  └─ role = mall_admin     → AdminApp  (full portal)
```

Kiosk devices log in once with their service account and are permanently locked to the kiosk UI. Store managers and mall admins log in with email/password from any device (desktop, tablet, phone).

---

## Phase 1 — RLS Full Coverage

**Problem:** Several tables have no RLS at all — they are wide open to any authenticated user.

Tables currently unprotected: `categories`, `store_categories`, `brands`, `store_brands`, `tags`, `nodes`, `edges`

**Policy matrix:**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `categories` | anon: true | mall_admin | mall_admin | mall_admin |
| `brands` | anon: true | store_manager + mall_admin | mall_admin | mall_admin |
| `store_categories` | anon: true | store_manager (own) + mall_admin | — | store_manager (own) + mall_admin |
| `store_brands` | anon: true | store_manager (own) + mall_admin | — | store_manager (own) + mall_admin |
| `tags` | anon: true | store_manager (own) + mall_admin | — | store_manager (own) + mall_admin |
| `store_sales` | anon: active=true | store_manager (own) + mall_admin | store_manager (own) + mall_admin | store_manager (own) + mall_admin |
| `events` | anon: active=true | mall_admin | mall_admin | mall_admin |
| `bathrooms` | anon: active=true | mall_admin | mall_admin | mall_admin |
| `stores` | anon: true | mall_admin | store_manager (own) + mall_admin | mall_admin |
| `malls` | anon: true | — | mall_admin | — |
| `nav_nodes` / `nav_edges` | anon: active=true | mall_admin | mall_admin | mall_admin |

All JWT checks use `(select (auth.jwt()->'app_metadata'->>'user_role'))` and `mall_id`/`store_id` from `app_metadata` (not `user_metadata` — app_metadata is admin-set and secure).

Migration: `supabase migration new rls_full_coverage`

### TODO
- [ ] Create migration file `rls_full_coverage.sql`
- [ ] Add SELECT policies (anon read) for all unprotected tables
- [ ] Add write policies for `store_manager` role
- [ ] Add write policies for `mall_admin` role
- [ ] **Test:** anon INSERT on `categories` returns 403
- [ ] **Test:** store_manager can only write to their own store's junction tables

---

## Phase 2 — Embedding Update Pipeline

**Problem:** Embeddings in `stores.embedding` are static (inserted during migrations). When a store manager edits name or description, the vector goes stale and semantic search degrades.

Embeddings are already 3072-dim (Gemini 2.5) — no schema change needed.

**New edge function:** `supabase/functions/embed-store/index.ts`
- Input: `{ store_id: uuid }`
- Fetches current store row (name, full description, categories, brands)
- The description field includes a `[Keywords: ...]` block — this is intentional search signal, keep it for embedding (it's only stripped in the UI display)
- Builds embedding text: `"${name}. ${description_full}. Categorías: ${categories}. Marcas: ${brands}"`
- Calls Gemini embedding API (3072-dim, same model as `chat` edge function)
- Updates `stores.embedding` via service-role client (bypasses RLS)

**Trigger:** After every successful store save in the admin portal, `embed-store` is called silently in the background — no await, no loading indicator shown to the user.

### TODO
- [ ] Create `supabase/functions/embed-store/index.ts`
- [ ] Implement: fetch store → build full text → embed → update `stores.embedding`
- [ ] **Test:** update a store description → wait 2s → semantic search finds updated content
- [ ] Confirm same Gemini embedding model as `chat` edge function

---

## Phase 3 — Auth Layer (Frontend)

**New files:**
- `src/hooks/useAuth.ts` — subscribes to `supabase.auth.onAuthStateChange`, exposes `{ user, role, mallId, storeId, loading, signOut }`
- `src/screens/LoginScreen.tsx` — clean email + password form, responsive, uses design tokens but not the kiosk portrait layout
- `src/App.tsx` (modify) — wrap root with auth check: render `<LoginScreen>`, `<KioskApp>`, or `<AdminApp>` based on session role

### TODO
- [ ] Create `src/hooks/useAuth.ts`
- [ ] Create `src/screens/LoginScreen.tsx`
- [ ] Modify `src/App.tsx` — add auth gate at root
- [ ] **Test:** unauthenticated visit → LoginScreen
- [ ] **Test:** kiosk service account session → KioskApp (no admin routes visible)
- [ ] **Test:** store_manager login → AdminApp
- [ ] **Test:** mall_admin login → AdminApp

---

## Phase 4 — Admin Portal UI

**Design:** Run `/ui-ux-pro-max` before building. Target: clean professional SaaS dashboard, **fully responsive** — desktop, tablet, and mobile (store owners update info from their phone). Breakpoints: 1280px / 768px / 375px. Same Kiki design tokens for brand consistency.

**Folder structure:**

```
src/admin/
  AdminApp.tsx                   — admin router (React Router)
  layout/
    AdminLayout.tsx              — sidebar on desktop, bottom nav on mobile
  screens/
    OverviewScreen.tsx           — stats cards (# stores, # events, # active deals)
    StoresScreen.tsx             — table of all stores (mall_admin only)
    StoreEditScreen.tsx          — store edit form (both roles)
    EventsScreen.tsx             — events CRUD (mall_admin only)
    BathroomsScreen.tsx          — toggle active, edit metadata (mall_admin only)
  components/
    FormField.tsx                — labeled input wrapper
    TagInput.tsx                 — pill-style multi-value input (brands, categories)
    DataTable.tsx                — sortable/filterable table
    SaveButton.tsx               — save + loading + success state
```

**Store Edit Form fields:**
- Name, emoji, unit number, floor
- Description (textarea — shown without keywords for readability; full description with keywords is stored in DB and used for embeddings)
- Categories — multi-select from `categories` table
- Brands — tag input (creates new `brands` rows as needed)
- Baratillo deals — list with add/remove/edit inline
- On save: store data saved → `embed-store` fires silently in background

**Events form fields:** title, type (pill selector: moda/música/belleza/comida/familia), start_date, end_date, time, location, description, active toggle

### TODO
- [x] Run `/ui-ux-pro-max` to generate admin design system
- [x] Create `AdminApp.tsx` and `AdminLayout.tsx` (responsive sidebar + mobile bottom nav)
- [x] Build `StoreEditScreen.tsx` with all fields + save + background embed call
- [x] Build `EventsScreen.tsx` with full CRUD (inline edit, active toggle, delete confirm)
- [x] Build `BathroomsScreen.tsx` (active toggle, inline edit, delete confirm)
- [x] Build `OverviewScreen.tsx` (role-aware: mall stats vs store CTA)
- [x] Build shared components: FormField, TagInput, SaveButton
- [x] Fix `vite-env.d.ts` missing → resolved `import.meta.env` TS errors
- [ ] **Test:** responsive layout at 375px / 768px / 1280px
- [ ] **Test:** store_manager sees only their store (no /stores, no events)
- [ ] **Test:** mall_admin sees all stores, events, and bathrooms
- [ ] **Deploy:** `supabase functions deploy embed-store`

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/…_rls_full_coverage.sql` | NEW |
| `supabase/functions/embed-store/index.ts` | NEW |
| `src/hooks/useAuth.ts` | NEW |
| `src/screens/LoginScreen.tsx` | NEW |
| `src/App.tsx` | MODIFY |
| `src/admin/AdminApp.tsx` | NEW |
| `src/admin/layout/AdminLayout.tsx` | NEW |
| `src/admin/screens/*.tsx` | NEW (5 screens) |
| `src/admin/components/*.tsx` | NEW (4 components) |
