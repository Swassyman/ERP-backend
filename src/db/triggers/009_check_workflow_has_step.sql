-- 009_check_workflow_has_step.sql
--
-- prevent assigning a workflow to an event_type if the workflow has no steps

CREATE OR REPLACE FUNCTION check_workflow_has_step()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM workflow_template_step
        WHERE workflow_id = NEW.workflow_id
    ) THEN
        RAISE EXCEPTION
            'workflow_template % must have at least one step before being assigned',
            NEW.workflow_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_workflow_has_step ON event_type;

---split---
CREATE TRIGGER trg_check_workflow_has_step
BEFORE INSERT OR UPDATE OF workflow_id
ON event_type
FOR EACH ROW EXECUTE FUNCTION check_workflow_has_step();
