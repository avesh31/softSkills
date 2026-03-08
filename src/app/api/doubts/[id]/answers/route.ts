import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request, context: any) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        doubtId: id,
        authorId: user.userId,
      }
    });

    // Award reputation to the answerer (+2 rep for answering)
    await prisma.user.update({
      where: { id: user.userId },
      data: { reputation: { increment: 2 } }
    });

    const doubt = await prisma.doubt.findUnique({ where: { id } });
    if (doubt && doubt.authorId !== user.userId) {
      // Notify the doubt author
      await prisma.notification.create({
        data: {
          userId: doubt.authorId,
          message: `${user.username} commented on your doubt: "${doubt.title}"`,
          link: `/doubt/${doubt.id}`,
          type: 'system'
        }
      });
    }

    // Process mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = Array.from(content.matchAll(mentionRegex), (m: any) => m[1]);
    
    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } }
      });
      
      const notifications = mentionedUsers
        .filter(u => u.id !== user.userId) // don't notify yourself
        .map(u => ({
          userId: u.id,
          message: `${user.username} mentioned you in an answer`,
          link: `/doubt/${id}`,
          type: 'mention'
        }));
        
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
