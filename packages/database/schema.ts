import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid().primaryKey(),
  email: text().notNull(),
  displayName: text("display_name").notNull(),
});

export const learningPaths = pgTable("learning_paths", {
  id: text().primaryKey(),
  title: text().notNull(),
});

export const courses = pgTable("courses", {
  id: text().primaryKey(),
  title: text().notNull(),
  summary: text().notNull(),
});

export const enrollments = pgTable("user_course_enrollments", {
  id: uuid().defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull(),
  courseId: text("course_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exerciseAttempts = pgTable("user_exercise_attempts", {
  id: uuid().defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  status: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const exerciseProgress = pgTable("user_exercise_submissions", {
  id: uuid().defaultRandom().primaryKey(),
  learnerId: text("learner_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  passed: integer().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: text().primaryKey(),
  learnerId: text("learner_id").notNull(),
  courseId: text("course_id").notNull(),
  holderName: text("holder_name").notNull(),
  title: text().notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
});
