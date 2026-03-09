-- 004_check_user_role_entity_type.sql
--
-- roles belong to a managed entity type. does the role assignment belong under
-- the same type of entity

CREATE OR REPLACE FUNCTION check_user_role_entity_type()
RETURNS TRIGGER AS $$
DECLARE
    entity_type managed_entity_type;
    role_entity_type managed_entity_type;
BEGIN
	-- Make sure managed entity exists
    SELECT managed_entity_type INTO entity_type
    FROM managed_entity
    WHERE id = NEW.managed_entity_id
    AND deleted_at IS NULL;

    IF entity_type IS NULL THEN
        RAISE EXCEPTION
            'user_role: managed_entity % does not exist or is deleted',
            NEW.managed_entity_id;
    END IF;

    -- Get the entity type the role belongs to:
    SELECT managed_entity_type INTO role_entity_type
    FROM role
    WHERE id = NEW.role_id
    AND deleted_at IS NULL;

    IF role_entity_type IS NULL THEN
        RAISE EXCEPTION
            'user_role: role % does not exist or is deleted',
            NEW.role_id;
    END IF;

    IF entity_type != role_entity_type THEN
        RAISE EXCEPTION
            'user_role: managed_entity type "%" does not match role type "%"',
            entity_type,
            role_entity_type;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_user_role_entity_type ON user_role;

---split---
CREATE TRIGGER trg_check_user_role_entity_type
BEFORE INSERT OR UPDATE OF managed_entity_id, role_id
ON user_role
FOR EACH ROW EXECUTE FUNCTION check_user_role_entity_type();
