import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

const BADGE_RULES = [
  { name: 'Beginner Helper', icon: '🌱', threshold: 10 },
  { name: 'Active Contributor', icon: '🔥', threshold: 50 },
  { name: 'Top Solver', icon: '👑', threshold: 100 }
];

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;
    const currentUser = await getUserFromCookie();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        badges: true,
        _count: { select: { doubts: true, answers: true, followers: true, following: true } } as any,
        followers: currentUser ? { where: { followerId: currentUser.userId } } : false,
        doubts: {
          orderBy: { createdAt: 'desc' },
          include: { 
            hub: true, author: { select: { username: true } }, 
            _count: { select: { answers: true, reactions: true, shares: true } },
            reactions: currentUser ? { where: { userId: currentUser.userId, type: 'upvote' }, select: { id: true } } : false,
            bookmarks: currentUser ? { where: { userId: currentUser.userId }, select: { id: true } } : false,
          }
        },
        answers: {
          orderBy: { createdAt: 'desc' },
          include: { doubt: { select: { id: true, title: true } } }
        },
        bookmarks: {
          orderBy: { createdAt: 'desc' },
          include: {
            doubt: {
              include: {
                hub: true, author: { select: { username: true } },
                _count: { select: { answers: true, reactions: true, shares: true } },
                reactions: currentUser ? { where: { userId: currentUser.userId, type: 'upvote' }, select: { id: true } } : false,
                bookmarks: currentUser ? { where: { userId: currentUser.userId }, select: { id: true } } : false,
              }
            }
          }
        }
      } as any
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Data Processing for Interaction States
    const processDoubtState = (d: any) => {
      const { reactions, bookmarks, ...rest } = d;
      return {
        ...rest,
        hasUpvoted: reactions && reactions.length > 0,
        hasBookmarked: bookmarks && bookmarks.length > 0
      };
    };

    const sanitizedDoubts = (user as any).doubts.map(processDoubtState);
    const sanitizedBookmarks = (user as any).bookmarks.map((b: any) => processDoubtState(b.doubt));

    // 2. Network State
    const isFollowing = (user as any).followers && (user as any).followers.length > 0;

    // 3. Activity Graph Generation (Last 90 Days)
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const activityMap: Record<string, number> = {};
    
    // Helper to log dates
    const logActivity = (dateStr: Date) => {
      if (dateStr >= ninetyDaysAgo) {
        const d = dateStr.toISOString().split('T')[0];
        activityMap[d] = (activityMap[d] || 0) + 1;
      }
    };

    // 3.1 Fetch multi-dimensional activity timestamps
    const [extraReactions, extraChat, extraHubs] = await Promise.all([
      (prisma as any).reaction.findMany({ where: { userId: id, createdAt: { gte: ninetyDaysAgo } }, select: { createdAt: true } }),
      (prisma as any).chatMessage.findMany({ where: { authorId: id, createdAt: { gte: ninetyDaysAgo } }, select: { createdAt: true } }),
      (prisma as any).hubRequest.findMany({ where: { userId: id, createdAt: { gte: ninetyDaysAgo } }, select: { createdAt: true } })
    ]);

    // 3.2 Aggregate all activity
    (user as any).doubts.forEach((d: any) => logActivity(d.createdAt));
    (user as any).answers.forEach((a: any) => logActivity(a.createdAt));
    extraReactions.forEach((r: any) => logActivity(r.createdAt));
    extraChat.forEach((c: any) => logActivity(c.createdAt));
    extraHubs.forEach((h: any) => logActivity(h.createdAt));

    const activityGraph = Object.entries(activityMap).map(([date, count]) => ({ date, count }));

    // 4. Hub Expertise Extraction
    const hubCounts: Record<string, { count: number, name: string }> = {};
    const expertHubsDb = await prisma.answer.findMany({
      where: { authorId: id },
      include: { doubt: { include: { hub: true } } }
    });

    expertHubsDb.forEach((a: any) => {
      const hId = a.doubt.hub.id;
      if (!hubCounts[hId]) hubCounts[hId] = { count: 0, name: a.doubt.hub.name };
      hubCounts[hId].count += a.isBestAnswer ? 3 : 1;
    });

    const expertHubs = Object.values(hubCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Top 3 hubs

    // 5. Compute Trust Score
    const bestAnswersCount = (user as any).answers.filter((a: any) => a.isBestAnswer).length;
    let rank = 'Beginner';
    if (user.reputation > 200 || bestAnswersCount > 20) rank = 'Top Solver';
    else if (user.reputation > 50 || bestAnswersCount > 5) rank = 'Active Contributor';
    else if (expertHubs.some(h => h.count >= 10)) rank = 'Hub Expert';

    let trustScore = Math.min(100, Math.floor(
      (user.reputation * 0.5) + (bestAnswersCount * 2) + ((user as any).answers.length * 0.1) + (extraChat.length * 0.05)
    ));

    // 6. Badges Engine
    let newlyAwarded = false;
    for (const rule of BADGE_RULES) {
      if (user.reputation >= rule.threshold) {
        const hasBadge = (user as any).badges.some((b: any) => b.name === rule.name);
        if (!hasBadge) {
          await prisma.badge.create({
            data: { userId: user.id, name: rule.name, icon: rule.icon }
          });
          
          // Create Notification for the new badge
          await prisma.notification.create({
            data: {
              userId: user.id,
              message: `Milestone reached! You earned the "${rule.name}" badge ${rule.icon}.`,
              link: `/profile/${user.id}`,
              type: 'system'
            }
          });
          
          newlyAwarded = true;
        }
      }
    }

    const finalBadges = newlyAwarded ? await prisma.badge.findMany({ where: { userId: id } }) : user.badges;

    const payload = {
      ...user,
      doubts: sanitizedDoubts,
      bookmarks: sanitizedBookmarks,
      answers: (user as any).answers,
      isFollowing,
      activityGraph,
      expertHubs,
      rank,
      trustScore,
      badges: finalBadges,
      bestAnswers: (user as any).answers.filter((a: any) => a.isBestAnswer).length
    };

    // Remove sensitive nested stuff not needed by client
    delete (payload as any).followers;

    return NextResponse.json({ user: payload });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
