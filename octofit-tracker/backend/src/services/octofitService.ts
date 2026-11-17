import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity data'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  // Validate required fields
  if (!userId || !teamId || !type || minutes === undefined) {
    throw Object.assign(new Error('Missing required fields: userId, teamId, type, minutes'), { status: 400 });
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId as string)) {
    throw Object.assign(new Error('Invalid userId format'), { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(teamId as string)) {
    throw Object.assign(new Error('Invalid teamId format'), { status: 400 });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  // Check if team exists
  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  // Compute points based on activity type
  const minutesNum = typeof minutes === 'number' ? minutes : parseInt(minutes as string, 10);
  if (isNaN(minutesNum) || minutesNum <= 0) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  let points: number;
  switch (type) {
    case 'cardio':
      points = minutesNum * 5;
      break;
    case 'strength':
      points = minutesNum * 4;
      break;
    case 'run':
    case 'cycle':
    case 'walk':
      points = minutesNum; // 1 point per minute for general activities
      break;
    default:
      points = minutesNum; // Default: 1 point per minute
  }

  // Create activity with computed fields
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesNum,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  const teams = await Team.find().populate('members').lean();
  
  // Serialize members to strings
  return teams.map((team) => ({
    ...team,
    members: team.members.map((member: any) => member._id?.toString() || member.toString()),
  }));
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid team data'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  // Validate required fields
  if (!name) {
    throw Object.assign(new Error('Missing required field: name'), { status: 400 });
  }

  // Create team with optional members
  const team = await Team.create({
    name,
    mascot: mascot || '',
    members: (members && Array.isArray(members)) ? members : [],
  });

  return team.toObject();
}

export async function getLeaderboard() {
  // Get all teams with their activities
  const teams = await Team.find().lean();
  
  // Calculate total points for each team
  const teamPoints = await Promise.all(
    teams.map(async (team) => {
      const totalPoints = await Activity.aggregate([
        { $match: { team: team._id } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]);
      
      return {
        teamId: team._id,
        teamName: team.name,
        totalPoints: totalPoints[0]?.total ?? 0,
      };
    })
  );

  // Sort by total points descending
  const sorted = teamPoints.sort((a, b) => b.totalPoints - a.totalPoints);

  // Add 1-based rank
  return sorted.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Decode URL-encoded email
  const decodedEmail = decodeURIComponent(userEmail);

  // Find user by email
  const user = await User.findOne({ email: decodedEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  // Get user's recent activities to identify patterns
  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();

  // Determine activity focus based on recent activities
  const activityTypes = recentActivities.map((a) => a.type);
  let suggestedFocus = user.fitnessGoal || 'general';

  // If user has recent activities, use those to inform suggestions
  if (activityTypes.length > 0) {
    if (activityTypes.some((t) => t === 'run' || t === 'cycle')) {
      suggestedFocus = 'endurance';
    } else if (activityTypes.some((t) => t === 'strength')) {
      suggestedFocus = 'strength';
    }
  }

  // Find workouts matching the suggested focus
  const workouts = await Workout.find({ focus: suggestedFocus }).lean();

  // If no workouts for that focus, get any workouts
  const availableWorkouts = workouts.length > 0 ? workouts : await Workout.find().lean();

  // Add reason explaining the recommendation
  return availableWorkouts.map((workout) => ({
    ...workout,
    reason: `Based on your ${suggestedFocus} activities and goals, this ${suggestedFocus} workout aligns with your activity pattern.`,
  }));
}

export { User };
