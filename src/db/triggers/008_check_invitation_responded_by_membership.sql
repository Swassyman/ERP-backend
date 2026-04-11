-- 008_check_invitation_responded_by_membership.sql
--
-- soft-fk: responded_by_user_id must be a member of recipient_organization

CREATE OR REPLACE FUNCTION check_invitation_responded_by_membership()
RETURNS TRIGGER AS $$
DECLARE
    recipient_organization_entity_id BIGINT;
BEGIN
    IF NEW.responded_by_user_id IS NULL THEN
    RETURN NEW;
    END IF;

    SELECT id into recipient_organization_entity_id
    FROM managed_entity
    WHERE managed_entity_type = 'organization'
    AND ref_id=NEW.recipient_organization_id
    AND deleted_at IS NULL;

    IF recipient_organization_entity_id IS NULL THEN
        RAISE EXCEPTION
            'invitation: recipient organization % does not exist or is deleted',
            NEW.recipient_organization_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM user_role
        WHERE id=NEW.responded_by_user_id
        AND managed_entity_id = recipient_organization_entity_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'invitation: responded_by_user_id % is not a member of recipient organization %',
            NEW.responded_by_user_id,
            NEW.recipient_organization_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_invitation_responded_by_membership ON event_organizer_invitation;

---split---
CREATE TRIGGER trg_check_invitation_responded_by_membership
BEFORE INSERT OR UPDATE OF responded_by_user_id, recipient_organization_id
ON event_organizer_invitation
FOR EACH ROW EXECUTE FUNCTION check_invitation_responded_by_membership();
