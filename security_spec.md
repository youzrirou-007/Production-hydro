# HydroMines Security Specification

## Data Invariants
1. Production records must be linked to a site assigned to the user (unless Admin/Direction).
2. Users can only modify their own profile (except Admin).
3. Audit logs are append-only for everyone (in theory, but mostly system-written).
4. Maintenance orders must link to a valid engine.
5. Stocks are site-specific.

## The "Dirty Dozen" Payloads (Deny cases)
1. Secretary trying to access a site they aren't assigned to.
2. User trying to change their own role to 'admin'.
3. Deleting an audit log.
4. Production record with negative meterage.
5. Production record with fuel consumption > 1,000,000.
6. Updating a validated production record (terminal state lock).
7. Creating a site without being an admin.
8. Fetching all users' private info as a secretary.
9. Injecting a 2MB string into 'remarks'.
10. Spoofing `operatorId` in production records.
11. Changing `createdAt` on an existing document.
12. Accessing data without verification (email_verified).

## Test Runner (Verifying Fortress Rules)
(Implementation of tests would go here in a real environment, but for now I'll focus on the rules).
