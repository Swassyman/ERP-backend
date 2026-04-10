-- 006_check_invitation_invited_by_membership.sql
--
-- soft-fk: invited_by must be a member of inviter organization

CREATE OR REPLACE FUNCTION check_invitation_invited_by_membership()
RETURNS TRIGGER AS $$
DECLARE
    inviter_managed_entity_id BIGINT;
BEGIN
    SELECT id into inviter_managed_entity_id
    FROM managed_entity
    WHERE managed_entity_type = 'organization'
    AND ref_id=NEW.inviter
    AND deleted_at IS NULL;

    IF inviter_managed_entity_id IS NULL THEN
        RAISE EXCEPTION
            'invitation: inviter organization % does not exist or is deleted',
            NEW.inviter;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM user_role
        WHERE id=NEW.invited_by
        AND managed_entity_id = inviter_managed_entity_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION
            'invitation: invited_by % is not a member of inviter organization %',
            NEW.invited_by,
            NEW.inviter;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_invitation_invited_by_membership ON event_organizer_invitation;

---split---
CREATE TRIGGER trg_check_invitation_invited_by_membership
BEFORE INSERT OR UPDATE OF invited_by, inviter
ON event_organizer_invitation
FOR EACH ROW EXECUTE FUNCTION check_invitation_invited_by_membership();
