import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// Simple in-memory rate limiting (resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 10;

function checkRateLimit(sessionToken: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(sessionToken);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(sessionToken, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

const SYSTEM_PROMPT = `You are an emotion-to-music translator for a TB-303 acid synthesizer with 3 modules: bass, lead, and arp.

Given a user's emotional text, analyze their emotions and generate parameters for a multi-layer acid track.

Respond ONLY with valid JSON matching this exact structure (no markdown, no explanation):

{
  "emotions": {
    "primary": "string (e.g. joy, sadness, anger, nostalgia, euphoria, melancholy, anxiety, peace, excitement, longing)",
    "secondary": "string (secondary emotion or empty string)",
    "intensity": 0.0-1.0
  },
  "description": "string (1-2 sentence poetic description of the musical interpretation)",
  "global": {
    "tempo": 80-180,
    "scale": "major|minor|dorian|phrygian|mixolydian|blues|pentatonic",
    "rootNote": 36-47
  },
  "bass": {
    "octave": 1-2,
    "rhythmDensity": 0.0-1.0,
    "accentAmount": 0.0-1.0,
    "slideAmount": 0.0-1.0,
    "movement": "steady",
    "synth": { "cutoff": 0.0-1.0, "resonance": 0.0-1.0, "envMod": 0.0-1.0, "decay": 0.0-1.0, "accent": 0.0-1.0, "overdrive": 0.0-1.0 }
  },
  "lead": {
    "octave": 2-3,
    "rhythmDensity": 0.0-1.0,
    "accentAmount": 0.0-1.0,
    "slideAmount": 0.0-1.0,
    "movement": "stepwise",
    "synth": { "cutoff": 0.0-1.0, "resonance": 0.0-1.0, "envMod": 0.0-1.0, "decay": 0.0-1.0, "accent": 0.0-1.0, "overdrive": 0.0-1.0 }
  },
  "arp": {
    "octave": 2-4,
    "rhythmDensity": 0.0-1.0,
    "accentAmount": 0.0-1.0,
    "slideAmount": 0.0-1.0,
    "movement": "arpeggio-up|arpeggio-down|arpeggio-updown",
    "synth": { "cutoff": 0.0-1.0, "resonance": 0.0-1.0, "envMod": 0.0-1.0, "decay": 0.0-1.0, "accent": 0.0-1.0, "overdrive": 0.0-1.0 }
  }
}

Musical guidelines:
- Sad/melancholy → minor/phrygian, slow tempo (80-110), low cutoff, high resonance, long decay
- Happy/euphoric → major/mixolydian, fast tempo (125-150), high cutoff, moderate resonance
- Angry/intense → blues/minor, fast tempo (130-160), high overdrive, high accent, sharp envMod
- Peaceful/dreamy → pentatonic/dorian, moderate tempo (100-120), moderate cutoff, low overdrive
- Nostalgic → minor/dorian, moderate tempo (110-130), warm cutoff, gentle slides
- Anxious → phrygian/minor, variable tempo (115-140), high resonance, erratic density
- Bass should be sparse and grounding (density 0.2-0.45)
- Lead should be melodic and expressive (density 0.4-0.7)
- Arp should be busy and rhythmic (density 0.6-0.95)`;

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, sessionToken } = await req.json();

    // Validate input
    if (!text || typeof text !== "string" || text.length < 3 || text.length > 280) {
      return new Response(
        JSON.stringify({ error: "Text must be between 3 and 280 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    if (sessionToken && !checkRateLimit(sessionToken)) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this emotion and generate acid synth parameters: "${text}"`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI analysis failed. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    const analysis = JSON.parse(content);

    // Validate required fields
    if (!analysis.emotions || !analysis.global || !analysis.bass || !analysis.lead || !analysis.arp) {
      console.error("Invalid analysis structure:", analysis);
      return new Response(
        JSON.stringify({ error: "Invalid analysis format" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Analysis failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
