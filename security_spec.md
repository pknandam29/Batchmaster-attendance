# Security Specification: BatchMaster Attendance

## 1. Data Invariants
- A Batch must have a name (max 100 chars) and a start date.
- A Student cannot exist without a valid batchId.
- A Session belongs to a batch and has a sessionNumber (1-12).
- Attendance records must link a valid student, session, and batch.
- Only admins can create/delete batches.
- Trainers can manage students and mark attendance for batches they are assigned (for simplicity, we'll allow trainers to manage all for now, or implement an assignment system if needed).
- Users can only see their own profile in the `users` collection. PII like email is sensitive.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a student with a fake `authorId` or `creatorId` if we added one. (Rejected by `request.auth.uid` check).
2. **Resource Poisoning**: Create a batch with a 1MB name string. (Rejected by `.size() <= 100`).
3. **Ghost Field Update**: Update a student with an extra field `isVerified: true`. (Rejected by `affectedKeys().hasOnly()`).
4. **Invalid Batch Linking**: Create a student referencing a non-existent batchId. (Rejected by `exists()`).
5. **Session Number Overflow**: Create a session with `sessionNumber: 13`. (Rejected by `sessionNumber >= 1 && sessionNumber <= 12`).
6. **Attendance Status Poisoning**: Set attendance status to "present-maybe". (Rejected by `enum ["present", "absent"]`).
7. **Role Escalation**: A trainer trying to change their role to "admin" in `users/userId`. (Rejected by immutable role check).
8. **Unauthorized Batch Deletion**: A non-admin trying to delete a batch. (Rejected by `isAdmin()`).
9. **Backdated Record**: Creating an attendance record with a client-side `markedAt` in the past. (Rejected by `request.time` check).
10. **Cross-Batch Attendance**: Marking attendance for a student in a session that belongs to a DIFFERENT batch. (Rejected by relational check).
11. **PII Leak**: An authenticated user trying to list all `users` or read another user's profile. (Rejected by `isOwner()` or `isAdmin()`).
12. **Batch Invariant Break**: Updating a batch name once it's completed (if we added a terminal status).

## 3. The Test Runner (Draft)
The `firestore.rules.test.ts` will verify these payloads.
