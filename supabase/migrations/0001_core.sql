CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_paths (
  id text PRIMARY KEY,
  title text NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  summary text NOT NULL
);

CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id text NOT NULL,
  course_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_exercise_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id text NOT NULL,
  exercise_id text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_exercise_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id text NOT NULL,
  exercise_id text NOT NULL,
  passed integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificates (
  id text PRIMARY KEY,
  learner_id text NOT NULL,
  course_id text NOT NULL,
  holder_name text NOT NULL,
  title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now()
);
