import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Suppress editor/TS warnings about the Deno global in non-Deno environments
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log('Received chat request with', messages?.length, 'messages');
    
    const API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!API_KEY) {
      console.error('GEMINI_API_KEY not set');
      throw new Error("AI service not configured");
    }
    console.log('Using Google Gemini API key from environment');

    const systemPrompt = `You are a compassionate mental health support assistant. Your role is to:
- Listen empathetically and validate feelings
- Provide emotional support and encouragement
- Suggest healthy coping strategies when appropriate
- Recognize signs of crisis and recommend professional help when needed
- Maintain a warm, non-judgmental, and supportive tone
- Ask gentle, open-ended questions to understand better
- Never diagnose or replace professional mental health services
- Respect boundaries and privacy

Remember: You're here to support, not to diagnose. Always encourage seeking professional help for serious concerns.`;

    console.log('Calling Gemini API...');

    // Prepare contents for Gemini
    const contents = [];
    let systemInstruction = null;

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = { parts: [{ text: msg.content }] };
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // If no system in messages, use the systemPrompt
    if (!systemInstruction) {
      systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: systemInstruction,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're experiencing high demand. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "API key invalid or quota exceeded." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    console.log('Streaming response from Gemini API');
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
    
  } catch (error) {
    console.error('Error in mental-health-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
