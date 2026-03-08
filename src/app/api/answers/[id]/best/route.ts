import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request, context: any) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    const answer = await prisma.answer.findUnique({
      where: { id },
      include: { doubt: true }
    });

    if (!answer) return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    
    if (answer.doubt.authorId !== user.userId) {
      return NextResponse.json({ error: 'Only the doubt author can mark best answer' }, { status: 403 });
    }

    // Reset previous best answers for this doubt
    await prisma.answer.updateMany({
      where: { doubtId: answer.doubtId },
      data: { isBestAnswer: false }
    });

    // Mark new best answer
    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: { isBestAnswer: true }
    });

    // Update Doubt status to Solved
    await prisma.doubt.update({
      where: { id: answer.doubtId },
      data: { status: 'Solved' }
    });

    // Notify the answer author
    if (answer.authorId !== user.userId) {
      await prisma.notification.create({
        data: {
          userId: answer.authorId,
          message: `${user.username} marked your response as the Best Answer!`,
          link: `/doubt/${answer.doubtId}`,
          type: 'system'
        }
      });
    }

    // Award +10 reputation to the answer author
    if (answer.authorId !== answer.doubt.authorId) {
      await prisma.user.update({
        where: { id: answer.authorId },
        data: { reputation: { increment: 10 } }
      });

      // Check for Expert Status: if user has >= 3 best answers in this hub
      const userBestAnswersInHub = await prisma.answer.count({
        where: {
          authorId: answer.authorId,
          isBestAnswer: true,
          doubt: { hubId: answer.doubt.hubId }
        }
      });

      if (userBestAnswersInHub >= 3) {
        const hub = await prisma.hub.findUnique({ where: { id: answer.doubt.hubId } });
        if (hub) {
          const badgeName = `${hub.name} Expert`;
          const hasBadge = await prisma.badge.findFirst({
            where: { userId: answer.authorId, name: badgeName }
          });
          
          if (!hasBadge) {
            await prisma.badge.create({
              data: { userId: answer.authorId, name: badgeName, icon: '🌟' }
            });
            await prisma.notification.create({
              data: {
                userId: answer.authorId,
                message: `Congratulations! You've been awarded the ${badgeName} badge.`,
                link: `/profile/${answer.authorId}`,
                type: 'system'
              }
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, answer: updatedAnswer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
