import { NextResponse } from 'next/server';
import { getAIExplanation } from '@/lib/ai-service';

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params;
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await getAIExplanation(id, message);

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
