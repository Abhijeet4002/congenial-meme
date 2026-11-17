import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Workout {
  _id: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
}

interface WorkoutsResponse {
  suggestions: Workout[];
}

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch suggestions for seeded user Mona
        const data = await getJson<WorkoutsResponse>('/api/workouts/suggestions/mona@example.com');
        setWorkouts(data.suggestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load workout suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>

        {loading && <p role="status">Loading workout suggestions...</p>}

        {error && (
          <p role="alert" className="alert alert-danger">
            Unable to load workout suggestions: {error}
          </p>
        )}

        {!loading && !error && workouts.length === 0 && (
          <p>No workout suggestions available. Record more activities!</p>
        )}

        {!loading && !error && workouts.length > 0 && (
          <div>
            {workouts.map((workout, index) => (
              <div key={`${workout._id}-${index}`} className="card mb-3">
                <div className="card-body">
                  <h3 className="card-title">{workout.title}</h3>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="card-text">
                        <strong>Focus:</strong> {workout.focus}
                      </p>
                      <p className="card-text">
                        <strong>Duration:</strong> {workout.minutes} minutes
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="card-text">
                        <strong>Difficulty:</strong> {workout.difficulty}
                      </p>
                      <p className="card-text">
                        <strong>Why:</strong> {workout.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
