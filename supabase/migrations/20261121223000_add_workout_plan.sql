ALTER TABLE public.workout_schedules
  ADD COLUMN workout_plan text,
  ADD CONSTRAINT workout_plan_length CHECK (char_length(workout_plan) <= 5000);
