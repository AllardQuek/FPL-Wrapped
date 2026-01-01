# Architecture Decision: Next.js vs Vite

This document outlines the rationale behind choosing Next.js for FPL Wrapped and evaluates the implications of moving to Vite.

## Why Next.js was chosen?

Next.js was selected primarily because of its full-stack capabilities and built-in optimizations that are critical for a data-driven, social application like FPL Wrapped.

### 1. Bypassing CORS (Server-Side Proxying)
The official Fantasy Premier League (FPL) API does not allow requests from browser-based clients (CORS). 
- **Next.js Solution:** Built-in API routes (`app/api/manager/[id]/route.ts`) act as a server-side proxy. This allows the application to fetch data from FPL on the server and pass it securely to the frontend.
- **Vite Alternative:** Using Vite (an SPA) would require a separate backend server or cloud functions to handle these API requests.

### 2. SEO & Social Sharing (Dynamic Metadata)
A "Wrapped" experience is designed to be shared. 
- **Next.js Solution:** Uses the `Metadata` API to generate dynamic page titles and descriptions for specific users. When someone shares their unique link on Twitter or Reddit, it can show their Team ID or rank in the preview.
- **Vite Alternative:** SPAs typically serve a single static HTML file, making dynamic metadata difficult without complex workarounds like pre-rendering or external meta-tag injectors.

### 3. Integrated Deployment
Next.js provides a unified environment for both frontend components and backend logic. This simplifies the deployment pipeline (e.g., Vercel, Netlify) and ensures that the API and frontend are always in sync.

---

## Recommendations Moving Forward

While Next.js is the superior choice for this project, the implementation can be matured further:

1. **Leverage Server Components:** Migrate data fetching from client-side `useEffect` hooks into React Server Components. This will:
   - Eliminate the initial loading spinner for data-heavy pages.
   - Reduce the total JavaScript bundle sent to the client.
2. **Dynamic OG Images:** Implement Next.js `@vercel/og` to generate personalized shareable cards. This would create an image on-the-fly showing the user's top player or season score, significantly increasing social engagement.

---

## Switching to Vite: Feasibility Study

Moving to Vite would be **moderately tedious** and would result in several technical regressions:

| Feature | Next.js Implementation | Vite Migration Effort |
| :--- | :--- | :--- |
| **Backend API** | Simple `app/api` routes | High: Requires separate backend service |
| **SEO/Metadata** | Built-in `Metadata` export | High: Needs SSR or custom server logic |
| **Routing** | File-based with `next/navigation` | Medium: Switch to `react-router-dom` |
| **Fonts/Images** | Optimized via `next/font` & `next/image` | Medium: Manual optimization required |

### Conclusion
For an FPL Wrapped project, **Next.js is the optimal tool**. It solves the API connectivity (CORS) and social sharing (SEO) problems out-of-the-box, allowing the focus to remain on the analysis logic and user experience.
