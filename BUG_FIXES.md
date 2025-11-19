# Bug Fixes Summary

## Issues Identified

### 1. **RLS Policy Violation** ❌
**Error:** `new row violates row-level security policy for table "conversations"`

**Root Cause:** The `createConversation` hook was not including `user_id` when inserting a conversation. The RLS policy requires `auth.uid() = user_id`, but since no `user_id` was being sent, the policy check failed.

**Fix:** Updated `useConversations.ts` to:
- Fetch the authenticated user's ID using `supabase.auth.getUser()`
- Include `user_id: user.id` in the insert statement
- Gracefully fall back to local-only conversations when authentication fails

### 2. **Invalid UUID Format** ❌
**Error:** `invalid input syntax for type uuid: "local-1763497287039-cz45xfll37q"`

**Root Cause:** Local fallback conversation IDs were being sent to the database and rejected because they don't conform to UUID format.

**Fix:** 
- The fix in issue #1 addresses this by ensuring only authenticated users with proper UUIDs are persisted to Supabase
- Local conversations are kept local only and won't attempt to persist invalid IDs to the database

### 3. **Edge Function Payload Mismatch** ❌
**Error:** `LLM call failed, returning mock reply - Edge Function returned a non-2xx status code`

**Root Cause:** The `useChat.ts` hook was sending the wrong payload format:
- **Sent:** `{ conversation_id: string, message: string }`
- **Expected by Edge Function:** `{ messages: Array<{ role: string, content: string }> }`

**Fix:** Updated `useChat.ts` to:
- Format messages as an array of message objects with `role` and `content` properties
- Properly parse the response from the Edge Function
- Extract content from the Gemini API response format

### 4. **RLS Policies Need Update** (Optional)
**File:** `supabase/migrations/20251119_update_rls_policies.sql`

Created new migration to update RLS policies to support both:
- Authenticated users (normal operation)
- Anonymous/local users (client-side only)

---

## Files Modified

1. **`mobile/src/hooks/useConversations.ts`**
   - Added user authentication check before creating conversations
   - Includes `user_id` in insert statement
   - Maintains local fallback for offline mode

2. **`mobile/src/hooks/useChat.ts`**
   - Fixed Edge Function payload format
   - Corrected message array structure
   - Better response parsing

3. **`supabase/migrations/20251119_update_rls_policies.sql`** (new file)
   - Optional: Updates RLS policies for better support of different user types

---

## Testing Steps

1. **Test Authenticated Flow:**
   - Sign in with email/magic link
   - Create a new conversation → should succeed
   - Send a message → should receive AI response (if GEMINI_API_KEY is set)

2. **Test Local/Offline Flow:**
   - Skip authentication (proceed anonymously)
   - Create conversation → fallback to local storage
   - Send message → should receive mock response

3. **Monitor Console Logs:**
   - Look for `DBG:` logs to verify flow
   - Check for `WARN:` logs indicating fallback scenarios
