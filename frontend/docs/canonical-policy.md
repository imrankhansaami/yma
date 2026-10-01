# Canonical Policy

## Rules

- Every public indexable page must declare a self-canonical URL.
- Every private page (`/admin`, auth flows, profile/account) must declare self-canonical and `noindex,nofollow`.
- Canonical URLs must be lowercase, query-free, and without trailing slash (except `/`).
- Dynamic routes must resolve canonical from stored slugs when available.
- Legacy alias routes must use permanent redirects to a single primary URL.

## Checklist For New Routes

- Add metadata with `alternates.canonical`.
- If route is private, add `robots` with `index: false` and `follow: false`.
- For dynamic routes, normalize param slugs and avoid raw query/param canonical values.
- Ensure only one canonical target exists for each unique content page.
