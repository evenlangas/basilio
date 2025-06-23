import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Ingredients list is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your Google AI API key to continue.' },
        { status: 503 }
      );
    }

    const ingredientsList = ingredients.join(', ');
    
    const prompt = `I have these ingredients: ${ingredientsList}

Please suggest 3-5 simple recipes I can make with these ingredients. For each recipe, provide:
1. Recipe name
2. Brief description (1-2 sentences)
3. Approximate cooking time
4. Simple step-by-step instructions
5. Any additional common ingredients that might be needed

Focus on practical, easy-to-make recipes that primarily use the ingredients I have. Format your response as a clear, structured list.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const suggestions = result.response.text();

    if (!suggestions) {
      return NextResponse.json(
        { error: 'No suggestions received. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI helper error:', error);
    return NextResponse.json(
      { error: 'Failed to get recipe suggestions. Please try again.' },
      { status: 500 }
    );
  }
}