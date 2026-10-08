# Premium Academy Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Academy homepage into a premium, responsive learning landing page with original visual assets, purposeful motion, clearer course discovery, and existing signup/course flows intact.

**Architecture:** Keep `/` as the server-loaded route and retain its session/catalog data contract. Refactor the client landing into focused section components, use existing Academy design tokens and local SVG artwork, and add CSS motion with a reduced-motion fallback. No new packages or external runtime assets.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, HeroUI, Vitest.

**Spec:** User-approved direction in the current task (2026-10-06): premium Academy-specific UI using DataCamp-like section/UX patterns, not copied branding; expanded scope includes animation, assets, and content. Preserve classroom teal, current app routes and behavior, and verified product claims.

## Global Constraints

- Preserve the existing Next.js/React/Tailwind/HeroUI stack; add no dependencies.
- Keep Academy's classroom teal `#0F5C73`; do not adopt DataCamp's brand palette, logo, copy, or visual assets.
- Use existing course/roadmap data and auth destinations; do not invent outcomes, audience metrics, testimonials, prices, features, or certification guarantees.
- Preserve semantic headings, keyboard access, visible focus, responsive reflow, sufficient contrast, and reduced-motion behavior.
- Treat this as a reversible homepage redesign only; do not alter authentication, catalog, course, executor, or learner-workspace behavior.
- Use self-authored/local SVGs or existing Academy assets; no external images or packages.

## Review Focus

- Logged-in and logged-out hero/course CTAs retain their original destinations; test both states.
- Roadmap filtering remains keyboard-operable and exposes the selected state; test tab interaction and zero-course steps.
- Long course titles/summaries and narrow screens wrap without clipping; test actual course content and 320px layout in browser QA.
- Entrance/hover motion never hides core copy and stops under `prefers-reduced-motion`; verify CSS and browser preference.
- Custom SVG artwork is decorative unless it communicates content; verify accessible names do not duplicate nearby text.

---

### Task 1: Specify the upgraded landing-page contract in tests

**Files:**
- Create: `apps/web/src/components/home/Landing.test.tsx`
- Test: `apps/web/src/components/home/Landing.test.tsx`

**Interfaces:**
- Consumes: Current `Landing` props (`signedIn`, `startHref`, `steps`) and the existing roadmap/course shapes.
- Produces: Regression coverage for the new learning-focused section hierarchy, hero content, signup destinations, and available roadmap data.

- [ ] **Step 1: Write failing static-render tests** for the upgraded hero/section hierarchy and primary CTA destinations in signed-in and signed-out states; include actual roadmap/course fixture content.
- [ ] **Step 2: Run `pnpm --filter @academy/web test -- Landing.test.tsx`** and confirm the new content assertions fail for the intended reason, not for missing test infrastructure.
- [ ] **Step 3: Add only the minimal Next.js/HeroUI mocks needed** using existing React/Vitest dependencies; do not add a browser-testing package for these component contracts.
- [ ] **Step 4: Keep the existing tablist semantics, default selected state, and route contract represented in static-render assertions; reserve actual keyboard/tab interaction for rendered browser QA.**

### Task 2: Refine the landing structure, course discovery, and visual assets

**Files:**
- Modify: `apps/web/src/components/home/Landing.tsx`
- Create: `apps/web/src/components/home/HeroSection.tsx`
- Create: `apps/web/src/components/home/RoadmapSection.tsx`
- Create: `apps/web/src/components/home/LearningModelSection.tsx`
- Create: `apps/web/public/landing/learning-loop.svg`
- Modify: `apps/web/src/components/home/Landing.test.tsx`

**Interfaces:**
- Consumes: `Landing` route props and existing `Course`/`Step` data.
- Produces: Focused homepage sections; all catalog, login, dashboard, course, and roadmap destinations remain unchanged.

- [ ] **Step 1: Extend focused tests** for the revised content hierarchy and preserve the existing route/auth destinations; run the focused test and verify the new assertions fail.
- [ ] **Step 2: Extract the hero, roadmap/course discovery, and learning-model sections** into focused components with semantic headings and real Academy course data.
- [ ] **Step 3: Create an original local SVG learning-loop illustration** grounded in the actual read/write/run/submit flow, with decorative artwork hidden from assistive technology when its meaning is repeated in text.
- [ ] **Step 4: Replace the competing hero signup card with one clear primary action and a lesson/workspace preview; retain secondary account and catalog links in purposeful navigation/content positions.**
- [ ] **Step 5: Rework roadmap/course scanning and learning-model copy** around existing available content only; keep course level/duration metadata and avoid unsupported claims.
- [ ] **Step 6: Re-run focused tests and web typecheck**; resolve failures before moving to visual styling.

### Task 3: Apply the premium visual system and purposeful motion

**Files:**
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/components/home/HeroSection.tsx`
- Modify: `apps/web/src/components/home/RoadmapSection.tsx`
- Modify: `apps/web/src/components/home/LearningModelSection.tsx`

**Interfaces:**
- Consumes: Academy's existing Fraunces/Inter/IBM Plex Mono fonts and CSS color tokens.
- Produces: Responsive premium layout, states, motion, and reduced-motion fallback without changing domain behavior.

- [ ] **Step 1: Establish the visual hierarchy** with a light editorial canvas, a deliberate asymmetrical hero, code/workspace details, and restrained teal/ochre accents; retain shared tokens instead of introducing unrelated colors.
- [ ] **Step 2: Add one cohesive reveal sequence and restrained control transitions** with visible static content by default, no scroll-trigger dependency, and `prefers-reduced-motion` disabling animation and smooth scrolling.
- [ ] **Step 3: Check the layout at 320px, 768px, 1024px, and 1440px** and refine any clipping, overflow, focus, or contrast issue.
- [ ] **Step 4: Run focused tests, web lint, web typecheck, and web build.**

### Task 4: Rendered QA and regression review

**Files:**
- Review: `apps/web/src/app/page.tsx`
- Review: `apps/web/src/components/home/Landing.tsx`
- Review: `apps/web/src/components/home/*.tsx`
- Review: `apps/web/src/app/globals.css`
- Review: `apps/web/public/landing/learning-loop.svg`

- [ ] **Step 1: Verify build and tests** with fresh command output; report each command/result.
- [ ] **Step 2: Inspect rendered desktop and mobile layouts** and exercise keyboard navigation, roadmap tabs, signup/course actions, and reduced-motion mode.
- [ ] **Step 3: Record checks as pass/fail/not_verified**; do not infer browser, accessibility, or responsive success from static code inspection.
