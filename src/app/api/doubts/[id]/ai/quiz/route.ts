import { NextResponse } from 'next/server';
import { generateQuizQuestions } from '@/lib/ai-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const doubtId = resolvedParams.id;

    if (!doubtId) {
      return NextResponse.json({ error: 'doubtId is required' }, { status: 400 });
    }

    const questions = await generateQuizQuestions(doubtId);

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate quiz questions. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error('------- QUIZ GENERATION ERROR DETECTED -------');
    console.error(error);
    console.error(error.stack);
    console.error('----------------------------------------------');
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to generate quiz', stack: error.stack }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
