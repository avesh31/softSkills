import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // A weekly leaderboard based on user reputation explicitly or their recent answers if desired.
    // For V1 of leaderboard, we rank by total reputation and amount of exact answers given recently.
    
    // We'll fetch top 50 users ranked by reputation.
    const topUsers = await prisma.user.findMany({
      take: 50,
      orderBy: { reputation: 'desc' },
      select: {
        id: true,
        username: true,
        reputation: true,
        department: true,
        yearOfStudy: true,
        badges: true,
        _count: {
          select: {
            answers: true,
            doubts: true,
          }
        }
      }
    });

    return NextResponse.json({ leaderboard: topUsers });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
