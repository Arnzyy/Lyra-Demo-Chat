import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const { conversations, images } = await request.json();

    if (!conversations?.trim() && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'No conversations or images provided' },
        { status: 400 }
      );
    }

    // Build content array for Claude
    const contentParts: any[] = [];

    // Add text instruction
    const instruction = `Analyze these real chat conversations to extract personality patterns. Return ONLY valid JSON:

${conversations || 'No text provided. Analyze the images below.'}

Return this exact JSON structure:
{
  "personality_traits": ["flirty", "playful", "confident", "teasing", "sweet"],
  "speech_patterns": ["common phrases"],
  "humor_style": "sarcastic|witty|playful|mixed",
  "energy_level": 7,
  "topics_loves": ["topics"],
  "topics_avoids": ["topics"],
  "flirting_intensity": 8,
  "common_phrases": ["phrases she uses"],
  "confidence_score": 4
}

personality_traits should be 3-5 traits from this list: flirty, playful, confident, teasing, sweet, caring, mysterious, bold, submissive, dominant, sarcastic, witty, funny, intelligent, creative, spontaneous, adventurous, romantic, passionate, sensual`;

    contentParts.push({
      type: 'text',
      text: instruction
    });

    // Add images if provided
    if (images && images.length > 0) {
      for (const imageData of images) {
        // Extract media type and base64 data from data URL
        const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mediaType = matches[1];
          const base64Data = matches[2];

          contentParts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          });
        }
      }
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: contentParts,
        },
      ],
    });

    const textContent = message.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse analysis');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    );
  }
}
