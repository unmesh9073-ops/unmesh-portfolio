# Unmesh — Personal Portfolio

A minimalist, Spatial OS–inspired personal portfolio built to evolve across four years of B.Tech Computer Science (AI & ML) at **Newton School of Technology, Pune** and beyond.

Engineered with a calm **Obsidian Dark / Titanium Light** palette, translucent `.liquid-glass` functional chrome, spring-physics micro-interactions, an interactive 3D WebGL neural volume, and live GitHub repository synchronization.

---

## Quick Personalization (`src/config/profile.config.ts`)

All identity details, links, foundational focus areas, and future lifelong modules live in [`src/config/profile.config.ts`](src/config/profile.config.ts). Edit this single file to update the portfolio without rewriting UI components:

1. **Identity & Copy (`profileConfig.identity`):**
   - Update `role`, `status`, `tagline`, and `bio` as academic milestones, internships, and research interests evolve.
2. **GitHub Live Auto-Sync (`profileConfig.links.githubUsername`):**
   - Replace `"YOUR_GITHUB_USERNAME"` in `profileConfig.links.githubUsername` with your GitHub handle (and update `githubUrl`).
   - Public repositories are fetched from the GitHub REST API, normalized into portfolio cards, and cached in `localStorage` for 15 minutes to prevent rate-limiting.
   - If the placeholder username is still set, or if the network request fails/is rate-limited, the app gracefully displays curated fallback showcase builds.
3. **Social & Contact Links (`profileConfig.links`):**
   - Update `githubUrl`, `linkedinUrl`, and `email` (click-to-copy email pill + `⌘K` Spotlight copy action read directly from this config).

---

## GitHub Auto-Sort Topics

Repository placement across sections is controlled automatically using GitHub repository topics configured in `profileConfig.githubSync`:

| Destination Section | Default Topic Rule | Behavior |
| --- | --- | --- |
| **Featured Builds (`#work`)** | `featured` (`featuredTopic`) | Non-fork repos tagged `featured` appear as flagship cards. If a real GitHub account has non-fork repos without a `featured` tag, the most recently updated repos are promoted automatically so `#work` never renders empty. |
| **Current AI/ML Lab (`#lab`)** | `labTopics` (e.g., `ai-ml`, `lab`, `machine-learning`, `experiment`) | Non-featured repos matching any configured lab topic appear in the compact lab index. |
| **All Repositories Archive** | All public repos | Searchable and filterable from the top header, Floating Dock, or `⌘K` Spotlight command bar. |

---

## Multi-Year Growth (`profileConfig.modules`)

Upcoming sections are already designed and gated behind boolean feature flags inside `profileConfig.modules`:

- **`showExperience`** — Flip to `true` when internships, teaching assistantships, or engineering roles are ready in `profileConfig.experience`. Automatically surfaces `#experience` in the layout, Floating Dock, and `⌘K` Spotlight.
- **`showResearchNotes`** — Flip to `true` when technical essays or ML notes are added to `profileConfig.notes`. Automatically surfaces `#notes` in navigation and Spotlight.
- **`showResume`** — Flip to `true` once a resume URL or asset is linked in `profileConfig.links`.

---

## Architecture Overview

- **`src/config/profile.config.ts`** — Single source of truth for identity, links, skills, experience, notes, modules, and GitHub sync settings.
- **`src/lib/motion.ts`** — Centralized Framer Motion spring physics and easing tokens, wrapped globally in `<MotionConfig reducedMotion="user">`.
- **`src/context/ThemeContext.tsx`** — Obsidian Dark / Titanium Light state with `localStorage` persistence, system theme detection, and live `<meta name="theme-color">` chrome tinting.
- **`src/context/GitHubContext.tsx`** — Live GitHub API client with 15-minute `localStorage` TTL caching, smart topic bucketing, and fallback resilience.
- **`src/components/three/NeuralVolumeCanvas.tsx`** — Lazy-loaded React Three Fiber / Three.js interactive neural sculpture (`Synapse`, `Latent`, `Tensor` modes), isolated behind a WebGL Error Boundary so Hero text renders immediately with zero blocking.
- **`src/components/FloatingDock.tsx` & `src/components/SpotlightModal.tsx`** — Spatial bottom dock with active-section tracking and `⌘K` / `Ctrl+K` command bar.

---

## Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Run TypeScript check and linter
npx tsc -b && npm run lint

# Build for production
npm run build

# Preview the production bundle locally
npm run preview
```

---

## Deployment (Vercel)

This repository includes a [`vercel.json`](vercel.json) configured for single-page routing and long-lived immutable caching on hashed Vite assets (`/assets/*`):

1. Push the repository to GitHub.
2. Import the project in the Vercel dashboard (Framework Preset: **Vite**).
3. Leave Build Command as `npm run build` and Output Directory as `dist`.
4. Deploy — future pushes rebuild and publish automatically.
