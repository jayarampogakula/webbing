import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export interface GenerationParams {
  prompt: string;
  systemPrompt?: string;
  schema?: any;
}

export interface AIProvider {
  name: string;
  generateText(params: GenerationParams): Promise<string>;
  generateJson<T>(params: GenerationParams): Promise<T>;
}

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  }

  async generateText(params: GenerationParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...(params.systemPrompt ? [{ role: "system" as const, content: params.systemPrompt }] : []),
        { role: "user" as const, content: params.prompt }
      ],
    });
    return response.choices[0]?.message?.content || "";
  }

  async generateJson<T>(params: GenerationParams): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...(params.systemPrompt ? [{ role: "system" as const, content: params.systemPrompt }] : []),
        { role: "user" as const, content: params.prompt }
      ],
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content || "{}";
    return JSON.parse(content) as T;
  }
}

export class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private client: Anthropic;

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
  }

  async generateText(params: GenerationParams): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.prompt }]
    });
    return response.content[0]?.type === "text" ? response.content[0].text : "";
  }

  async generateJson<T>(params: GenerationParams): Promise<T> {
    const promptWithJsonInstruction = `${params.prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object matching the requested schema. Do not write introductory or concluding remarks.`;
    const text = await this.generateText({
      prompt: promptWithJsonInstruction,
      systemPrompt: params.systemPrompt
    });
    
    try {
      // Find start and end indices of the JSON block
      const startIdx = text.indexOf("{");
      const endIdx = text.lastIndexOf("}");
      if (startIdx === -1 || endIdx === -1) {
        throw new Error("Could not locate JSON formatting boundaries in Anthropic response.");
      }
      const jsonString = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error("Failed to parse JSON from Anthropic response:", text);
      throw error;
    }
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private client: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
  }

  async generateText(params: GenerationParams): Promise<string> {
    if (!this.client) {
      throw new Error("Gemini API key is not configured.");
    }
    const response = await this.client.models.generateContent({
      model: "gemini-1.5-flash",
      contents: params.prompt,
      config: params.systemPrompt ? { systemInstruction: params.systemPrompt } : undefined
    });
    return response.text || "";
  }

  async generateJson<T>(params: GenerationParams): Promise<T> {
    if (!this.client) {
      throw new Error("Gemini API key is not configured.");
    }
    const response = await this.client.models.generateContent({
      model: "gemini-1.5-pro",
      contents: params.prompt,
      config: {
        systemInstruction: params.systemPrompt,
        responseMimeType: "application/json",
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text) as T;
  }
}

export class AIService {
  private providers: AIProvider[] = [];

  constructor() {
    // Populate based on environment configurations
    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider());
    }
    if (process.env.GEMINI_API_KEY) {
      this.providers.push(new GeminiProvider());
    }
    
    // Fallback: If no provider is config-bound, add a mock provider or throw in production
    if (this.providers.length === 0) {
      console.warn("No AI API keys configured. Running with mock provider.");
      this.providers.push({
        name: "mock",
        generateText: async () => "Mock generation output",
        generateJson: async () => ({}) as any
      });
    }
  }

  getProvider(preferred?: string): AIProvider {
    if (preferred) {
      const found = this.providers.find(p => p.name === preferred);
      if (found) return found;
    }
    return this.providers[0];
  }

  async generateWebsiteLayout(prompt: string, style: string): Promise<any> {
    const provider = this.getProvider("anthropic"); // Default layout orchestration to Claude
    const systemPrompt = "You are a master web designer SaaS engine. Respond only with structured layout design parameters matching the business specifications. Favor modern, non-white visual systems with rich contrast, clear spacing, and complete sections.";
    const userPrompt = `
      Create a website layout mapping for the following business:
      Description: ${prompt}
      Style Preferences: ${style}

      Your response MUST follow this structure:
      {
        "theme": {
          "primary": "Hex color code",
          "secondary": "Hex color code",
          "fontFamily": "Google Fonts paired naming"
        },
        "pages": [
          {
            "slug": "index",
            "title": "Home page",
            "description": "Short SEO description",
            "sections": [
              {
                "type": "HERO",
                "order": 1,
                "content": {
                  "heading": "Headline copy",
                  "subheading": "Supporting value proposition paragraph",
                  "ctaText": "Primary Action button text",
                  "ctaUrl": "#contact"
                }
              },
              {
                "type": "FEATURES",
                "order": 2,
                "content": {
                  "items": [
                    { "title": "Feature 1 title", "description": "Short explanation text" }
                  ]
                }
              },
              {
                "type": "PRICING",
                "order": 3,
                "content": {
                  "plans": [
                    { "name": "Starter", "price": "$0", "description": "Short plan description" }
                  ]
                }
              },
              {
                "type": "ABOUT",
                "order": 4,
                "content": {
                  "heading": "About section heading",
                  "body": "About section body"
                }
              },
              {
                "type": "CONTACT",
                "order": 5,
                "content": {
                  "heading": "Contact heading",
                  "email": "hello@example.com"
                }
              }
            ]
          }
        ]
      }
    `;

    return provider.generateJson<any>({
      prompt: userPrompt,
      systemPrompt
    });
  }
}
