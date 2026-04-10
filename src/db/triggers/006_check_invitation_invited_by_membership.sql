    -- 006_check_invitation_invited_by_membership.sql
    --
    -- soft-fk: invited_by_user_id must be a member of sender_organization

    CREATE OR REPLACE FUNCTION check_invitation_invited_by_membership()
    RETURNS TRIGGER AS $$
    DECLARE
        sender_organization_entity_id BIGINT;
    BEGIN
        SELECT id into sender_organization_entity_id
        FROM managed_entity
        WHERE managed_entity_type = 'organization'
        AND ref_id=NEW.sender_organization_id
        AND deleted_at IS NULL;

        IF sender_organization_entity_id IS NULL THEN
            RAISE EXCEPTION
                'invitation: sender organization % does not exist or is deleted',
                NEW.sender_organization_id;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM user_role
            WHERE id=NEW.invited_by_user_id
            AND managed_entity_id = sender_organization_entity_id
            AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION
                'invitation: invited by user id % is not a member of sender organization %',
                NEW.invited_by_user_id,
                NEW.sender_organization_id;
        END IF;

        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    ---split---
    DROP TRIGGER IF EXISTS trg_check_invitation_invited_by_membership ON event_organizer_invitation;

    ---split---
    CREATE TRIGGER trg_check_invitation_invited_by_membership
    BEFORE INSERT OR UPDATE OF invited_by_user_id, sender_organization_id
    ON event_organizer_invitation
    FOR EACH ROW EXECUTE FUNCTION check_invitation_invited_by_membership();
