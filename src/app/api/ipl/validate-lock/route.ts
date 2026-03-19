import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const LOCK_MINUTES_BEFORE = 30;

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : null;
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

/**
 * GET /api/ipl/validate-lock?matchId=xxx
 * Returns { locked: boolean, message?: string }.
 * Uses server time to determine if match is within lock window (30 min before start).
 */
export async function GET(request: NextRequest) {
  try {
    const matchId = request.nextUrl.searchParams.get('matchId');
    if (!matchId) {
      return NextResponse.json(
        { locked: false, error: 'Missing matchId' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const matchRef = db.collection('ipl_matches').doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      return NextResponse.json(
        { locked: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const data = matchSnap.data();
    const matchStartTime = data?.matchStartTime as { seconds?: number } | undefined;
    if (!matchStartTime?.seconds) {
      return NextResponse.json(
        { locked: false, error: 'Match has no start time' },
        { status: 400 }
      );
    }

    const start = new Date(matchStartTime.seconds * 1000);
    const lockAt = new Date(start.getTime() - LOCK_MINUTES_BEFORE * 60 * 1000);
    const now = new Date();
    const locked = now >= lockAt;

    return NextResponse.json({
      locked,
      ...(locked ? { message: 'Selection locked for this match' } : {}),
    });
  } catch (error) {
    console.error('validate-lock error:', error);
    return NextResponse.json(
      { locked: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
