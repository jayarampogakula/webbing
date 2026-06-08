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
  private modelName: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.modelName = model || "gpt-4o-mini";
  }

  async generateText(params: GenerationParams): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        ...(params.systemPrompt ? [{ role: "system" as const, content: params.systemPrompt }] : []),
        { role: "user" as const, content: params.prompt }
      ],
    });
    return response.choices[0]?.message?.content || "";
  }

  async generateJson<T>(params: GenerationParams): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: this.modelName === "gpt-4o-mini" ? "gpt-4o" : this.modelName, // scale up to gpt-4o for JSON parsing
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
  private modelName: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
    this.modelName = model || "claude-3-5-sonnet-20241022";
  }

  async generateText(params: GenerationParams): Promise<string> {
    const response = await this.client.messages.create({
      model: this.modelName,
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
  private modelName: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (key) {
      this.client = new GoogleGenAI({ apiKey: key });
    }
    this.modelName = model || "gemini-2.5-flash";
  }

  async generateText(params: GenerationParams): Promise<string> {
    if (!this.client) {
      throw new Error("Gemini API key is not configured.");
    }
    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: params.prompt,
        config: params.systemPrompt ? { systemInstruction: params.systemPrompt } : undefined
      });
      return response.text || "";
    } catch (err: any) {
      const isQuotaOrNotFound = err?.message?.toLowerCase().includes("quota") || 
                              err?.message?.toLowerCase().includes("not found") || 
                              err?.message?.toLowerCase().includes("not_found") || 
                              err?.message?.toLowerCase().includes("limit");
      if (this.modelName.toLowerCase().includes("pro") && isQuotaOrNotFound) {
        console.warn(`Gemini Pro model text generation failed. Falling back to gemini-2.5-flash. Error: ${err.message}`);
        const fallbackResponse = await this.client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: params.prompt,
          config: params.systemPrompt ? { systemInstruction: params.systemPrompt } : undefined
        });
        return fallbackResponse.text || "";
      }
      throw err;
    }
  }

  async generateJson<T>(params: GenerationParams): Promise<T> {
    if (!this.client) {
      throw new Error("Gemini API key is not configured.");
    }
    
    // Default to the requested model. If no pro model was explicitly chosen, use gemini-2.5-flash to preserve quotas.
    const targetModel = this.modelName.toLowerCase().includes("pro") ? this.modelName : "gemini-2.5-flash";
    
    try {
      const response = await this.client.models.generateContent({
        model: targetModel,
        contents: params.prompt,
        config: {
          systemInstruction: params.systemPrompt,
          responseMimeType: "application/json",
        }
      });
      let text = response.text || "{}";
      // Sanitize markdown code blocks if present
      if (text.includes("```")) {
        const startIdx = text.indexOf("{");
        const endIdx = text.lastIndexOf("}");
        if (startIdx !== -1 && endIdx !== -1) {
          text = text.substring(startIdx, endIdx + 1);
        }
      }
      return JSON.parse(text) as T;
    } catch (err: any) {
      const isQuotaOrNotFound = err?.message?.toLowerCase().includes("quota") || 
                              err?.message?.toLowerCase().includes("not found") || 
                              err?.message?.toLowerCase().includes("not_found") || 
                              err?.message?.toLowerCase().includes("limit");
      
      if (isQuotaOrNotFound && targetModel !== "gemini-2.5-flash") {
        console.warn(`Gemini JSON generation failed on ${targetModel}. Falling back to gemini-2.5-flash. Error: ${err.message}`);
        const fallbackResponse = await this.client.models.generateContent({
          model: "gemini-2.5-flash",
          contents: params.prompt,
          config: {
            systemInstruction: params.systemPrompt,
            responseMimeType: "application/json",
          }
        });
        const text = fallbackResponse.text || "{}";
        return JSON.parse(text) as T;
      }
      throw err;
    }
  }
}

export class AIService {
  private providers: AIProvider[] = [];

  constructor(customKeys?: Array<{ provider: string; secret: string; model?: string }>) {
    if (customKeys && customKeys.length > 0) {
      for (const k of customKeys) {
        const provName = k.provider.toLowerCase();
        if (provName === "openai") {
          this.providers.push(new OpenAIProvider(k.secret, k.model));
        } else if (provName === "anthropic" || provName === "claude") {
          this.providers.push(new AnthropicProvider(k.secret, k.model));
        } else if (provName === "gemini") {
          this.providers.push(new GeminiProvider(k.secret, k.model));
        }
      }
    }

    // Populate based on environment configurations if no custom keys
    if (this.providers.length === 0) {
      if (process.env.OPENAI_API_KEY) {
        this.providers.push(new OpenAIProvider());
      }
      if (process.env.ANTHROPIC_API_KEY) {
        this.providers.push(new AnthropicProvider());
      }
      if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        this.providers.push(new GeminiProvider());
      }
    }
    
    // Fallback: If no provider is config-bound, add a mock provider or throw in production
    if (this.providers.length === 0) {
      console.warn("No AI API keys configured. Running with mock provider.");
      this.providers.push({
        name: "mock",
        generateText: async () => "Mock generation output",
        generateJson: async <T>(params: GenerationParams) => {
          // If editing page sections, return mock sections array
          if (params?.prompt?.includes("Current Page Sections") || params?.systemPrompt?.includes("sections")) {
            return {
              sections: [
                {
                  type: "HEADER",
                  order: 1,
                  content: {
                    ctaText: "Shop New Arrivals",
                    ctaUrl: "#collections",
                    links: [
                      { label: "New Arrivals", url: "#new-arrivals" },
                      { label: "Collections", url: "#collections" },
                      { label: "About Us", url: "#about" },
                      { label: "Contact", url: "#contact" }
                    ]
                  }
                },
                {
                  type: "HERO",
                  order: 2,
                  content: {
                    heading: "Drape Yourself in Elegance: Anu Sarees Collection",
                    subheading: "Explore our exquisite range of traditional, trending, and luxurious silk sarees, handpicked for the modern woman.",
                    ctaText: "Shop New Arrivals",
                    ctaUrl: "#collections",
                    secondaryCtaText: "Explore Collections",
                    secondaryCtaUrl: "#about",
                    imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80"
                  }
                }
              ]
            } as unknown as T;
          }
          return {
            theme: {
              primary: "#6366f1",
              secondary: "#a855f7",
              style: "Modern Startup",
              fontFamily: "Inter"
            },
            pages: [
            {
              slug: "index",
              title: "Home Page",
              description: "A modern mock generated layout built with Webbing.",
              sections: [
                {
                  type: "HEADER",
                  order: 1,
                  content: {
                    ctaText: "Get Started",
                    ctaUrl: "#contact",
                    links: [
                      { label: "Features", url: "#features" },
                      { label: "About", url: "#about" },
                      { label: "Contact", url: "#contact" }
                    ]
                  }
                },
                {
                  type: "HERO",
                  order: 2,
                  content: {
                    heading: "Your Beautiful New Website",
                    subheading: "Configure an AI API key in settings or Bring Your Own Key to unlock full generative dynamic builds tailored directly to your niche.",
                    ctaText: "Contact Us Today",
                    ctaUrl: "#contact",
                    imageUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80"
                  }
                },
                {
                  type: "FEATURES",
                  order: 3,
                  content: {
                    items: [
                      { title: "Fast Launch Time", description: "Your custom website is generated dynamically from simple text prompts in seconds." },
                      { title: "Responsive Layouts", description: "Designed with a mobile-first philosophy that renders beautifully on all viewports." },
                      { title: "Direct ZIP Export", description: "Export the clean HTML and CSS to host anywhere, or bind subdomains instantly." }
                    ]
                  }
                },
                {
                  type: "ABOUT",
                  order: 4,
                  content: {
                    heading: "About Our Service",
                    body: "Webbing is an advanced generative SaaS for websites. Build, edit, preview, and host professional landing pages effortlessly.",
                    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
                  }
                },
                {
                  type: "CONTACT",
                  order: 5,
                  content: {
                    heading: "Let's Start a Conversation",
                    email: "support@webbing.in",
                    phone: "+1 (555) 019-2834"
                  }
                },
                {
                  type: "FOOTER",
                  order: 6,
                  content: {}
                }
              ]
            }
          ]
          } as unknown as T;
        }
      });
    }
  }

  getProvider(preferred?: string): AIProvider {
    if (preferred) {
      const found = this.providers.find(p => p.name === preferred.toLowerCase() || (preferred.toLowerCase() === "claude" && p.name === "anthropic"));
      if (found) return found;
    }
    return this.providers[0];
  }

  getOrderedProviders(preferred?: string): AIProvider[] {
    const ordered: AIProvider[] = [];
    if (preferred) {
      const pName = preferred.toLowerCase();
      const found = this.providers.find(p => p.name === pName || (pName === "claude" && p.name === "anthropic"));
      if (found) {
        ordered.push(found);
      }
    }
    
    // Add other providers in order
    for (const p of this.providers) {
      if (!ordered.includes(p)) {
        ordered.push(p);
      }
    }

    if (ordered.length === 0) {
      throw new Error("No AI providers are configured.");
    }
    return ordered;
  }

  async generateJson<T>(params: GenerationParams, preferredProvider?: string): Promise<T> {
    const ordered = this.getOrderedProviders(preferredProvider);
    let lastError = null;
    for (const provider of ordered) {
      try {
        console.log(`[AIService] Trying generateJson using provider: ${provider.name}`);
        return await provider.generateJson<T>(params);
      } catch (err: any) {
        console.warn(`[AIService] Provider ${provider.name} failed generateJson: ${err.message || err}`);
        lastError = err;
      }
    }
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || lastError}`);
  }

  async generateText(params: GenerationParams, preferredProvider?: string): Promise<string> {
    const ordered = this.getOrderedProviders(preferredProvider);
    let lastError = null;
    for (const provider of ordered) {
      try {
        console.log(`[AIService] Trying generateText using provider: ${provider.name}`);
        return await provider.generateText(params);
      } catch (err: any) {
        console.warn(`[AIService] Provider ${provider.name} failed generateText: ${err.message || err}`);
        lastError = err;
      }
    }
    throw new Error(`All AI providers failed. Last error: ${lastError?.message || lastError}`);
  }

  async generateWebsiteLayout(
    prompt: string,
    style: string,
    preferredProvider?: string,
    metadata?: {
      websiteName?: string;
      businessName?: string;
      keywords?: string;
      industry?: string;
      targetAudience?: string;
      ecommerce?: boolean;
    }
  ): Promise<any> {
    const provider = this.getProvider(preferredProvider || "gemini");
    const systemPrompt = `You are a master web designer SaaS engine. Respond only with structured website layout parameters matching the business specifications.
Favor modern, non-white visual systems with rich contrast, clear spacing, and complete sections.
For images, choose a highly relevant high-resolution image URL from Unsplash. Use this format: \`https://images.unsplash.com/photo-[UNSPLASH_ID]?auto=format&fit=crop&w=1200&q=80\`.
Choose an appropriate ID based on the niche:
- Gaming/Esports: '1542751371-adc38448a05e', '1511512578047-dfb367046420', '1612287230202-1bf1d85d1bdf', '1538481199705-c710c4e965fc'
- Fitness/Sports/Gym: '1517838277536-f5f99be501cd', '1518310383802-640c2de311b2', '1540555700478-4be289fbecef'
- SaaS/Technology/App: '1551434678-e076c223a692', '1486406146926-c627a92ad1ab', '1460925895917-afdab827c52f'
- Creator/Studio/Vlogger: '1478737270239-2f02b77fc618', '1590602847861-f357a9332bbc', '1516035069371-29a1b244cc32'
- Luxury/Fashion/Hotel: '1564507592333-c60657eea523', '1488161628813-04466f872be2', '1441986300917-64674bd600d8'
- Corporate/Finance/Business/Consulting: '1497366216548-37526070297c', '1454165804012-6e4a6a38b02b', '1486406146926-c627a92ad1ab'
- Education/Learning: '1523050854058-8df90110c9f1', '1427504494785-3a9ca7044f45'
- Store/Shop/Retail: '1472851294608-062f824d29cc', '1441986300917-64674bd600d8'
- Restaurant/Food/Cafe: '1517248135467-4c7edcad34c4', '1554118811-1e0d58224f24', '1504674900247-0877df9cc836'
- Real Estate/Home/Interior: '1564013799919-ab600027ffc6', '1580587771525-78b9dba3b914'
- Medical/Health: '1505751172876-fa1923c5c528', '1530026405186-ed1ea0ac7a63'
- Travel/Adventure: '1507525428034-b723cf961d3e', '1469854523086-cc02fe5d8800'
- Portfolio/Creative Agency: '1507238691740-187a5b1d37b8', '1513542789411-b6a5d4f31634'`;

    let userPrompt = `
      Create a complete dynamic website layout mapping for this business niche:
      Website Name: ${metadata?.websiteName || "My Site"}
      Business Name: ${metadata?.businessName || "My Brand"}
      Description: ${prompt}
      Keywords: ${metadata?.keywords || ""}
      Style Preferences: ${style}

      Your response MUST follow this JSON structure exactly:
      {
        "theme": {
          "primary": "Hex color code matching the style/niche",
          "secondary": "Hex color code matching the style/niche",
          "style": "${style}",
          "fontFamily": "Google Fonts paired naming"
        },
        "pages": [
          {
            "slug": "index",
            "title": "Home Page title",
            "description": "Short SEO meta description",
            "sections": [
              {
                "type": "HEADER",
                "order": 1,
                "content": {
                  "ctaText": "Primary Action",
                  "ctaUrl": "#contact",
                  "links": [
                    { "label": "Features", "url": "#features" },
                    { "label": "Services", "url": "#services" },
                    { "label": "Testimonials", "url": "#testimonials" },
                    { "label": "Pricing", "url": "#pricing" },
                    { "label": "Contact", "url": "#contact" }
                  ]
                }
              },
              {
                "type": "HERO",
                "order": 2,
                "content": {
                  "heading": "Headline copy related specifically to this niche (NOT generic)",
                  "subheading": "Niche-specific value proposition matching keywords and description",
                  "ctaText": "Action Button Text",
                  "ctaUrl": "#contact",
                  "secondaryCtaText": "Secondary Action",
                  "secondaryCtaUrl": "#features",
                  "imageUrl": "Unsplash URL matching niche from instructions"
                }
              },
              {
                "type": "FEATURES",
                "order": 3,
                "content": {
                  "items": [
                    { "title": "Niche-specific Feature 1", "description": "Short copy explanation" },
                    { "title": "Niche-specific Feature 2", "description": "Short copy explanation" },
                    { "title": "Niche-specific Feature 3", "description": "Short copy explanation" }
                  ]
                }
              },
              {
                "type": "SERVICES",
                "order": 4,
                "content": {
                  "services": [
                    { "title": "Niche-specific Service 1", "desc": "Detailed explanation of service offered", "badge": "Optional badge text" },
                    { "title": "Niche-specific Service 2", "desc": "Detailed explanation of service offered" },
                    { "title": "Niche-specific Service 3", "desc": "Detailed explanation of service offered" }
                  ]
                }
              },
              {
                "type": "TESTIMONIALS",
                "order": 5,
                "content": {
                  "testimonials": [
                    { "quote": "Testimonial quote matching niche context", "author": "Reviewer Name", "role": "Reviewer Role" },
                    { "quote": "Testimonial quote matching niche context", "author": "Reviewer Name 2", "role": "Reviewer Role 2" }
                  ]
                }
              },
              {
                "type": "PRICING",
                "order": 6,
                "content": {
                  "plans": [
                    { "name": "Basic", "price": "$19", "desc": "Starter description", "items": ["Item A", "Item B"], "featured": false },
                    { "name": "Pro", "price": "$49", "desc": "Most popular description", "items": ["Item A", "Item B", "Item C"], "featured": true },
                    { "name": "Enterprise", "price": "$149", "desc": "Scale description", "items": ["All features", "API Access"] }
                  ]
                }
              },
              {
                "type": "FAQS",
                "order": 7,
                "content": {
                  "faqs": [
                    { "q": "Frequently asked question 1?", "a": "Answer text matching the business context" },
                    { "q": "Frequently asked question 2?", "a": "Answer text matching the business context" }
                  ]
                }
              },
              {
                "type": "CTA",
                "order": 8,
                "content": {
                  "heading": "Conversion heading",
                  "subheading": "Supporting subtitle",
                  "ctaText": "Convert button text",
                  "ctaUrl": "#contact"
                }
              },
              {
                "type": "ABOUT",
                "order": 9,
                "content": {
                  "heading": "About heading",
                  "body": "Detailed about text describing history, team, or motivation.",
                  "imageUrl": "Unsplash URL matching niche from instructions"
                }
              },
              {
                "type": "CONTACT",
                "order": 10,
                "content": {
                  "heading": "Get in touch",
                  "email": "hello@company.com",
                  "phone": "+1 (555) 123-4567"
                }
              },
              {
                "type": "FOOTER",
                "order": 11,
                "content": {}
              }
            ]
          }
        ]
      }
    `;

    if (metadata?.ecommerce) {
      userPrompt += `
      
      CRITICAL REQUIREMENT (E-COMMERCE SITE):
      Because this is an e-commerce website, you MUST also add a top-level "products" array in your JSON output (sibling to "theme" and "pages").
      Generate exactly 6 niche-specific products matching this business niche. Do NOT make them generic.
      
      Format the "products" array as follows:
      "products": [
        {
          "name": "Niche-specific product name (e.g., 'Retro Mechanical Gaming Keyboard')",
          "description": "Engaging description showing key features, sizing, and details",
          "price": 2499, // price in INR as an integer (e.g. 599 to 15000)
          "inventory": 100, // starting stock integer
          "category": "Niche category (e.g., 'Keyboards')",
          "variants": ["Red Switch", "Blue Switch"], // string array of product options/variants
          "specifications": { "Brand": "KeyBrand", "Warranty": "1 Year" }, // key-value metadata record
          "imageUrl": "Unsplash photo URL (use the Unsplash photo URL format specified above matching the product type)"
        }
      ]
      `;
    }

    return this.generateJson<any>({
      prompt: userPrompt,
      systemPrompt
    }, preferredProvider || "gemini");
  }
}
