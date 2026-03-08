import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_to_prevent_crash');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface AIResponse {
  answer: string;
  type: 'concept' | 'steps' | 'general' | 'error';
}

export interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export async function getAIExplanationFromProvider(doubtId: string): Promise<string> {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: { hub: true }
  });

  if (!doubt) throw new Error('Doubt not found');

  const prompt = `You are a helpful tutor who explains student doubts clearly. Limit your response to approximately 150-200 words. Focus on being supportive and educational.
  
  Doubt Title: ${doubt.title}
  Description: ${doubt.description}
  Code: ${doubt.codeSnippet || 'None'}
  Hub: ${doubt.hub.name}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text() || "I'm sorry, I couldn't generate an explanation at this time.";
}

export async function getAIExplanation(doubtId: string, message: string): Promise<AIResponse> {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: { hub: true, tags: { include: { tag: true } } }
  });

  if (!doubt) {
    return { answer: "I couldn't find the doubt you're referring to.", type: 'error' };
  }

  const query = message.toLowerCase();
  const hubName = doubt.hub.name.toLowerCase();

  // 1. Concept Explanation Logic
  if (query.includes('concept') || query.includes('what is') || query.includes('explain')) {
    if (hubName === 'programming' || hubName === 'web development') {
      return {
        answer: `In ${doubt.hub.name}, concepts are often best understood through mental models. For example, if you're looking at a piece of code, think of variables as boxes and functions as machines that transform inputs. \n\nFocusing on your question: "${doubt.title}", the core concept involves understanding how state and logic interact. Would you like a simple example?`,
        type: 'concept'
      };
    }
    if (hubName === 'mathematics') {
      return {
        answer: `The mathematical principle behind "${doubt.title}" usually relies on foundational axioms. Try to visualize the problem on a coordinate plane or simplify the variables. \n\nWould you like me to walk through the underlying formula?`,
        type: 'concept'
      };
    }
    return {
      answer: `The concept behind "${doubt.title}" is rooted in the fundamental principles of ${doubt.hub.name}. It's important to understand the 'why' before the 'how'.`,
      type: 'concept'
    };
  }

  // 2. Step-by-Step Guidance Logic
  if (query.includes('step') || query.includes('how to') || query.includes('guide')) {
    return {
      answer: `Let's break this down into manageable steps:
\nStep 1: Identify your knowns and unknowns based on the description.
\nStep 2: Check for syntax errors or logical gaps in the code snippet provided.
\nStep 3: Test a single small part of the solution before moving to the next.
\nStep 4: Review how the output differs from your expectation.`,
      type: 'steps'
    };
  }

  // 3. Practice Questions
  if (query.includes('practice') || query.includes('question')) {
    return {
      answer: `Here's a challenge to test your understanding:
\n- If you changed one variable in your current problem, how would the outcome shift?
\n- Can you rewrite this logic using a different approach (e.g., a loop instead of recursion)?
\n- Try explaining this concept to a peer!`,
      type: 'general'
    };
  }

  // Default response
  return {
    answer: "I'm here to help! I can provide a concept explanation, step-by-step guidance, or even some practice questions. What would you prefer?",
    type: 'general'
  };
}

export async function getSimilarDoubts(doubtId: string) {
  const currentDoubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: { tags: { include: { tag: true } } }
  });

  if (!currentDoubt) return [];

  const tagNames = currentDoubt.tags.map(t => t.tag.name);

  // Simple similarity: Same hub or sharing at least one tag
  const similar = await prisma.doubt.findMany({
    where: {
      id: { not: doubtId },
      OR: [
        { hubId: currentDoubt.hubId },
        { tags: { some: { tag: { name: { in: tagNames } } } } }
      ]
    },
    take: 3,
    orderBy: { views: 'desc' },
    select: { id: true, title: true }
  });

  return similar;
}

export async function getRecommendedResources(doubtId: string) {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: { hub: true }
  });

  if (!doubt) return [];

  const resources: Record<string, Array<{ title: string, url: string }>> = {
    'Programming': [
      { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
      { title: 'FreeCodeCamp Guide', url: 'https://www.freecodecamp.org/news/' }
    ],
    'Web Development': [
      { title: 'React Documentation', url: 'https://react.dev/' },
      { title: 'CSS-Tricks', url: 'https://css-tricks.com/' }
    ],
    'Mathematics': [
      { title: 'Khan Academy', url: 'https://www.khanacademy.org/math' },
      { title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/' }
    ],
    'Default': [
      { title: 'Wikipedia - Learning Resources', url: 'https://en.wikipedia.org/wiki/Open_educational_resources' },
      { title: 'Coursera', url: 'https://www.coursera.org/' }
    ]
  };

  return resources[doubt.hub.name] || resources['Default'];
}

export async function generateQuizQuestions(doubtId: string): Promise<QuizQuestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing. Please configure it in .env');
  }

  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: {
      hub: true,
      answers: {
        include: { author: true }
      }
    }
  });

  if (!doubt) throw new Error('Doubt not found');

  const aiExplanation = doubt.answers.find(a => a.author.username === 'AI_SYSTEM')?.content || '';

  const contextPrompt = [
    `Topic: ${doubt.title}`,
    `Description: ${doubt.description}`,
    `Subject/Hub: ${doubt.hub.name}`,
    aiExplanation ? `AI Explanation: ${aiExplanation}` : ''
  ].filter(Boolean).join('\n');

  const prompt = `You are an educational quiz generator. Given a student's doubt context, generate exactly 4 multiple-choice questions that test conceptual understanding. 
  Return ONLY a valid JSON array with no markdown blocks, no explanation, and no extra text. 
  
  Format:
  [
    {
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correctAnswer": "A"
    }
  ]
  
  Rules:
  - Questions must be concept-based and reasoning-focused (not trivial memorization)
  - One correct answer per question
  - Distractors should be plausible but clearly wrong
  - Difficulty: beginner to intermediate
  
  Context:
  ${contextPrompt}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text() || '[]';

  // Strip markdown fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as QuizQuestion[];
  } catch {
    console.error('Failed to parse quiz JSON:', cleaned);
  }

  return [];
}
