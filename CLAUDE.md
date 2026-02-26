# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Strapi 5 plugin (`strapi-plugin-review-flow`) that adds an editorial review workflow with approval gates to Strapi's Community Edition. It's an alternative to Strapi's Enterprise-only review workflows.

## Commands

```bash
# Build the plugin
npm run build

# Watch mode for development
npm run watch

# Watch and link to a local Strapi project
npm run watch:link

# Type check frontend
npm run test:ts:front

# Type check backend
npm run test:ts:back

# Verify plugin structure
npm run verify

# Release
npm run release
npm run release:alpha
```

There is no test runner configured (no jest/vitest setup). Type checking (`test:ts:*`) is the primary validation mechanism.

## Architecture

The plugin follows Strapi's standard plugin structure with two main parts:

### Backend (`server/src/`)

- **`bootstrap.ts`** — Plugin entry point. Registers a Koa middleware for custom review-status sorting in list views, registers document lifecycle hooks that intercept the publish action to block publishing without approval, and determines which content types review applies to.
- **`services/review-workflow.ts`** — Core business logic: `assignReview`, `approveReview`, `rejectReview`, `reRequestReview`, `getReviewStatus`, `createComment`.
- **`services/permission.ts`** — Publish gate logic. `getPublishBlockReason()` returns one of `NO_REVIEW | REVIEW_PENDING | REVIEW_REJECTED | MODIFIED_AFTER_APPROVAL`.
- **`controllers/review-workflow.ts`** — HTTP handlers delegating to services.
- **`routes/review-workflow.ts`** — 12 API endpoints (`/assign`, `/approve/:id/:locale`, `/reject/:id/:locale`, `/re-request/:id/:locale`, `/status/...`, `/pending`, `/rejected`, `/assigned-by-me`, `/bulk-assign`).
- **`content-types/`** — Two Strapi content types:
  - `review-workflow`: tracks status (`pending`/`approved`/`rejected`), document reference, locale, assignedTo/assignedBy relations
  - `review-comment`: comment text + type (`assignment`/`rejection`/`re-request`/`approval`/`general`)

### Frontend (`admin/src/`)

- **`index.ts`** — Plugin registration. Injects `ReviewButton` and `ReviewStatus` into the content editor, `ReviewStatusCell` into list view columns, and registers `BulkReviewAction`.
- **`pages/HomePage.tsx`** — Task Center dashboard with two sections: "Assigned to Me" (pending + rejected) and "Assigned by Me".
- **`components/InjectionZone/`** — Components injected into Strapi's content manager UI.
- **`components/TaskCenter/`** — Table components for the task dashboard.
- **`components/modals/`** — `ReviewModal` (assign), `RejectReasonModal`, `ReRequestModal`, `BulkReviewModal`.
- **`hooks/`** — `useReviews` (fetch/mutate review state), `useReviewModals` (modal state), `useTaskCount` (sidebar badge), `usePluginConfig` (enabled content types).
- **`utils/reviewStatusEvents.ts`** — Custom event pub/sub for cross-component review state updates.

### Data Flow

1. Author clicks "Request Review" → `ReviewModal` → POST `/assign` → creates `review-workflow` record
2. Reviewer sees in Task Center → approves/rejects → PUT `/approve` or `/reject`
3. Lifecycle hook in `bootstrap.ts` checks `permission.ts` on every publish attempt
4. If not approved, publish is blocked with a descriptive error message

## Plugin Configuration

Users configure the plugin in their Strapi config:

```js
// config/plugins.js
module.exports = {
  'review-workflow': {
    enabled: true,
    config: {
      contentTypes: ['api::article.article'], // optional: restrict to specific types
    },
  },
};
```

If `contentTypes` is omitted, review workflow applies to all content types.

## Permissions

Four custom admin permissions registered via Strapi RBAC:
- `review.assign` — Request reviews
- `review.handle` — Approve/Reject reviews
- `review.reviewPublishWithoutReview` — Bypass review requirement
- `review.bulk-assign` — Bulk assign reviews

## Code Style

Prettier config (`.prettierrc`): single quotes, 2-space indent, 100 char line width, trailing commas (ES5), LF line endings.
