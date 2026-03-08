import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';
import { filterContent } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get('hubId'); 

    const messages = await (prisma as any).chatMessage.findMany({
      where: { hubId: hubId || null },
      include: {
        author: { select: { id: true, username: true, avatar: true } },
        reactions: { include: { user: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let { content, hubId } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });

    content = filterContent(content);

    const message = await (prisma as any).chatMessage.create({
      data: {
        content,
        authorId: user.userId,
        hubId: hubId || null,
      },
      include: {
        author: { select: { id: true, username: true, avatar: true } }
      }
    });

    // Mentions logic
    const mentionRegex = /@(\w+)/g;
    const mentions = Array.from(content.matchAll(mentionRegex), (match: any) => match[1]);
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: { username: { in: mentions } }
      });
      const notifications = mentionedUsers
        .filter(u => u.id !== user.userId)
        .map(u => ({
          userId: u.id,
          message: `${user.username} mentioned you in the Chat Lounge!`,
          link: `/chat`,
          type: 'mention'
        }));
      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    if (!messageId) return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });

    const message = await (prisma as any).chatMessage.findUnique({
      where: { id: messageId },
      select: { authorId: true }
    });

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // Check ownership or admin status
    if (message.authorId !== user.userId && (user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await (prisma as any).chatMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
