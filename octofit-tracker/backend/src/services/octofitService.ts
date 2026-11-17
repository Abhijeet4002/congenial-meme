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
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
