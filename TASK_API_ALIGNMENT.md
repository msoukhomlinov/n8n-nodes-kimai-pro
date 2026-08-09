
# API Alignment Changes for Kimai v1.1

## File to Edit: `nodes/Kimai/Kimai.node.ts`

### 1. Customer Create - Fix Address Field Names
The API changed from snake_case to camelCase for address fields:
- `address_line1` → `addressLine1`
- `address_line2` → `addressLine2`
- `address_line3` → `addressLine3`
- `postcode` → `postCode`

Current body (around line 220):
```js
body: {
    address_line1: '={{$parameter["addressLine1"] || undefined}}',
    address_line2: '={{$parameter["addressLine2"] || undefined}}',
    address_line3: '={{$parameter["addressLine3"] || undefined}}',
    postcode: '={{$parameter["postcode"] || undefined}}',
```

Should be:
```js
body: {
    addressLine1: '={{$parameter["addressLine1"] || undefined}}',
    addressLine2: '={{$parameter["addressLine2"] || undefined}}',
    addressLine3: '={{$parameter["addressLine3"] || undefined}}',
    postCode: '={{$parameter["postcode"] || undefined}}',
```

Also add new fields: `language` (required), `invoiceEmail`, `teams` (array), `budget`, `timeBudget`, `budgetType`

### 2. Customer Update - Same Address Field Fix
Same snake_case → camelCase change in the update body.

### 3. Activity Create - Fix `teams` Type
`teams` changed from integer to array of integers. Add new budget fields.

### 4. Activity Update - Same `teams` Fix

### 5. Project Create/Update - Add New Fields
Add `teams` (array), `budget`, `timeBudget`, `budgetType` to create and update bodies.

### 6. Query Parameter Fixes (causes 500 errors)
Several "Get All" operations send empty strings for unset params. Fix by adding `|| undefined`:

- **Project Get All**: `customer`, `visible`, `start`, `end`, `ignoreDates`, `globalActivities`, `order`, `orderBy`, `term` should use `|| undefined` for optional params
- **Activity Get All**: Similar fix
- **Customer Get All**: Similar fix
- **Timesheet Get All**: Similar fix
- **User Get All**: Similar fix

### 7. Customer Get All - Add `language` Default
For the customer create operation, `language` is now required. Add a default value.

### 8. Language Enum Update
Add `ca` (Catalan) to the language enum in user create/edit and customer create/edit.

## Test Files to Update
All test files in `test/nodes/Kimai/resources/` need to be updated to reflect the new field names and added fields.
