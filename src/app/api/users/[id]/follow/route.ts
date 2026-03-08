import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request, context: any) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: targetUserId } = await context.params;

    if (user.userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existingFollow = await (prisma as any).userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await (prisma as any).userFollow.delete({
        where: {
          followerId_followingId: {
            followerId: user.userId,
            followingId: targetUserId
          }
        }
      });
      return NextResponse.json({ success: true, isFollowing: false });
    } else {
      // Follow
      await (prisma as any).userFollow.create({
        data: {
          followerId: user.userId,
          followingId: targetUserId
        }
      });

      // Notify the target user
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          message: `${user.username} started following you!`,
          link: `/profile/${user.userId}`,
          type: 'system'
        }
      });

      return NextResponse.json({ success: true, isFollowing: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
