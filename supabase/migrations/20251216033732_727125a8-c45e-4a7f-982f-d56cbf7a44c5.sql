-- Fix profile business_id for users who have roles but null business_id
UPDATE profiles p
SET business_id = ur.business_id
FROM user_roles ur
WHERE p.id = ur.user_id
AND p.business_id IS NULL;