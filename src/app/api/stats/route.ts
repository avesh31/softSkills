import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [userCount, doubtCount, answerCount, solvedDoubtCount] = await Promise.all([
      prisma.user.count(),
      prisma.doubt.count(),
      prisma.answer.count(),
      prisma.doubt.count({
        where: {
          OR: [
            { status: 'Solved' },
            { answers: { some: { isBestAnswer: true } } }
          ]
        }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: userCount,
        totalDoubts: doubtCount,
        totalAnswers: answerCount,
        totalSolved: solvedDoubtCount
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
