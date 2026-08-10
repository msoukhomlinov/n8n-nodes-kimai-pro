# Kimai API v1.1 Audit Findings

**Date**: 2026-08-10  
**Scope**: Comparison of `nodes/Kimai/Kimai.node.ts` against `api-docs-v1.1.json`  
**Method**: Manual inspection of all 69 node operations against the OpenAPI spec

---

## Critical Issues

### 1. Missing Endpoints (20 endpoints not implemented)

The following API endpoints exist in the spec but are not supported by the node:

#### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers/{id}/comments` | Fetch comments for customer |
| POST | `/api/customers/{id}/comments` | Add comment for customer |
| DELETE | `/api/customers/{id}/comments/{comment}` | Delete customer comment |
| PATCH | `/api/customers/{id}/comments/{comment}/pin` | Pin customer comment |
| GET | `/api/projects/{id}/comments` | Fetch comments for project |
| POST | `/api/projects/{id}/comments` | Add comment for project |
| DELETE | `/api/projects/{id}/comments/{comment}` | Delete project comment |
| PATCH | `/api/projects/{id}/comments/{comment}/pin` | Pin project comment |

#### Team Assignments (Activity/Customer/Project)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/activities/{id}/team` | Create team for activity |
| POST | `/api/customers/{id}/team` | Create team for customer |
| POST | `/api/projects/{id}/team` | Create team for project |

#### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/api/invoices/{id}/custom-fields` | Update invoice custom-fields |
| GET | `/api/invoices/{id}/download` | Download invoice |

#### Approval Bundle
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/approval-bundle/next-week` | Get next week approval bundle |
| GET | `/api/approval-bundle/overtime_year` | Get overtime year |
| GET | `/api/approval-bundle/week-status` | Get week status |
| GET | `/api/approval-bundle/weekly_overtime` | Get weekly overtime |
| POST | `/api/approval-bundle/add_to_approve` | Add to approve |

#### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags` | Fetch tags as strings (deprecated, but still available) |
| DELETE | `/api/export/{id}` | Delete export template |

---

## Warnings

### 2. Query Parameter Mismatches

#### GET `/api/customers` (list)
- **Missing**: `full` — spec supports expanded customer data via `full` param
- **Extra**: `project`, `globals` — these params are for activities, not customers

#### GET `/api/activities` (list)
- **Missing**: `projects[]` — spec supports filtering by multiple projects via array param (node only supports single `project`)

#### GET `/api/timesheets` (list)
- **Missing**: `users[]`, `customers[]`, `projects[]`, `activities[]`, `tags[]` — spec supports array versions of all filter params for multi-value filtering (node only supports single-value versions)

#### GET `/api/projects` (list)
- **Minor**: `customers[]` key has a leading quote in the node (`'customers[]'` instead of `customers[]`). This may cause the key to be sent with a literal quote character.

### 3. PATCH Body: Required Fields Made Optional

#### PATCH `/api/timesheets/{id}` (Update timesheet)
- The spec's `TimesheetEditForm` marks `project` and `activity` as **required**
- The node sends them as optional (`|| undefined`), which is reasonable for partial updates but technically deviates from the schema
- Note: The spec description says "you can pass all or just a subset of the attributes", so this is likely intentional

### 4. HTTP Method Note for Timesheet Actions

#### PATCH `/api/timesheets/{id}/stop`
- The spec defines **no request body** for the stop endpoint
- The node correctly sends no body ✓

#### PATCH `/api/timesheets/{id}/duplicate`
- The spec defines **no request body** for the duplicate endpoint
- The node correctly sends no body ✓

#### PATCH `/api/timesheets/{id}/export`
- The spec defines **no request body** for the export endpoint
- The node correctly sends no body ✓

---

## Info

### 5. Content-Type
All endpoints use `application/json` for both request and response. The node correctly sets `Content-Type: application/json` in `requestDefaults`. ✓

### 6. HTTP Methods
All node operations use the correct HTTP methods matching the spec:
- **GET**: List and single-item retrieval ✓
- **POST**: Create operations ✓
- **PATCH**: Update operations ✓
- **DELETE**: Delete operations ✓

### 7. URL Paths
All node URL paths match the spec endpoints:
- Collection endpoints: `/api/{resource}` ✓
- Single-item endpoints: `/api/{resource}/{id}` ✓
- Sub-resource endpoints: `/api/{resource}/{id}/{subresource}` ✓
- Action endpoints: `/api/{resource}/{id}/{action}` ✓

### 8. Request Body Fields — All Match

All POST/PATCH body fields match their respective spec schemas:

| Operation | Spec Schema | Status |
|-----------|-------------|--------|
| POST `/api/activities` | ActivityEditForm | ✓ All 12 fields match |
| PATCH `/api/activities/{id}` | ActivityEditForm | ✓ All 12 fields match |
| PATCH `/api/activities/{id}/meta` | inline {name, value} | ✓ Both fields match |
| POST `/api/activities/{id}/rates` | ActivityRateForm | ✓ All 4 fields match |
| POST `/api/customers` | CustomerEditForm | ✓ All 31 fields match |
| PATCH `/api/customers/{id}` | CustomerEditForm | ✓ All 31 fields match |
| PATCH `/api/customers/{id}/meta` | inline {name, value} | ✓ Both fields match |
| POST `/api/customers/{id}/rates` | CustomerRateForm | ✓ All 4 fields match |
| POST `/api/projects` | ProjectEditForm | ✓ All 18 fields match |
| PATCH `/api/projects/{id}` | ProjectEditForm | ✓ All 18 fields match |
| PATCH `/api/projects/{id}/meta` | inline {name, value} | ✓ Both fields match |
| POST `/api/projects/{id}/rates` | ProjectRateForm | ✓ All 4 fields match |
| POST `/api/tags` | TagEditForm | ✓ All 3 fields match |
| POST `/api/teams` | TeamEditForm | ✓ All 3 fields match |
| PATCH `/api/teams/{id}` | TeamEditForm | ✓ All 3 fields match |
| POST `/api/timesheets` | TimesheetEditForm | ✓ All 10 fields match |
| PATCH `/api/timesheets/{id}` | TimesheetEditForm | ✓ All 10 fields match |
| PATCH `/api/timesheets/{id}/meta` | inline {name, value} | ✓ Both fields match |
| PATCH `/api/timesheets/{id}/restart` | inline {copy, begin} | ✓ Both fields match |
| POST `/api/users` | UserCreateForm | ✓ All 14 fields match |
| PATCH `/api/users/{id}` | UserEditForm | ✓ All 11 fields match |
| PATCH `/api/users/{id}/preferences` | UserPreference[] | ✓ Sends raw body |

### 9. Operations Implemented (69 total)

| Resource | Operations |
|----------|-----------|
| Activity | create, delete, get, getAll, update, updateMeta, getRates, addRate, deleteRate |
| Customer | create, delete, get, getAll, update, updateMeta, getRates, addRate, deleteRate |
| Default | getConfig, getColors, ping, getVersion, getPlugins |
| Invoice | get, getAll |
| Project | create, delete, get, getAll, update, updateMeta, getRates, addRate, deleteRate |
| Tag | create, delete, getAll |
| Team | create, delete, get, getAll, update, addMember, removeMember, grantCustomer, revokeCustomer, grantProject, revokeProject, grantActivity, revokeActivity |
| Timesheet | create, delete, get, getAll, update, stop, restart, duplicate, toggleExport, updateMeta, getRecent, getActive |
| User | create, get, getAll, getMe, update, updatePreferences, deleteApiToken |

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 20 | Missing endpoints (comments, team assignments, approval bundle, invoice actions) |
| **Warning** | 5 | Query param mismatches + 1 optional field deviation |
| **Info** | 5 | Content-Type, HTTP methods, URL paths, body fields, operation count — all correct |

The node implementation is **well-structured** and covers the core CRUD operations for all major resources. The main gaps are in comments, approval workflows, and invoice-specific features.
