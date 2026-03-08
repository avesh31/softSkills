import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { doubtId, targetUsername } = await request.json();
    if (!doubtId || !targetUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.userId) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    // Create share record
    const share = await prisma.share.create({
      data: {
        doubtId: doubtId as string,
        senderId: user.userId,
        receiverId: targetUser.id,
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        message: `${user.username} shared a doubt with you`,
        link: `/doubt/${doubtId}`,
        type: 'share'
      }
    });

    return NextResponse.json({ success: true, share });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
