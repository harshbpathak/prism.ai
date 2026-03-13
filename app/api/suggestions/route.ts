import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { getAIKeyForModule } from "@/lib/ai-config"
import { generateObject, type CoreMessage } from "ai"
import { NextResponse } from "next/server"
import { z } from "zod"

// Allow processing up to 30 seconds
export const maxDuration = 30

// Zod schema for supply chain suggestions
const SupplyChainSuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      id: z.string().describe("Unique identifier for the suggestion"),
      title: z.string()
        .min(1)
        .max(50)
        .describe("Brief title of the suggestion (max 3 words)"),
      description: z.string().describe("Detailed description of the suggestion that explains the supply chain context, current situation analysis, potential impact, and reasoning behind the recommendation. Should include relevant supply chain metrics, risk factors, and operational implications where applicable."),
      action: z.string().describe("Specific action to take"),
      confidence: z.number().min(0).max(100).describe("Confidence score from 0-100"),
      category: z.enum(["optimization", "risk", "efficiency", "cost", "planning"]).describe("Category of the suggestion")
    })
  )
})

const SUPPLY_CHAIN_SUGGESTION_SYSTEM_PROMPT = `
You are an AI suggestion generator for supply chain management and optimization.

Your primary purpose is to generate intelligent suggestions and autocomplete options for supply chain professionals.

Core Functions:
1. **Contextual Suggestions**: Analyze supply chain data (nodes, edges, risks) and provide 3-5 actionable suggestions for:
   - Optimization strategies
   - Risk mitigation 
   - Efficiency improvements
   - Cost reduction
   - Strategic planning

2. **Smart Autocomplete**: Complete user input with relevant supply chain queries and commands

3. **Suggestion Categories**: Always categorize suggestions as:
   - optimization: Process and workflow improvements
   - risk: Risk assessment and mitigation strategies  
   - efficiency: Performance and throughput enhancements
   - cost: Cost reduction and budget optimization
   - planning: Strategic and operational planning

Response Format:
- For suggestions: Return valid JSON with "suggestions" array
- For autocomplete: Return valid JSON with "suggestions" array
- Each suggestion must include: id, title (max 3 words), description, action, confidence (0-100), category
- Be concise, actionable, and data-driven
- Use supply chain terminology (lead time, buffer %, throughput, disruption index, etc.)
- Keep titles very short (maximum 3 words)

Example Response (EXACT FORMAT REQUIRED):
{
  "suggestions": [
    {
      "id": "opt-001",
      "title": "Optimize Buffers",
      "description": "Current safety stock levels appear excessive for low-risk suppliers",
      "action": "Reduce safety stock by 15% for suppliers with risk scores < 0.3",
      "confidence": 85,
      "category": "optimization"
    },
    {
      "id": "risk-002", 
      "title": "Diversify Suppliers",
      "description": "Single supplier dependency creates vulnerability",
      "action": "Identify and evaluate alternative suppliers in different regions",
      "confidence": 90,
      "category": "risk"
    }
  ]
}

CRITICAL REQUIREMENTS:
- ALWAYS return ONLY valid JSON matching the exact structure above
- NO markdown, NO explanations, NO conversational text
- Title MUST be 1-3 words maximum
- Category MUST be one of: optimization, risk, efficiency, cost, planning
- Confidence MUST be a number between 0-100
- Always include 3-5 suggestions in the array
`;

export async function POST(req: Request) {
  console.group('🌐 Chat API Request Started')
  console.log('Request URL:', req.url)
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Validate request
    if (!req.body) {
      console.error("Chat API: Empty request body received")
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "REQUEST_VALIDATION_ERROR", 
          message: "Request body is required" 
        },
        { status: 400 }
      )
    }

    let messages: CoreMessage[]
    try {
      const body = await req.json()
      console.log('Request body parsed:', body)
      messages = body.messages
    } catch (parseError) {
      console.error("Chat API: JSON parsing failed:", parseError)
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "JSON_PARSE_ERROR", 
          message: "Invalid JSON in request body" 
        },
        { status: 400 }
      )
    }

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Chat API: Invalid messages array:", messages)
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "MESSAGES_VALIDATION_ERROR", 
          message: "Messages array is required and must not be empty" 
        },
        { status: 400 }
      )
    }

    console.log('Messages received:', messages.length, 'messages')

    // Validate message format
    const invalidMessage = messages.find(msg => 
      !msg.role || !msg.content || 
      typeof msg.content !== 'string' ||
      !['user', 'assistant', 'system'].includes(msg.role)
    )
    
    if (invalidMessage) {
      console.error("Chat API: Invalid message format:", invalidMessage)
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "MESSAGE_FORMAT_ERROR", 
          message: "Each message must have valid role and content" 
        },
        { status: 400 }
      )
    }

    // Check for API key availability
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Chat API: Google AI API key not configured")
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "SERVICE_CONFIGURATION_ERROR", 
          message: "AI service is temporarily unavailable. Please try again later." 
        },
        { status: 503 }
      )
    }

    console.log('All validations passed, calling AI service...')

    // Attempt to call the AI service (non-streaming)
    try {
      console.log('Creating generateObject with configuration...')
      console.log('Messages to send:', messages)
      
      // Configure Google provider with dedicated key if available
      const google = createGoogleGenerativeAI({
        apiKey: getAIKeyForModule('suggestions')
      });

      const result = await generateObject({
        model: google("gemini-2.0-flash"),
        schema: SupplyChainSuggestionSchema,
        messages: [
          { role: "system", content: SUPPLY_CHAIN_SUGGESTION_SYSTEM_PROMPT },
          ...messages
        ],
        maxTokens: 4096,
        temperature: 0.7,
      })

      // Truncate titles manually if they exceed 3 words
      const suggestions = result.object.suggestions.map(s => {
        const words = s.title.trim().split(/\s+/);
        return {
          ...s,
          title: words.length > 3 ? words.slice(0, 3).join(' ') : s.title
        };
      });

      console.log('AI service call successful:', result.object)
      console.log('Usage:', result.usage)
      console.groupEnd()
      
      return NextResponse.json({
        suggestions,
        usage: result.usage
      })
      
    } catch (aiError: any) {
      console.error("Chat API: AI service error:", aiError)
      console.log("AI Error name:", aiError.name)
      console.log("AI Error message:", aiError.message)
      console.log("AI Error stack:", aiError.stack)
      console.log("AI Error cause:", aiError.cause)
      
      // If it's a schema validation error, try a fallback approach
      if (aiError.name === 'AI_NoObjectGeneratedError' || aiError.message?.includes('schema')) {
        console.log('Schema validation failed, trying fallback approach...')
        
        try {
          // Fallback: Generate simple suggestions without strict schema
          const fallbackSuggestions = [
            {
              id: "fallback-001",
              title: "Optimize Routes",
              description: "Review current transportation routes for potential efficiency improvements",
              action: "Analyze route optimization opportunities in your supply chain",
              confidence: 75,
              category: "efficiency"
            },
            {
              id: "fallback-002", 
              title: "Risk Assessment",
              description: "Evaluate supplier risk levels and diversification opportunities",
              action: "Conduct comprehensive risk analysis of key suppliers",
              confidence: 80,
              category: "risk"
            },
            {
              id: "fallback-003",
              title: "Cost Analysis",
              description: "Identify cost reduction opportunities across the supply chain",
              action: "Review operational costs and identify savings potential",
              confidence: 70,
              category: "cost"
            }
          ];
          
          console.log('Returning fallback suggestions')
          console.groupEnd()
          
          return NextResponse.json({
            suggestions: fallbackSuggestions,
            usage: { fallback: true }
          })
          
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      }
      
      // Check for Google AI specific errors
      if (aiError.message?.includes('API_KEY_INVALID')) {
        console.log('Handling invalid API key error')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "AI_API_KEY_ERROR", 
            message: "AI service configuration error. Please contact support." 
          },
          { status: 503 }
        )
      }
      
      if (aiError.message?.includes('SAFETY')) {
        console.log('Handling safety filter error')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "AI_SAFETY_ERROR", 
            message: "Your message was blocked by safety filters. Please try rephrasing your question." 
          },
          { status: 400 }
        )
      }
      
      if (aiError.message?.includes('RECITATION')) {
        console.log('Handling recitation error')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "AI_RECITATION_ERROR", 
            message: "Unable to generate response due to content policies. Please try a different question." 
          },
          { status: 400 }
        )
      }
      
      // Handle specific AI service errors
      if (aiError.name === 'APIConnectionError') {
        console.log('Handling APIConnectionError')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "AI_CONNECTION_ERROR", 
            message: "Unable to connect to AI service. Please check your internet connection and try again." 
          },
          { status: 503 }
        )
      }
      
      if (aiError.name === 'RateLimitError') {
        console.log('Handling RateLimitError')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "RATE_LIMIT_ERROR", 
            message: "Too many requests. Please wait a moment and try again." 
          },
          { status: 429 }
        )
      }
      
      if (aiError.name === 'InvalidRequestError') {
        console.log('Handling InvalidRequestError')
        console.groupEnd()
        return NextResponse.json(
          { 
            error: "AI_REQUEST_ERROR", 
            message: "Invalid request format. Please try rephrasing your question." 
          },
          { status: 400 }
        )
      }
      
      // Handle quota/billing/retry errors - return static fallback suggestions
      if (
        aiError.message?.includes('quota') || 
        aiError.message?.includes('billing') ||
        aiError.name === 'AI_RetryError' ||
        aiError.message?.includes('RESOURCE_EXHAUSTED') ||
        aiError.message?.includes('429')
      ) {
        console.warn('Rate limit/quota hit. Returning fallback suggestions.');
        console.groupEnd();
        return NextResponse.json({
          suggestions: [
            {
              id: "quota-fallback-001",
              title: "Optimize Transportation Routes",
              description: "Review current transportation routes for potential efficiency improvements.",
              action: "Analyze route optimization opportunities in your supply chain network.",
              confidence: 75,
              category: "efficiency"
            },
            {
              id: "quota-fallback-002",
              title: "Supplier Risk Diversification",
              description: "Evaluate supplier risk levels and explore diversification opportunities.",
              action: "Conduct comprehensive risk analysis of key suppliers and identify alternatives.",
              confidence: 80,
              category: "risk"
            },
            {
              id: "quota-fallback-003",
              title: "Inventory Buffer Strategy",
              description: "Consider building safety stock buffers for critical components.",
              action: "Review inventory levels and implement buffer stock for high-risk nodes.",
              confidence: 72,
              category: "planning"
            }
          ],
          usage: { fallback: true, reason: 'rate_limit' }
        })
      }
      
      // Log the full error for unhandled cases
      console.log('Unhandled AI error details:', {
        name: aiError.name,
        message: aiError.message,
        stack: aiError.stack,
        cause: aiError.cause,
        toString: aiError.toString()
      })
      
      // Generic AI service error with more details
      console.log('Unhandled AI error, returning generic error')
      console.groupEnd()
      return NextResponse.json(
        { 
          error: "AI_SERVICE_ERROR", 
          message: "AI service encountered an error. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? aiError.message : undefined
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    // Log the full error for debugging
    console.error("Chat API: Unexpected error:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause
    })
    
    console.groupEnd()
    // Return a generic error response
    return NextResponse.json(
      { 
        error: "INTERNAL_SERVER_ERROR", 
        message: "An unexpected error occurred. Please try again later." 
      },
      { status: 500 }
    )
  }
}