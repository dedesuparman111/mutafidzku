
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS students_user_code_uniq ON public.students(user_id, code);

CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  prefix TEXT := to_char(now(), 'YYMM');
  next_seq INT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    SELECT COALESCE(MAX(SUBSTRING(code FROM 5 FOR 4)::INT), 0) + 1
      INTO next_seq
      FROM public.students
     WHERE user_id = NEW.user_id AND code LIKE prefix || '%';
    NEW.code := prefix || LPAD(next_seq::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_students_code ON public.students;
CREATE TRIGGER trg_students_code BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_code();

-- Backfill existing rows
DO $$
DECLARE r RECORD; seq INT;
BEGIN
  FOR r IN SELECT user_id FROM public.students WHERE code IS NULL GROUP BY user_id LOOP
    seq := 0;
    FOR r IN SELECT id, to_char(created_at, 'YYMM') AS pfx FROM public.students
             WHERE user_id = r.user_id AND code IS NULL ORDER BY created_at LOOP
      seq := seq + 1;
      UPDATE public.students SET code = r.pfx || LPAD(seq::TEXT, 4, '0') WHERE id = r.id;
    END LOOP;
  END LOOP;
END $$;
