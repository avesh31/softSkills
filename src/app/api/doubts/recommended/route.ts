import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ doubts: [] }); // Or 401 based on requirement

    // Find all 'Expert' badges for this user
    const userBadges = await prisma.badge.findMany({
      where: { userId: user.userId, name: { endsWith: ' Expert' } }
    });

    if (userBadges.length === 0) {
      return NextResponse.json({ doubts: [] });
    }

    // Extract hub names from 'X Expert'
    const expertHubNames = userBadges.map(b => b.name.replace(' Expert', ''));

    // Find Open doubts in those hubs that the user hasn't authored or answered
    const recommendedDoubts = await prisma.doubt.findMany({
      where: {
        status: 'Open',
        authorId: { not: user.userId },
        hub: { name: { in: expertHubNames } },
        answers: { none: { authorId: user.userId } }
      },
      include: {
        hub: true,
        author: { select: { username: true } },
        _count: { select: { answers: true, reactions: true, shares: true } },
        reactions: { where: { userId: user.userId, type: 'upvote' }, select: { id: true } },
        bookmarks: { where: { userId: user.userId }, select: { id: true } }
      },
      take: 10
    });

    const doubtsWithUserState = recommendedDoubts.map(d => {
      const { reactions, bookmarks, ...rest } = d;
      return {
        ...rest,
        hasUpvoted: reactions && reactions.length > 0,
        hasBookmarked: bookmarks && bookmarks.length > 0
      };
    });

    return NextResponse.json({ doubts: doubtsWithUserState });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
