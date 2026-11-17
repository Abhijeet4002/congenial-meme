import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Activity {
  _id: string;
  type: string;
  minutes: number;
  points: number;
  user: string;
  team: string;
  occurredAt: string;
}

interface ActivitiesResponse {
  activities: Activity[];
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getJson<ActivitiesResponse>('/api/activities');
        setActivities(data.activities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>

        {loading && <p role="status">Loading activities...</p>}

        {error && (
          <p role="alert" className="alert alert-danger">
            Unable to load activities: {error}
          </p>
        )}

        {!loading && !error && activities.length === 0 && (
          <p>No activities recorded yet. Start tracking!</p>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Minutes</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={`${activity._id}-${index}`}>
                    <td>{activity.type}</td>
                    <td>{activity.minutes}</td>
                    <td>{activity.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
