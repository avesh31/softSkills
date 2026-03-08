import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;

    // Increment views
    const updatedDoubt = await prisma.doubt.update({
      where: { id },
      data: { views: { increment: 1 } }
    }).catch(() => null);

    if (updatedDoubt && updatedDoubt.views === 50) {
      // Notify author about trending status
      await prisma.notification.create({
        data: {
          userId: updatedDoubt.authorId,
          message: `Your doubt is trending! it just reached 50 views: "${updatedDoubt.title}"`,
          link: `/doubt/${id}`,
          type: 'system'
        }
      });
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, avatar: true, reputation: true } },
        hub: true,
        answers: {
          include: {
            author: { select: { id: true, username: true, avatar: true, reputation: true } },
            _count: { select: { reactions: true } }
          },
          orderBy: [
            { isBestAnswer: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        _count: { select: { reactions: true } }
      }
    });

    if (!doubt) {
      return NextResponse.json({ error: 'Doubt not found' }, { status: 404 });
    }

    // Try to get user from cookie and enrich the response
    let hasBookmarked = false;
    let upvotedDoubt = false;
    let upvotedAnswers: string[] = [];

    const { getUserFromCookie } = await import('@/lib/auth');
    const user = await getUserFromCookie();

    if (user) {
      const bookmark = await prisma.bookmark.findUnique({
        where: { userId_doubtId: { userId: user.userId, doubtId: doubt.id } }
      });
      hasBookmarked = !!bookmark;

      const userReactions = await prisma.reaction.findMany({
        where: { userId: user.userId, doubtId: doubt.id }
      });
      upvotedDoubt = userReactions.some(r => r.answerId === null);
      upvotedAnswers = userReactions.filter(r => r.answerId !== null).map(r => r.answerId as string);
    }

    return NextResponse.json({ doubt, hasBookmarked, upvotedDoubt, upvotedAnswers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
