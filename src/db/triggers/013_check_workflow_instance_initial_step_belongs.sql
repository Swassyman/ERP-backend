-- 013_check_workflow_instance_initial_step_belongs.sql
--
-- prevent setting initial_step_id to a step from another workflow_instance

CREATE OR REPLACE FUNCTION check_workflow_instance_initial_step_belongs()
RETURNS TRIGGER AS $$
DECLARE
    step_workflow_instance_id BIGINT;
BEGIN
    IF NEW.initial_step_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT workflow_instance_id INTO step_workflow_instance_id
    FROM workflow_instance_step
    WHERE id = NEW.initial_step_id;

    IF step_workflow_instance_id != NEW.id THEN
        RAISE EXCEPTION
            'workflow_instance: initial_step % belongs to workflow_instance %, not %',
            NEW.initial_step_id,
            step_workflow_instance_id,
            NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_workflow_instance_initial_step_belongs ON workflow_instance;

---split---
CREATE TRIGGER trg_check_workflow_instance_initial_step_belongs
BEFORE INSERT OR UPDATE OF initial_step_id
ON workflow_instance
FOR EACH ROW EXECUTE FUNCTION check_workflow_instance_initial_step_belongs();
