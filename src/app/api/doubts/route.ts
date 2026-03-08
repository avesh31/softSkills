import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId');
    const trending = searchParams.get('trending') === 'true';
    const following = searchParams.get('following') === 'true';

    const user = await getUserFromCookie();
    let whereClause: any = {};
    
    if (hubId) {
      whereClause.hubId = hubId;
    }

    if (following) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const followedHubs = await (prisma as any).hubFollow.findMany({
        where: { userId: user.userId },
        select: { hubId: true }
      });
      
      const hubIds = followedHubs.map((f: any) => f.hubId);
      if (hubIds.length > 0) {
        whereClause.hubId = { in: hubIds };
      } else {
        // Return nothing if they follow nothing
        return NextResponse.json({ doubts: [] });
      }
    }

    const doubts = await prisma.doubt.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        hub: true,
        _count: { select: { answers: true, reactions: true, shares: true } },
        reactions: user ? { where: { userId: user.userId, type: 'upvote' }, select: { id: true } } : false,
        bookmarks: user ? { where: { userId: user.userId }, select: { id: true } } : false,
      },
      orderBy: trending 
        ? [{ views: 'desc' }, { createdAt: 'desc' }] 
        : { createdAt: 'desc' },
      take: 20
    });
    
    const doubtsWithUserState = doubts.map(d => {
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

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, codeSnippet, hubId, difficulty, priority } = await request.json();

    if (!title || !description || !hubId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doubt = await (prisma as any).doubt.create({
      data: {
        title,
        description,
        codeSnippet,
        hubId,
        difficulty: difficulty || 'Medium',
        priority: priority || 'Medium',
        authorId: user.userId,
      }
    });

    // Notify Hub Followers
    const followers = await (prisma as any).hubFollow.findMany({
      where: { hubId },
      select: { userId: true }
    });

    if (followers.length > 0) {
      const notifications = followers
        .filter((f: any) => f.userId !== user.userId) // Don't notify the author
        .map((f: any) => ({
          userId: f.userId,
          message: `New doubt in a hub you follow: "${title}"`,
          link: `/doubt/${doubt.id}`,
          type: 'system'
        }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    // Trigger AI Answer Generation (don't await to avoid delaying the response)
    fetch(`${new URL(request.url).origin}/api/ai-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doubtId: doubt.id }),
    }).catch(err => console.error('Auto-AI Error:', err));

    return NextResponse.json({ success: true, doubt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
