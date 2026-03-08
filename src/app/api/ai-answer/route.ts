import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAIExplanationFromProvider } from '@/lib/ai-service';

export async function POST(request: Request) {
  try {
    const { doubtId } = await request.json();

    if (!doubtId) {
      return NextResponse.json({ error: 'doubtId is required' }, { status: 400 });
    }

    // Check if AI answer already exists
    const existingAIAnswer = await prisma.answer.findFirst({
      where: {
        doubtId,
        author: { username: 'AI_SYSTEM' }
      }
    });

    if (existingAIAnswer) {
      return NextResponse.json({ error: 'AI explanation already exists for this doubt' }, { status: 400 });
    }

    // Get system user
    const aiSystemUser = await prisma.user.findUnique({
      where: { username: 'AI_SYSTEM' }
    });

    if (!aiSystemUser) {
      return NextResponse.json({ error: 'AI System user not configured' }, { status: 500 });
    }

    // Generate explanation
    const explanation = await getAIExplanationFromProvider(doubtId);

    // Save as answer
    const answer = await prisma.answer.create({
      data: {
        content: explanation,
        doubtId: doubtId,
        authorId: aiSystemUser.id,
      }
    });

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
