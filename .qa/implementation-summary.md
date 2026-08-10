# Implementation Summary

**Date**: 2026-08-10  
**Node**: Kimai Community Node  
**Version**: 1 → 1.1

---

## Changes Applied

### 1. Query Parameter Fixes

#### GET /api/customers (list)
- **Added**: `full` query parameter with options (Yes/No → 1/0) for expanded customer data
- **Removed**: `project` and `globals` were not present (already clean)

#### GET /api/projects (list)
- **Fixed**: Removed duplicate `'customers[]'` key from `qs` object (parameter already handled via `routing.send`)

#### GET /api/activities (list)
- **Verified**: `projects[]` array parameter already supported via existing `projects` parameter with `routing.send`

### 2. New Endpoints Added

#### Customer Comments (4 operations)
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get Comments | GET | `/api/customers/{id}/comments` |
| Add Comment | POST | `/api/customers/{id}/comments` |
| Delete Comment | DELETE | `/api/customers/{id}/comments/{comment}` |
| Pin Comment | PATCH | `/api/customers/{id}/comments/{comment}/pin` |

#### Project Comments (4 operations)
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get Comments | GET | `/api/projects/{id}/comments` |
| Add Comment | POST | `/api/projects/{id}/comments` |
| Delete Comment | DELETE | `/api/projects/{id}/comments/{comment}` |
| Pin Comment | PATCH | `/api/projects/{id}/comments/{comment}/pin` |

#### Team Assignments (3 operations)
| Resource | Operation | Method | Endpoint |
|----------|-----------|--------|----------|
| Activity | Add Team | POST | `/api/activities/{id}/team` |
| Customer | Add Team | POST | `/api/customers/{id}/team` |
| Project | Add Team | POST | `/api/projects/{id}/team` |

#### Invoice Actions (2 operations)
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Update Custom Fields | PATCH | `/api/invoices/{id}/custom-fields` |
| Download | GET | `/api/invoices/{id}/download` |

#### Approval Bundle (5 operations, added to Default resource)
| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get Next Week | GET | `/api/approval-bundle/next-week` |
| Get Overtime Year | GET | `/api/approval-bundle/overtime_year` |
| Get Week Status | GET | `/api/approval-bundle/week-status` |
| Get Weekly Overtime | GET | `/api/approval-bundle/weekly_overtime` |
| Add to Approve | POST | `/api/approval-bundle/add_to_approve` |

### 3. New Parameters Added

| Parameter | Type | Used By |
|-----------|------|---------|
| `commentText` | string (required) | Customer Add Comment, Project Add Comment |
| `commentId` | string (required) | Customer Delete/Pin Comment, Project Delete/Pin Comment |
| `teamId` | string (required) | Activity Add Team, Customer Add Team, Project Add Team |
| `customFields` | json (required) | Invoice Update Custom Fields |
| `timesheetId` | string (required) | Default Add to Approve |
| `full` | options (Yes/No) | Customer Get All |

### 4. Node Configuration Updates

| Setting | Before | After |
|---------|--------|-------|
| `version` | `1` | `[1, 1]` |
| `group` | `['transform']` | `['organization']` |

### 5. Updated Parameter Display Options

- **Customer ID**: Added `getComments`, `addComment`, `deleteComment`, `pinComment`, `addTeam` operations
- **Project ID**: Added `getComments`, `addComment`, `deleteComment`, `pinComment`, `addTeam` operations
- **Activity ID**: Added `addTeam` operation
- **Invoice ID**: Added `updateCustomFields`, `download` operations

---

## Verification

- ✅ `npm run build` — TypeScript compiles without errors
- ✅ `npm run lint` — ESLint passes without warnings

## Total Operations Added: 18

- Customer: 5 (4 comments + 1 team)
- Project: 5 (4 comments + 1 team)
- Activity: 1 (team)
- Invoice: 2 (custom-fields + download)
- Default: 5 (approval bundle)
