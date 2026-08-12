# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-12

### Changed
- **Internal SDK integration**: Refactored all 87 operations to use `node-kimai` SDK instead of direct HTTP calls
  - Added `sdk-wrapper.ts` with typed `KimaiSdk` class wrapping all SDK operations
  - Replaced direct `this.helpers.httpRequest()` calls in helpers.ts with SDK methods
  - Added `execute()` method to route operations through SDK while preserving descriptor-based UI
- **Dependency**: Added `node-kimai` as a runtime dependency

### Technical Details
- No breaking changes to node interface — all resource/operation names and parameters preserved
- Improved type safety and maintainability via shared SDK
- Binary data handling for invoice downloads now uses SDK's `ArrayBuffer` response

## [1.2.0] - 2026-08-10

### Added
- **18 new API endpoints** across 5 resources:
  - **Customer**: Get Comments, Add Comment, Delete Comment, Toggle Pin Comment
  - **Project**: Get Comments, Add Comment, Delete Comment, Toggle Pin Comment
  - **Invoice**: Update Custom Fields, Download
  - **Approval**: Get Next Week, Get Overtime Year, Get Week Status, Get Weekly Overtime, Add to Approve
  - **Activity**: Add Team
  - **Customer**: Add Team
  - **Project**: Add Team
- **Modular descriptor architecture**: Refactored from a single 4113-line file into 12 focused descriptor files under `nodes/Kimai/descriptors/`
- **Node version 2**: Added support for n8n-workflow API version 2 alongside version 1

### Changed
- **Architecture**: Moved from monolithic `Kimai.node.ts` to a modular descriptor-based structure
  - Each resource now has its own file (activity.ts, customer.ts, project.ts, etc.)
  - Shared utilities extracted to `common.ts`
  - Type definitions centralized in `types.ts`
  - Main node file reduced from 4113 lines to 131 lines
- **Total operations**: Increased from 69 to 87 operations across 9 resources

### Fixed
- Query parameter handling for optional values (empty strings no longer sent to API)
- Array parameter filtering for list endpoints
- PATCH request body handling for budget fields (preserves zero values)
- All codex feedback items addressed

## [1.1.0] - 2026-08-09

### Changed
- **Aligned to Kimai API v1.1 specification**
- Customer address fields renamed from snake_case to camelCase: `address_line1` → `addressLine1`, `address_line2` → `addressLine2`, `address_line3` → `addressLine3`, `postcode` → `postCode`
- Activity `teams` parameter changed from single integer to array of integers (`json` type)

### Added
- **Customer**: `language` (required), `invoiceEmail`, `teams`, `budget`, `timeBudget`, `budgetType`
- **Activity**: `budget`, `timeBudget`, `budgetType`
- **Project**: `teams`, `budget`, `timeBudget`, `budgetType`
- Catalan (`ca`) added to language enum
- UI parameters for all new fields

### Fixed
- Query parameters now use `|| undefined` for optional values to prevent sending empty strings (fixes 500 errors on list endpoints)
- PATCH requests use `?? undefined` for budget to preserve zero values
- Array query routes (`projects[]`, `customers[]`, `activities[]`, `users[]`, `tags[]`) filter empty strings
- Global Activities filter preserves `false` value

## [1.0.3] - 2024-12-02

### Added
- Added `teams` field to Activity create/update operations to support team assignment
- Added test infrastructure with Jest and ts-jest
- Added test scripts: `test`, `test:watch`, `test:coverage`

### Fixed
- Fixed `exported` parameter semantics in Timesheet create and update operations
- Changed from nullish coalescing (`?? undefined`) to logical OR (`|| undefined`) to properly omit default `false` values
- Prevents `exported: false` from being sent when user hasn't explicitly set the value
- Ensures both POST (create) and PATCH (update) requests only include fields that are explicitly set
- Fixed test assertions that incorrectly checked for `bodyContentType` property (not supported by n8n-workflow)
- Content-Type headers are properly set via `requestDefaults` at the node level

### Testing
- All 248 tests passing
- Full coverage of all 9 resources and 60+ operations
- Verified implementation matches Kimai API specification v1.1

## [1.0.2] - 2024-12-02

### Fixed
- Fixed "This form should not contain extra fields" validation error when creating/updating resources
- All create and update operations now properly filter out empty/undefined optional fields
- Applied fix to all resources: Activity, Customer, Project, Tag, Team, Timesheet, User
- Boolean fields now use nullish coalescing to preserve explicit `false` values
- Rate operations now properly handle optional fields

## [1.0.1] - 2024-12-02

### Fixed
- Fixed 400 Bad Request error when using "Get all activities" operation
- Removed duplicate `projects[]` query parameter that was causing parameter conflicts
- Optional query parameters (`project`, `term`) now only sent when they have values to prevent API rejection of empty parameters

## [1.0.0] - 2024-12-02

### Added
- Initial release of n8n-nodes-kimai-pro
- Full API coverage for Kimai time-tracking software
- Support for 9 resources:
  - Activity (CRUD, rates, meta fields)
  - Customer (CRUD, rates, meta fields)
  - Project (CRUD, rates, meta fields)
  - Tag (Create, Get All, Delete)
  - Team (CRUD, member management, access control)
  - Timesheet (CRUD, stop/restart/duplicate/export, meta fields, recent/active)
  - User (CRUD, preferences, API token management)
  - Invoice (Read operations)
  - Default (Config, colors, ping, version, plugins)
- 60+ operations covering all public Kimai API endpoints
- Declarative routing style for clean, maintainable code
- Bearer token authentication
- Query parameter support (filtering, sorting, pagination, search)
- Array parameter handling (projects[], customers[], activities[], users[], tags[])
- Date-time field support for timesheet operations
- Meta field updates for activities, customers, projects, timesheets
- Rate management for activities, customers, projects
- Team access control (customers, projects, activities)
- User preferences and API token management
- Official Kimai SVG icon
- Comprehensive documentation

### Technical Details
- Built with n8n-workflow API version 1
- TypeScript implementation
- ES2020 target
- CommonJS module format

[1.2.0]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.2.0
[1.1.0]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.1.0
[1.0.3]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.0.3
[1.0.2]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.0.2
[1.0.1]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.0.1
[1.0.0]: https://github.com/msoukhomlinov/n8n-nodes-kimai-pro/releases/tag/v1.0.0
