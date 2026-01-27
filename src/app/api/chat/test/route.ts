import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { buildPersonalityPrompt } from '@/lib/ai/personality/prompt-builder';
import type { AIPersonalityFull } from '@/lib/ai/personality/prompt-builder';
import { PLATFORM_SYSTEM_PROMPT } from '@/lib/compliance/constants';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { message, personality, conversationHistory } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'No message' }, { status: 400 });
    }

    // Build full system prompt with platform rules + personality
    const personalityPrompt = buildPersonalityPrompt(personality);
    const systemPrompt = PLATFORM_SYSTEM_PROMPT + '\n\n' + personalityPrompt;

    const messages = [
      ...(conversationHistory || []),
      { role: 'user' as const, content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response');
    }

    return NextResponse.json({
      success: true,
      response: textContent.text,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
