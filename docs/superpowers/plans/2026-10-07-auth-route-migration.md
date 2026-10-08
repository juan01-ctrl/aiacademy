# Academy Auth Route Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/login` with `/auth/signin` and `/auth/signup`, remove the navbar Sign in CTA, preserve secure return paths, and correct auth-form spacing.

**Architecture:** Two canonical route pages share one server-side auth page component and the existing client form. The route controls mode, mode-switch links preserve only a sanitized `next` value, and all internal entry points target the appropriate canonical route. Better Auth APIs and session semantics remain unchanged.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Better Auth, Tailwind CSS 4, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-07-auth-routes-design.md`

## Global Constraints

- Use `/auth/signin` and `/auth/signup` as the only authentication page routes.
- Remove the logged-out Sign in CTA from the navbar. Keep the separate Sign in link on the landing page.
- Preserve the validated `next` destination across the auth-mode switch and successful email/Google authentication.
- Course enrollment goes to `/auth/signup`; protected-page unauthenticated redirects go to `/auth/signin`.
- Remove the old `/login` route rather than keeping a compatibility redirect.
- Keep Better Auth API endpoints and sign-in/sign-up behavior unchanged.
- Google remains the first auth method, followed by the email divider and credential fields.
- Add a consistent 20px top gap between supporting copy and the Google button.
- Do not expose secrets or alter dependencies.

## Review Focus

1. Malicious `next` values (external URLs, protocol-relative URLs, backslashes) continue to fall back to the safe default route; test in Task 1.
2. Direct visits to each canonical route select the matching form mode and preserve safe `next`; test in Task 1.
3. Auth mode switching preserves the safe `next` value and uses actual route navigation; test in Task 1.
4. The navbar has no logged-out Sign in CTA while the landing-page Sign in entry remains; test in Task 2.
5. Enrollment and every protected-page redirect use the correct canonical auth route and preserve their return path; test in Task 2.

---

## File Structure

- Create `apps/web/src/app/auth/AuthPage.tsx` — shared server page logic for session redirects, sanitized return path, and rendering the form.
- Create `apps/web/src/app/auth/signin/page.tsx` — canonical sign-in route, delegates to `AuthPage` with `sign-in` mode.
- Create `apps/web/src/app/auth/signup/page.tsx` — canonical sign-up route, delegates to `AuthPage` with `sign-up` mode.
- Delete `apps/web/src/app/login/page.tsx` — old login route is intentionally removed.
- Modify `apps/web/src/components/auth/LoginForm.tsx` — route links for mode switch and consistent spacing before Google.
- Modify `apps/web/src/lib/auth-routes.ts` and its test — safe path validation and canonical auth URL construction.
- Modify `apps/web/src/components/nav/Navbar.tsx` — remove only logged-out navbar Sign in CTA.
- Modify `apps/web/src/components/home/Landing.tsx` and `apps/web/src/app/page.tsx` — keep landing entry point and point it to canonical sign-in route.
- Modify protected-route pages in `apps/web/src/app/dashboard/page.tsx`, `apps/web/src/app/profile/page.tsx`, `apps/web/src/app/learn/[courseId]/page.tsx`, `apps/web/src/app/learn/[courseId]/lessons/[lessonId]/[stepId]/page.tsx`, `apps/web/src/app/courses/[courseId]/assessment/page.tsx`, and `apps/web/src/app/courses/[courseId]/project/page.tsx` — redirect unauthenticated visitors to canonical sign-in route with return path.
- Modify `apps/web/src/components/course/CourseOverview.tsx` and its test — point guest enrollment to canonical sign-up route.
- Add/update focused auth form and navbar tests; keep tests colocated with their components.

## Task 1: Canonical Auth Pages and URL-Driven Mode

**Files:**
- Create: `apps/web/src/app/auth/AuthPage.tsx`
- Create: `apps/web/src/app/auth/signin/page.tsx`
- Create: `apps/web/src/app/auth/signup/page.tsx`
- Delete: `apps/web/src/app/login/page.tsx`
- Modify: `apps/web/src/components/auth/LoginForm.tsx`
- Modify: `apps/web/src/lib/auth-routes.ts`
- Test: `apps/web/src/lib/auth-routes.test.ts`
- Test: `apps/web/src/app/auth/AuthPage.test.tsx`
- Test: `apps/web/src/components/auth/LoginForm.test.tsx`

**Interfaces:**
- `AuthPage` accepts `mode: AuthMode` and `searchParams: Promise<{ next?: string }>` and renders the form using the safe return path.
- `LoginForm` continues to accept `nextPath: string` and `initialMode: AuthMode`; mode controls become links to `/auth/signin` and `/auth/signup` with the safe `next` query preserved.
- `getSafeNextPath(path: string | undefined): string` retains existing local-path validation.
- Add `getAuthPath(mode: AuthMode, nextPath?: string): string` to return the canonical route and include an encoded, revalidated `next` only when supplied.

- [ ] **Step 1: Add failing route-helper tests** for canonical sign-in/sign-up paths, encoded local `next`, and rejection of unsafe return destinations passed to `getAuthPath`.
- [ ] **Step 2: Run the focused helper test** with `pnpm --filter @academy/web test -- src/lib/auth-routes.test.ts`; confirm new expectations fail before implementation.
- [ ] **Step 3: Implement `getAuthPath` and retain `getSafeNextPath`** in `apps/web/src/lib/auth-routes.ts`.
- [ ] **Step 4: Add failing auth form tests** asserting sign-in/sign-up mode links include the correct canonical URL and preserve `next`; retain title and Google/divider/credential order assertions.
- [ ] **Step 5: Run the focused auth form test** with `pnpm --filter @academy/web test -- src/components/auth/LoginForm.test.tsx`; confirm route-link expectations fail before implementation.
- [ ] **Step 6: Implement shared `AuthPage` and canonical route pages**, passing the route-specific `AuthMode`, redirecting an existing session to the sanitized `next`, and passing `nextPath` to `LoginForm`.
- [ ] **Step 7: Add `AuthPage.test.tsx`** with `getSession` mocked as signed out; assert the sign-in route renders the sign-in title, the sign-up route renders the account-creation title, and a signed-in session redirects to the sanitized `next`.
- [ ] **Step 8: Update `LoginForm` mode controls to real links** using `getAuthPath`; remove local-only mode switching so browser history and URL stay synchronized.
- [ ] **Step 9: Add `mt-5` spacing before the Google button** while leaving the divider beneath Google and before credential fields.
- [ ] **Step 10: Remove the old `/login` page** and run focused auth helper/page/form tests; expected result is all focused tests pass.

## Task 2: Migrate Entry Points and Remove Navbar CTA

**Files:**
- Modify: `apps/web/src/components/nav/Navbar.tsx`
- Modify: `apps/web/src/components/home/Landing.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/course/CourseOverview.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`
- Modify: `apps/web/src/app/learn/[courseId]/page.tsx`
- Modify: `apps/web/src/app/learn/[courseId]/lessons/[lessonId]/[stepId]/page.tsx`
- Modify: `apps/web/src/app/courses/[courseId]/assessment/page.tsx`
- Modify: `apps/web/src/app/courses/[courseId]/project/page.tsx`
- Test: `apps/web/src/components/nav/Navbar.test.tsx` (create if absent)
- Test: `apps/web/src/components/course/CourseOverview.test.tsx`

**Interfaces:**
- All sign-in entry points use `/auth/signin`; guest enrollment uses `/auth/signup`.
- Both canonical paths preserve the same validated `next` destination expected by Task 1.

- [ ] **Step 1: Add a failing navbar test** asserting the logged-out navbar omits Sign in while signed-in profile/logout controls remain available.
- [ ] **Step 2: Run the focused navbar test** and confirm it fails on the current logged-out CTA.
- [ ] **Step 3: Remove only the logged-out Sign in navbar branch**; do not remove the landing-page Sign in link.
- [ ] **Step 4: Update the landing-page auth entry points** in `Landing.tsx` and `app/page.tsx` to use `/auth/signin`.
- [ ] **Step 5: Update the guest course enrollment link** to `/auth/signup?next=...`; update the course overview test to assert the new URL and retained course path.
- [ ] **Step 6: Update all protected-page unauthenticated redirects** to `/auth/signin?next=...`, preserving the protected route path.
- [ ] **Step 7: Search source for `/login` references** and confirm none remain in application routes or internal links; `/login` should not be recreated as a redirect.
- [ ] **Step 8: Run focused navigation and course overview tests**; expected result is all pass.

## Task 3: Full Verification

**Files:** No additional files unless a failing test exposes a scoped defect.

**Interfaces:** Validate the integrated canonical routes and all migrated auth entry points.

- [ ] **Step 1: Run the full web test suite** with `pnpm --filter @academy/web test`; expected result is all web tests pass.
- [ ] **Step 2: Run web typecheck** with `pnpm --filter @academy/web typecheck`; expected result is exit code 0.
- [ ] **Step 3: If the development server is available, verify** `/auth/signin` and `/auth/signup` directly, auth-mode switching with a `next` query, the navbar without Sign in, and the copy-to-Google spacing at desktop/mobile widths.
- [ ] **Step 4: Record browser verification as `not_verified` if dev startup remains blocked** by missing pnpm workspace links or `EPERM`; do not treat unit tests as visual evidence.

## Execution Notes

- This target folder is not a Git repository, so do not add commit steps or initialize Git as part of this work.
- The existing pnpm workspace has missing `.bin` links and install attempts previously failed with `EPERM`; do not retry install/cleanup without first resolving the exact filesystem protection.
- Implementation spans multiple source files and should use one writer, followed by a fresh reliability/security review.
