# Police Dashboard: Status Update and Transfer Features

## Summary
Fixed the two critical police dashboard issues:
1. ✅ **Status change functionality** - Now fully functional with visible UI buttons
2. ✅ **Transfer to another officer** - Now implemented with modal for officer selection

## Changes Made

### Backend Changes

#### 1. New API Routes (`backend/src/routes/signalement.routes.js`)

**PATCH `/api/signalements/:id/statut`**
- Updates signalement status
- Accepts: `{ statut: "nouveau"|"en_cours"|"traite"|"transfere"|"closed" }`
- Response: `{ success: true, signalement: {...} }`
- Access: police, collaborateur, admin roles

**POST `/api/signalements/:id/transfert`**
- Transfers signalement to another police officer
- Accepts: `{ police_id: "officer_uuid" }`
- Validates officer exists and has police role
- Updates `assigned_to` column with new officer
- Response: `{ success: true, message: "...", notification: {...} }`
- Access: police, collaborateur, admin roles

#### 2. Database Migration (`database/migrations/010_add_assigned_to_column.sql`)
- Adds `assigned_to` column (VARCHAR 36) to store assigned officer UUID
- Adds `transferred_from` column for audit trail
- Creates indexes for performance on `assigned_to` and `transferred_from`

### Frontend Changes

#### Police Dashboard (`frontend/src/pages/police/dashboard.js`)

**New State Variables:**
- `policiers` - List of available police officers
- `showTransferModal` - Transfer modal visibility toggle
- `selectedPoliceToTransfer` - Currently selected officer for transfer
- `transferingSignalId` - ID of signalement being transferred

**New Functions:**
- `fetchPoliciers()` - Fetches all police officers from `/api/admin/users`, filters by role='police' and excludes current user

**Modified Functions:**
- `transferer(signalId, policeId)` - Now accepts police_id and:
  - Calls POST `/api/signalements/:id/transfert`
  - Updates status to 'transfere' via PATCH
  - Closes modal and refreshes signalements list
  - Shows success/error toast notifications

**UI Improvements:**
- Transfer button now opens modal instead of directly updating status
- Modal displays list of available police officers
- Officers are selectable with visual feedback (blue highlight)
- Cancel and Transfer buttons with proper validation
- Transfer button disabled until officer is selected

#### Modal UI
```
Modal Title: "Transférer le dossier"
Content:
  - Text: "Sélectionnez l'officier de police qui doit recevoir ce dossier :"
  - Officer List:
    - Each officer shows: 👮 Firstname Lastname
    - Shows email below name
    - Clickable with blue highlight on selection
  - Buttons: Cancel | Transfer (disabled if no officer selected)
```

## How It Works

### Status Change
1. Police officer clicks status button (En cours, Traité, Transférer)
2. Status immediately updates and refreshed list
3. Toast notification shows success/error

### Transfer to Another Officer
1. Police officer clicks "Transférer" button
2. Modal opens showing all other police officers available
3. Officer selects target officer (highlights in blue)
4. Clicks "Transférer" button
5. Backend assigns dossier to new officer and updates status to 'transfere'
6. Dossier disappears from current officer's list
7. New officer receives toast notification via socket
8. Audit trail recorded in `transferred_from` column

## Database Schema Changes

**signal_moi.signalements table:**
```sql
ALTER TABLE signal_moi.signalements ADD COLUMN assigned_to VARCHAR(36);
ALTER TABLE signal_moi.signalements ADD COLUMN transferred_from VARCHAR(36);
CREATE INDEX idx_signalements_assigned_to ON signal_moi.signalements(assigned_to);
CREATE INDEX idx_signalements_transferred_from ON signal_moi.signalements(transferred_from);
```

## API Endpoints

### Update Status
```
PATCH /api/signalements/:id/statut
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "statut": "en_cours" | "traite" | "transfere" | "closed"
}

Response:
{
  "success": true,
  "signalement": {
    "id": "uuid",
    "statut": "en_cours",
    ...
  }
}
```

### Transfer Signalement
```
POST /api/signalements/:id/transfert
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "police_id": "officer_uuid"
}

Response:
{
  "success": true,
  "message": "Dossier transféré à Firstname Lastname",
  "notification": {
    "signalement_id": "uuid",
    "transferred_by": {...},
    "transferred_to": {...},
    "titre": "...",
    "type": "violence|vol|..."
  }
}
```

## Migration Execution

All migrations were successfully executed on production database:
- ✅ 010_add_assigned_to_column.sql

Command: `powershell -File run-transfer-migration.ps1`
Status: ✅ Success

## Testing Checklist

- [ ] Police officer can see status change buttons in signalement details
- [ ] Status changes from "Nouveau" → "En cours" → "Traité" work correctly
- [ ] Transfer button opens modal with list of officers
- [ ] Officer can select another officer from modal
- [ ] Selected officer is highlighted in blue
- [ ] Transfer button executes transfer and closes modal
- [ ] Transferred signalement appears in new officer's list
- [ ] Original officer no longer sees transferred signalment
- [ ] Toast notifications display for success/error
- [ ] assigned_to column is updated in database

## Files Modified
1. `backend/src/routes/signalement.routes.js` - Added PATCH and POST routes
2. `frontend/src/pages/police/dashboard.js` - Added modal UI and transfer logic
3. `database/migrations/010_add_assigned_to_column.sql` - Added columns

## Compatibility
- Backward compatible - existing signalements still work
- No breaking changes to existing APIs
- New routes are isolated to transfer feature
