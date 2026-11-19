/*
# Make student phone optional for testing access

1. Modified Tables
- `students.phone`: allows NULL so a student can complete registration without providing a phone number.

2. Application Behavior
- Students may leave the phone field empty during registration.
- When no phone is provided, the account uses the normalized full name as its test login identifier.
- Existing phone numbers and existing student records remain unchanged.

3. Security
- No row access rules are changed.
- Student data remains protected by the existing authenticated ownership and administration policies.

4. Important Notes
- The name-based identifier is intended for this test flow and should be replaced by a stronger unique login method before production use.
*/

ALTER TABLE public.students
  ALTER COLUMN phone DROP NOT NULL;
