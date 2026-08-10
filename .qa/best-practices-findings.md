# n8n Community Node Best Practices Findings

**Date**: 2026-08-10  
**Scope**: Review of the Kimai node against n8n community node best practices

---

## Critical Issues

### 1. Missing `options` for `visible` in GET `/api/customers` and GET `/api/projects`
- The spec uses `visible` with values `1=visible, 2=hidden, 3=both` for customers and projects
- The node uses `1=visible, 2=hidden, 3=all` for activities and `1=visible, 2=hidden, 3=both` for customers/projects
- This is correct but the `getAll` operations for customers use `Both` instead of `All` which is inconsistent

### 2. Query Parameter Issues
- **GET `/api/customers` (list)**: Missing `full` query parameter — spec supports expanded customer data via `full` param
- **GET `/api/customers` (list)**: Has extra `project` and `globals` params that belong to activities, not customers — this is incorrect
- **GET `/api/projects` (list)**: The `customers[]` key has a leading quote (`'customers[]'`) which may cause the key to be sent with a literal quote character
- **GET `/api/activities` (list)**: Missing `projects[]` array parameter — spec supports filtering by multiple projects

---

## Warnings

### 3. Missing Endpoints (from API audit)
The node is missing 20 endpoints that should be supported for completeness:
- Comments for customers and projects (GET, POST, DELETE, PATCH pin)
- Team assignments for activities, customers, and projects (POST)
- Invoice actions (PATCH custom-fields, GET download)
- Approval bundle endpoints (GET next-week, overtime_year, week-status, weekly_overtime; POST add_to_approve)

### 4. Node Version
- The node uses `version: 1` — consider bumping to `1.1` or `2.0` when adding new features to allow for migration

### 5. Group Classification
- The node uses `group: ['transform']` — consider using `group: ['social']` or `group: ['action']` as this is more of an integration node than a data transformation node

---

## Info

### 6. Credentials File
- Credentials file follows best practices with proper structure ✓
- Uses Bearer token authentication correctly ✓
- Test request uses `/api/ping` endpoint ✓
- `documentationUrl` points to Kimai REST API docs ✓

### 7. Package Configuration
- `package.json` has correct `n8n` object structure ✓
- `n8nNodesApiVersion: 1` ✓
- `keywords` includes `n8n-community-node-package` ✓
- `peerDependencies` includes `n8n-workflow` ✓
- `files` includes `dist` ✓

### 8. Node Structure
- Uses declarative style with routing embedded in property definitions ✓
- Proper `INodeType` and `INodeTypeDescription` imports ✓
- All required description fields present (displayName, name, icon, group, version, subtitle, description, defaults) ✓
- `inputs` and `outputs` set to `['main']` ✓
- `credentials` array properly configured ✓

### 9. Parameter Definitions
- Resource/operation pattern followed consistently ✓
- `noDataExpression: true` set on resource/operation options ✓
- `action` descriptions set on operations ✓
- `required: true` set on required fields ✓
- `default` values provided for all parameters ✓
- Parameter types are correct (string, number, boolean, options, dateTime, json) ✓

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **Critical** | 2 | Query parameter issues (wrong params for customers, missing params) |
| **Warning** | 3 | Missing endpoints, version bump needed, group classification |
| **Info** | 4 | Credentials, package config, node structure, parameters — all correct |
