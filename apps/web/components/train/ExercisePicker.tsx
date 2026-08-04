import { useState } from 'react';

type PerformedExercise = {
  id: string;
  name: string;
  sets: Array<{ isWarmup: boolean; loadKg: number | null; reps: number }>;
};

type ExerciseOption = {
  id: string;
  name: string;
};

export default function ExercisePicker({ exercise, onSubstitute }: { exercise: PerformedExercise; onSubstitute: (option: ExerciseOption) => void }) {
  const [options, setOptions] = useState<ExerciseOption[]>([]);
  const [loading, setLoading] = useState(false);

  function fetchOptions() {
    // Implement logic to fetch exercise options
  }

  return (
    <div className='exercise-picker'>
      {/* Render exercise options here with onSubstitute handler */}
    </div>
  );
}