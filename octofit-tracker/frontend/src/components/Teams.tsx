import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  _id: string;
  name: string;
  mascot: string;
  members: string[];
}

interface TeamsResponse {
  teams: Team[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getJson<TeamsResponse>('/api/teams');
        setTeams(data.teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>

        {loading && <p role="status">Loading teams...</p>}

        {error && (
          <p role="alert" className="alert alert-danger">
            Unable to load teams: {error}
          </p>
        )}

        {!loading && !error && teams.length === 0 && (
          <p>No teams created yet. Build your team!</p>
        )}

        {!loading && !error && teams.length > 0 && (
          <div className="row g-3">
            {teams.map((team, index) => (
              <div key={`${team._id}-${index}`} className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="card-title">{team.name}</h3>
                    <p className="card-text">
                      <strong>Mascot:</strong> {team.mascot}
                    </p>
                    <p className="card-text">
                      <strong>Members:</strong> {team.members.length}
                    </p>
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
