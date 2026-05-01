-- 014_check_workflow_instance_step_next_belongs.sql
--
-- prevent linking steps across different workflow_instances

CREATE OR REPLACE FUNCTION check_workflow_instance_step_next_belongs()
RETURNS TRIGGER AS $$
DECLARE
    next_step_workflow_instance_id BIGINT;
BEGIN
    IF NEW.next_step_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT workflow_instance_id INTO next_step_workflow_instance_id
    FROM workflow_instance_step
    WHERE id = NEW.next_step_id;

    IF next_step_workflow_instance_id != NEW.workflow_instance_id THEN
        RAISE EXCEPTION
            'workflow_instance_step: next_step % belongs to workflow_instance %, not %',
            NEW.next_step_id,
            next_step_workflow_instance_id,
            NEW.workflow_instance_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_workflow_instance_step_next_belongs ON workflow_instance_step;

---split---
CREATE TRIGGER trg_check_workflow_instance_step_next_belongs
BEFORE INSERT OR UPDATE OF next_step_id
ON workflow_instance_step
FOR EACH ROW EXECUTE FUNCTION check_workflow_instance_step_next_belongs();
