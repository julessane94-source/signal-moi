# Admin Deletion with Notifications Feature

## Overview

This feature allows administrators to delete signalements (citizen reports) and campaigns while automatically notifying affected users via email.

## Endpoints

### 1. Delete Signalement

**Endpoint:** `DELETE /api/admin/signalements/:id`

**Authentication:** Required (Admin role)

**Purpose:** Delete a specific signalement and notify its creator

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/signalements/123 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Content violates community guidelines"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Explanation of why the signalement was deleted |

**Successful Response (200):**
```json
{
  "success": true,
  "message": "Signalement supprimé et notification envoyée"
}
```

**Error Responses:**
- `404`: Signalement not found
- `401`: Unauthorized (not an admin)
- `500`: Server error

**What happens:**
1. Validates admin authorization
2. Retrieves the signalement and creator's email
3. Deletes the signalement from database
4. Sends notification email to creator
5. Returns success message

---

### 2. Delete Campaign

**Endpoint:** `DELETE /api/admin/campagnes/:id`

**Authentication:** Required (Admin role)

**Purpose:** Delete a specific campaign and notify all participants

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/admin/campagnes/456 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Campaign has reached its goal"
  }'
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Explanation of why the campaign was deleted |

**Successful Response (200):**
```json
{
  "success": true,
  "message": "Campagne supprimée et 15 notification(s) envoyée(s)"
}
```

**Error Responses:**
- `404`: Campaign not found
- `401`: Unauthorized (not an admin)
- `500`: Server error

**What happens:**
1. Validates admin authorization
2. Retrieves campaign information
3. Queries all users inscribed in the campaign
4. Deletes the campaign (cascades to remove inscriptions)
5. Sends notification email to all inscribed users
6. Returns success message with count of notifications sent

---

## Email Notifications

### Signalement Deletion Email

**To:** Creator of the signalement

**Subject:** ⚠️ Votre signalement a été supprimé

**Template Variables:**
- `name`: Creator's full name
- `titre`: Title of the deleted signalement
- `reason`: Reason provided by admin
- `contactEmail`: Contact email for appeals

**Template:** `signalement-deleted`

---

### Campaign Deletion Email

**To:** All users inscribed in the campaign

**Subject:** ⚠️ Une campagne a été supprimée

**Template Variables:**
- `name`: User's full name
- `titre`: Title of the deleted campaign
- `reason`: Reason provided by admin
- `contactEmail`: Contact email for questions

**Template:** `campagne-deleted`

---

## Implementation Details

### Database Queries

**For Signalements:**
```sql
-- Get signalement and creator email
SELECT s.id, s.titre, u.email, u.prenom, u.nom 
FROM signal_moi.signalements s
LEFT JOIN signal_moi.users u ON u.id = s.user_id
WHERE s.id = $1;

-- Delete signalement
DELETE FROM signal_moi.signalements WHERE id = $1;
```

**For Campaigns:**
```sql
-- Get campaign
SELECT id, titre FROM signal_moi.campagnes WHERE id = $1;

-- Get inscribed users
SELECT DISTINCT u.email, u.prenom, u.nom
FROM signal_moi.inscriptions_campagnes ic
JOIN signal_moi.users u ON u.id = ic.user_id
WHERE ic.campagne_id = $1;

-- Delete campaign (CASCADE removes inscriptions)
DELETE FROM signal_moi.campagnes WHERE id = $1;
```

### Error Handling

- **Email Failures:** Non-blocking - deletion completes even if email fails
- **Missing Emails:** Users without emails are silently skipped
- **Multiple Notifications:** All notifications sent in parallel with `Promise.all()`
- **Invalid IDs:** Returns 404 error
- **Unauthorized Access:** Returns 401 error

### Logging

All operations are logged with prefixes:
- `[ADMIN DELETE /signalements/:id]` - Signalement deletion logs
- `[ADMIN DELETE /campagnes/:id]` - Campaign deletion logs
- Email errors are logged but don't interrupt the main operation

---

## Testing

### Using the Test Script

```powershell
# Run the test script
.\test-deletion-endpoints.ps1
```

The script:
1. Logs in as admin
2. Tests signalement deletion
3. Tests campaign deletion
4. Verifies authentication is required
5. Tests error cases (non-existent IDs)

### Manual Testing with Postman/curl

1. Get an admin token via login
2. Call DELETE endpoint with token in Authorization header
3. Verify response and check email inbox
4. Confirm data is deleted from database

---

## Security Considerations

- ✅ Admin authentication required (checked by `authMiddleware`)
- ✅ Email failures don't expose internal errors to users
- ✅ Deletion is permanent (hard delete) - consider audit logging if needed
- ✅ Cascade deletion works correctly for campaigns and inscriptions
- ✅ Email content sanitized (using template system)

---

## Future Enhancements

1. **Soft Delete:** Consider using `is_deleted` flag for audit trail
2. **Audit Log:** Track who deleted what and when
3. **Bulk Operations:** Allow deleting multiple items at once
4. **Custom Messages:** Let admins customize notification text per deletion
5. **Confirmation:** Require confirmation for high-impact deletions
6. **Admin Dashboard UI:** Add delete buttons to admin dashboard
