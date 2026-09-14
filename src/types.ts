export interface Profile {
  name: string;
  unit: 'kg' | 'lbs';
  weight?: number;
  height?: number;
  activeRoutineId?: string;
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  defaultSets: number;
  defaultReps: string; // e.g. "8-12", "5", "10-12"
}

export interface Routine {
  id: string;
  name: string; // e.g. "Push (Empuje)", "Pull (Tracción)", "Legs (Pierna)", "Upper (Torso)", "Lower (Pierna)"
  type: 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'custom';
  exercises: Exercise[];
}

export interface SetLog {
  id: string;
  weight: number; // weight lifted
  reps: number; // repetitions completed
  isCompleted: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  date: string; // YYYY-MM-DD or ISO string
  durationSeconds: number;
  logs: ExerciseLog[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  references?: string[]; // scientifically-backed sources
}
