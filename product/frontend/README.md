# Meridian — Product Platform Frontend

A distinctive React + SCSS product showcase and management UI for the Meridian platform.

## Design System

**Layout concept:** Offset Rail — content anchors to an asymmetric left rail with generous right negative space.

**Signature element:** Scroll-masked product reveal — hero thumbnails unmask vertically as you scroll.

### Color tokens

| Token | Hex | Role |
|-------|-----|------|
| cobalt | `#1A3A6B` | Brand |
| vermillion | `#E03E1A` | Accent |
| ink | `#0B0D10` | Text / dark surfaces |
| paper | `#F4F1EC` | Primary surface |
| slate | `#5C6370` | Secondary text |
| mist | `#D8DCE3` | Borders |

### Typography

- **Display:** Syne
- **Body:** DM Sans

## Tech Stack

- React 18 (functional components + hooks)
- SCSS with partials, variables, mixins, BEM naming
- Framer Motion for orchestrated motion
- Lenis for inertia scrolling
- React Router v6

## Prerequisites

- Node.js 18+
- Backend API running (see `../Backend`)

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API origin (e.g. `http://localhost:3000`). Leave empty to use Vite dev proxy. |
| `VITE_AUTH_LOGIN_URL` | Optional POST endpoint for email/password login returning `{ accessToken }`. |

## Scripts

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## API Integration

The frontend talks to the backend at:

- `POST /api/products/product` — create product (multipart/form-data)
- `GET /api/get/product/:id` — single product
- `GET /api/get/products/search?query=` — search products

Auth: JWT via `Authorization: Bearer` header (stored in `localStorage`) or cookie.

### Authentication

All product routes require auth. Use the **Sign in** page to paste a valid JWT. If your auth service exposes a login endpoint, set `VITE_AUTH_LOGIN_URL`.

## Project Structure

```
src/
  components/     # Reusable UI
  pages/          # Route-level views
  hooks/          # useAuth, useSearch, useProduct, useProducts, useLenis…
  services/
    api.js        # Centralized fetch layer
  styles/         # SCSS partials and component styles
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Cinematic hero, featured marquee, latest products |
| `/products` | Asymmetric masonry grid with filter/sort |
| `/search` | Debounced search with animated results |
| `/products/:id` | Image gallery, detail, seller info |
| `/create` | Multi-step form with drag-and-drop upload |
| `/login` | JWT token or credential auth |

## Accessibility

- Semantic HTML and ARIA roles
- Keyboard navigation and focus rings
- `prefers-reduced-motion` respected for animations, Lenis, and marquee
- Skip link to main content
- Alt text passed through from API image metadata

## Development Proxy

Vite proxies `/api` to `http://localhost:3000` during development. Ensure your backend listens on that port or update `vite.config.js`.
