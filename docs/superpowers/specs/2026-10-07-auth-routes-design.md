# Authentication Route and Entry-Point Design

## Goal

Make authentication mode explicit in the URL, keep navigation focused by removing the navbar Sign in action, and give the auth form consistent spacing while preserving validated return destinations.

## Approved scope

- Use `/auth/signin` and `/auth/signup` as the only authentication page routes.
- Remove the logged-out Sign in CTA from the navbar. Keep the separate Sign in link on the landing page.
- Make the sign-in/sign-up switch navigate between the canonical routes. Preserve the validated `next` destination across the switch and browser navigation.
- Update internal entry points: course enrollment goes to `/auth/signup`; protected-page unauthenticated redirects go to `/auth/signin`.
- Remove the old `/login` route rather than keeping a compatibility redirect.
- Keep Better Auth API endpoints and sign-in/sign-up behavior unchanged.
- Add consistent top spacing before the Google button; retain the centered email divider below Google and above the credential fields.

## Route and state behavior

- The route determines the initial form mode; `/auth/signin` renders sign-in and `/auth/signup` renders account creation.
- Both routes accept an optional `next` query value, validated as a local path before use.
- Switching modes navigates to the corresponding canonical route and carries forward only the safe `next` path.
- Successful email and Google auth continue to use the validated destination.
- An unauthenticated enrollment CTA enters `/auth/signup?next=/courses/{courseId}`; protected learning, dashboard, assessment, project, and profile destinations enter `/auth/signin?next={destination}`.
- No `/login` route or internal `/login` links remain after migration.

## UI behavior

- The navbar has no logged-out Sign in button; signed-in profile/logout behavior is unchanged.
- The landing page's existing Sign in entry point remains and points to `/auth/signin`.
- The auth-mode controls remain above the heading. Google remains the first auth method, followed by a centered divider and then the email/password fields.
- Add a consistent 20px top gap between the supporting copy and Google button, addressing the compressed spacing visible in the supplied screenshot.

## Verification

- Route tests cover mode selection, safe `next` preservation through mode switching, and removal of legacy route usage.
- Auth form tests cover matching title/mode, route destinations, Google/divider/credential order, and validated post-auth redirect behavior.
- Navigation tests verify the navbar no longer exposes logged-out Sign in while the landing-page Sign in link remains.
- Existing Better Auth behavior is unchanged. Run focused tests and typecheck; perform browser checks for both URLs and spacing when the dev environment can start.

## Constraints and risks

- A route migration can break saved `/login` bookmarks; this is intentional per the user's instruction to use only the new routes.
- Preserve safe-local-path validation; never pass an unchecked `next` value into auth callbacks or redirects.
- The project's pnpm workspace links have been observed incomplete and install attempts hit `EPERM`; do not claim browser QA until dev startup is available.

## Out of scope

- Changes to Better Auth API routes, providers, session semantics, or account policies.
- Removing the landing page's Sign in link.
- Changes to signed-in navbar controls.
