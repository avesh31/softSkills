import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { doubtId, answerId, type } = await request.json(); // type: "upvote"

    if (!doubtId && !answerId) {
      return NextResponse.json({ error: 'Must specify doubtId or answerId' }, { status: 400 });
    }

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_doubtId_answerId: {
          userId: user.userId,
          doubtId: doubtId || null,
          answerId: answerId || null,
        }
      }
    });

    if (existing) {
      // Toggle off
      await prisma.reaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, toggled: 'off' });
    } else {
      // Toggle on
      const reaction = await prisma.reaction.create({
        data: {
          type: type || 'upvote',
          userId: user.userId,
          doubtId: doubtId || null,
          answerId: answerId || null,
        }
      });

      // Award +1 rep to author of the post/answer
      if (answerId) {
        const answer = await prisma.answer.findUnique({ where: { id: answerId } });
        if (answer && answer.authorId !== user.userId) {
          await prisma.user.update({ where: { id: answer.authorId }, data: { reputation: { increment: 1 } } });
          
          await prisma.notification.create({
            data: {
              userId: answer.authorId,
              message: `${user.username} liked your answer`,
              link: `/doubt/${answer.doubtId}`,
              type: 'system'
            }
          });
        }
      } else if (doubtId) {
        const doubt = await prisma.doubt.findUnique({ where: { id: doubtId } });
        if (doubt && doubt.authorId !== user.userId) {
          await prisma.user.update({ where: { id: doubt.authorId }, data: { reputation: { increment: 1 } } });

          await prisma.notification.create({
            data: {
              userId: doubt.authorId,
              message: `${user.username} liked your doubt`,
              link: `/doubt/${doubt.id}`,
              type: 'system'
            }
          });
        }
      }

      return NextResponse.json({ success: true, toggled: 'on', reaction });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
