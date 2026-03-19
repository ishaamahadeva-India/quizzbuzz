/**
 * IPL schedule: official first phase (BCCI announced) + optional programmatic full season.
 * Official IPL 2026 first phase: 20 matches, 28-Mar–12-Apr 2026 (source: BCCI / iplt20.com / ESPN Cricinfo).
 */

export const IPL_SCHEDULE_TEAMS = [
  'Mumbai Indians',
  'Chennai Super Kings',
  'Royal Challengers Bangalore',
  'Kolkata Knight Riders',
  'Delhi Capitals',
  'Sunrisers Hyderabad',
  'Rajasthan Royals',
  'Punjab Kings',
  'Lucknow Super Giants',
  'Gujarat Titans',
] as const;

/** IST offset: 7:30 PM IST = 14:00 UTC, 3:30 PM IST = 10:00 UTC */
const IST_UTC_OFFSET_HOURS = 5.5;

/** Official IPL 2026 first phase (BCCI announced). 20 matches, 28 Mar – 12 Apr 2026. Source: ESPN Cricinfo / iplt20.com */
const IPL_2026_OFFICIAL_FIRST_PHASE: { date: string; teamA: string; teamB: string; istTime: '15:30' | '19:30' }[] = [
  { date: '2026-03-28', teamA: 'Royal Challengers Bangalore', teamB: 'Sunrisers Hyderabad', istTime: '19:30' },
  { date: '2026-03-29', teamA: 'Mumbai Indians', teamB: 'Kolkata Knight Riders', istTime: '19:30' },
  { date: '2026-03-30', teamA: 'Rajasthan Royals', teamB: 'Chennai Super Kings', istTime: '19:30' },
  { date: '2026-03-31', teamA: 'Punjab Kings', teamB: 'Gujarat Titans', istTime: '19:30' },
  { date: '2026-04-01', teamA: 'Lucknow Super Giants', teamB: 'Delhi Capitals', istTime: '19:30' },
  { date: '2026-04-02', teamA: 'Kolkata Knight Riders', teamB: 'Sunrisers Hyderabad', istTime: '19:30' },
  { date: '2026-04-03', teamA: 'Chennai Super Kings', teamB: 'Punjab Kings', istTime: '19:30' },
  { date: '2026-04-04', teamA: 'Delhi Capitals', teamB: 'Mumbai Indians', istTime: '15:30' },
  { date: '2026-04-04', teamA: 'Gujarat Titans', teamB: 'Rajasthan Royals', istTime: '19:30' },
  { date: '2026-04-05', teamA: 'Sunrisers Hyderabad', teamB: 'Lucknow Super Giants', istTime: '15:30' },
  { date: '2026-04-05', teamA: 'Royal Challengers Bangalore', teamB: 'Chennai Super Kings', istTime: '19:30' },
  { date: '2026-04-06', teamA: 'Kolkata Knight Riders', teamB: 'Punjab Kings', istTime: '19:30' },
  { date: '2026-04-07', teamA: 'Rajasthan Royals', teamB: 'Mumbai Indians', istTime: '19:30' },
  { date: '2026-04-08', teamA: 'Delhi Capitals', teamB: 'Gujarat Titans', istTime: '19:30' },
  { date: '2026-04-09', teamA: 'Kolkata Knight Riders', teamB: 'Lucknow Super Giants', istTime: '19:30' },
  { date: '2026-04-10', teamA: 'Rajasthan Royals', teamB: 'Royal Challengers Bangalore', istTime: '19:30' },
  { date: '2026-04-11', teamA: 'Punjab Kings', teamB: 'Sunrisers Hyderabad', istTime: '15:30' },
  { date: '2026-04-11', teamA: 'Chennai Super Kings', teamB: 'Delhi Capitals', istTime: '19:30' },
  { date: '2026-04-12', teamA: 'Lucknow Super Giants', teamB: 'Gujarat Titans', istTime: '15:30' },
  { date: '2026-04-12', teamA: 'Mumbai Indians', teamB: 'Royal Challengers Bangalore', istTime: '19:30' },
];

function toUTCHours(istHour: number, istMinute: number): { h: number; m: number } {
  const totalMinutes = istHour * 60 + istMinute - IST_UTC_OFFSET_HOURS * 60;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return { h: Math.floor(normalized / 60), m: normalized % 60 };
}

export type ScheduleMatchInput = {
  teamA: string;
  teamB: string;
  matchStartTime: Date;
  status: 'upcoming';
  matchKey: string;
};

/**
 * Build matchKey for duplicate prevention: teamA + teamB + matchStartTime (ISO).
 */
export function buildMatchKey(teamA: string, teamB: string, matchStartTime: Date): string {
  return `${teamA}|${teamB}|${matchStartTime.toISOString()}`;
}

/**
 * League: each team plays every other team twice (home and away).
 * 10 teams => 10 * 9 = 90 league matches.
 */
function generateLeagueFixtures(teams: readonly string[]): { teamA: string; teamB: string }[] {
  const fixtures: { teamA: string; teamB: string }[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i !== j) {
        fixtures.push({ teamA: teams[i], teamB: teams[j] });
      }
    }
  }
  return fixtures;
}

/**
 * Assign dates to league matches.
 * Start date: 2026-03-28 (IPL 2026 opening).
 * Weekdays: 1 match at 7:30 PM IST.
 * Weekends (Sat/Sun): 2 matches — 3:30 PM IST, 7:30 PM IST.
 */
function assignLeagueDates(
  fixtures: { teamA: string; teamB: string }[],
  startYear: number,
  startMonth: number,
  startDay: number
): ScheduleMatchInput[] {
  const evening = toUTCHours(19, 30); // 7:30 PM IST
  const afternoon = toUTCHours(15, 30); // 3:30 PM IST

  const result: ScheduleMatchInput[] = [];
  let fixtureIndex = 0;
  const total = fixtures.length;

  let cursor = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0));

  while (fixtureIndex < total) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    const dayOfWeek = cursor.getUTCDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      const slot1 = new Date(Date.UTC(y, m, d, afternoon.h, afternoon.m, 0, 0));
      const slot2 = new Date(Date.UTC(y, m, d, evening.h, evening.m, 0, 0));
      if (fixtureIndex < total) {
        const f = fixtures[fixtureIndex++];
        result.push({
          teamA: f.teamA,
          teamB: f.teamB,
          matchStartTime: slot1,
          status: 'upcoming',
          matchKey: buildMatchKey(f.teamA, f.teamB, slot1),
        });
      }
      if (fixtureIndex < total) {
        const f = fixtures[fixtureIndex++];
        result.push({
          teamA: f.teamA,
          teamB: f.teamB,
          matchStartTime: slot2,
          status: 'upcoming',
          matchKey: buildMatchKey(f.teamA, f.teamB, slot2),
        });
      }
    } else {
      const slot = new Date(Date.UTC(y, m, d, evening.h, evening.m, 0, 0));
      if (fixtureIndex < total) {
        const f = fixtures[fixtureIndex++];
        result.push({
          teamA: f.teamA,
          teamB: f.teamB,
          matchStartTime: slot,
          status: 'upcoming',
          matchKey: buildMatchKey(f.teamA, f.teamB, slot),
        });
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

/**
 * Playoffs: Qualifier 1, Eliminator, Qualifier 2, Final.
 * Placed on the last 4 days after league (one match per day at 7:30 PM IST).
 */
function addPlayoffs(
  afterDate: Date,
  eveningIST: { h: number; m: number }
): ScheduleMatchInput[] {
  const playoffs = [
    { teamA: '1st Place', teamB: '2nd Place', label: 'Qualifier 1' },
    { teamA: '3rd Place', teamB: '4th Place', label: 'Eliminator' },
    { teamA: 'Loser Qualifier 1', teamB: 'Winner Eliminator', label: 'Qualifier 2' },
    { teamA: 'Winner Qualifier 1', teamB: 'Winner Qualifier 2', label: 'Final' },
  ];

  const result: ScheduleMatchInput[] = [];
  const cursor = new Date(afterDate);
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  for (const p of playoffs) {
    const y = cursor.getUTCFullYear();
    const m = cursor.getUTCMonth();
    const d = cursor.getUTCDate();
    const slot = new Date(Date.UTC(y, m, d, eveningIST.h, eveningIST.m, 0, 0));
    result.push({
      teamA: p.teamA,
      teamB: p.teamB,
      matchStartTime: slot,
      status: 'upcoming',
      matchKey: buildMatchKey(p.teamA, p.teamB, slot),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export type GenerateIPLScheduleOptions = {
  startDate?: string; // YYYY-MM-DD, default 2026-03-28
  teams?: readonly string[];
  includePlayoffs?: boolean; // default true
  /** Use BCCI-announced first phase only (20 matches, 28 Mar–12 Apr 2026). Default true. */
  useOfficialFirstPhase?: boolean; // default true
};

/**
 * Official IPL 2026 first phase: 20 matches (BCCI announced). Source: iplt20.com / ESPN Cricinfo.
 */
export function getIPL2026OfficialFirstPhase(): ScheduleMatchInput[] {
  const result: ScheduleMatchInput[] = [];
  for (const m of IPL_2026_OFFICIAL_FIRST_PHASE) {
    const [y, mo, d] = m.date.split('-').map(Number);
    const [h, min] = m.istTime.split(':').map(Number);
    const { h: uh, m: um } = toUTCHours(h, min);
    const matchStartTime = new Date(Date.UTC(y, mo - 1, d, uh, um, 0, 0));
    result.push({
      teamA: m.teamA,
      teamB: m.teamB,
      matchStartTime,
      status: 'upcoming',
      matchKey: buildMatchKey(m.teamA, m.teamB, matchStartTime),
    });
  }
  return result;
}

/**
 * Generate IPL schedule. When useOfficialFirstPhase is true (default), returns BCCI-announced
 * first phase (20 matches). Otherwise returns full programmatic league + playoffs.
 */
export function generateIPLSchedule(options: GenerateIPLScheduleOptions = {}): ScheduleMatchInput[] {
  const useOfficial = options.useOfficialFirstPhase !== false;
  if (useOfficial) {
    return getIPL2026OfficialFirstPhase();
  }

  const teams = options.teams ?? IPL_SCHEDULE_TEAMS;
  const [y, mo, d] = (options.startDate ?? '2026-03-28').split('-').map(Number);
  const includePlayoffs = options.includePlayoffs !== false;

  const fixtures = generateLeagueFixtures(teams);
  const leagueMatches = assignLeagueDates(fixtures, y, mo, d);

  if (!includePlayoffs) {
    return leagueMatches;
  }

  const lastLeague = leagueMatches[leagueMatches.length - 1];
  const lastDate = lastLeague ? new Date(lastLeague.matchStartTime) : new Date(Date.UTC(y, mo - 1, d));
  const evening = toUTCHours(19, 30);
  const playoffMatches = addPlayoffs(lastDate, evening);

  return [...leagueMatches, ...playoffMatches];
}
