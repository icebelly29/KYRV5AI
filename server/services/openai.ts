import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface LegalChatRequest {
  message: string;
  context: Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }>;
  category?: string;
  sessionId: string;
}

export interface LegalChatResponse {
  response: string;
  citations: string;
  responseId: string;
  category?: string;
}

// Enhanced legal knowledge base for UK law
const legalKnowledgeBase = {
  employment: {
    keywords: ['job', 'work', 'employer', 'fired', 'dismissed', 'wages', 'salary', 'overtime', 'holiday', 'sick leave', 'discrimination', 'harassment', 'redundancy', 'notice period', 'contract', 'tribunal', 'unfair dismissal', 'maternity', 'paternity'],
    context: "UK Employment law including Employment Rights Act 1996, National Minimum Wage Act 1998, Equality Act 2010, Working Time Regulations 1998"
  },
  housing: {
    keywords: ['rent', 'landlord', 'tenant', 'eviction', 'deposit', 'repairs', 'housing', 'lease', 'council', 'homeless', 'section 21', 'section 8', 'assured shorthold'],
    context: "UK Housing law including Housing Act 1988, Landlord and Tenant Act 1985, Housing Act 2004, Tenancy Deposit Schemes"
  },
  consumer: {
    keywords: ['purchase', 'refund', 'warranty', 'guarantee', 'faulty', 'goods', 'services', 'shop', 'online', 'delivery', 'return', 'cancellation'],
    context: "UK Consumer law including Consumer Rights Act 2015, Consumer Contracts Regulations 2013"
  },
  police: {
    keywords: ['police', 'arrest', 'stop', 'search', 'custody', 'interview', 'solicitor', 'rights', 'caution', 'bail', 'charge', 'detention'],
    context: "UK Police powers and citizen rights including Police and Criminal Evidence Act 1984 (PACE), Human Rights Act 1998"
  },
  family: {
    keywords: ['divorce', 'separation', 'custody', 'child support', 'maintenance', 'marriage', 'domestic violence', 'family court'],
    context: "UK Family law including Children Act 1989, Divorce Dissolution and Separation Act 2020, Family Law Act 1996"
  },
  benefits: {
    keywords: ['benefits', 'universal credit', 'jobseekers', 'esa', 'pip', 'disability', 'housing benefit', 'council tax'],
    context: "UK Benefits and social security including Welfare Reform Act 2012, Social Security Administration Act 1992"
  }
};

function detectCategory(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  for (const [category, data] of Object.entries(legalKnowledgeBase)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

function buildSystemPrompt(category: string): string {
  const categoryContext = legalKnowledgeBase[category as keyof typeof legalKnowledgeBase]?.context || 
    "General UK legal information";

  return `You are a specialized UK Legal Rights AI assistant with expertise in ${categoryContext}.

CRITICAL INSTRUCTIONS:
1. Provide accurate, current UK legal information only
2. Always cite relevant UK legislation, acts, and regulations
3. Include specific sections where applicable
4. Clarify that this is general information, not specific legal advice
5. Recommend consulting a qualified UK solicitor for specific cases
6. Use clear, accessible language while maintaining legal accuracy
7. Structure responses with clear headings and bullet points
8. Include practical next steps where appropriate

RESPONSE FORMAT:
- Start with a brief summary of the legal position
- Provide detailed explanation with relevant law citations
- Include practical advice and next steps
- End with appropriate disclaimers

LEGAL CONTEXT: ${categoryContext}

Remember: Always maintain professional tone and provide comprehensive, accurate UK legal information.`;
}

export async function generateLegalResponse(request: LegalChatRequest): Promise<LegalChatResponse> {
  try {
    const category = request.category || detectCategory(request.message);
    const systemPrompt = buildSystemPrompt(category);
    
    // Build conversation history for context
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add recent context (last 10 messages)
    const recentContext = request.context.slice(-10);
    for (const contextMessage of recentContext) {
      messages.push({
        role: contextMessage.role,
        content: contextMessage.content
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: request.message
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1500,
      temperature: 0.1, // Low temperature for factual legal information
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const responseContent = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
    
    // Generate response ID for tracking
    const responseId = `LR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Extract or generate citations based on category
    const citations = generateCitations(category, responseContent);

    return {
      response: responseContent,
      citations,
      responseId,
      category
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Fallback response
    return {
      response: "I apologize, but I'm experiencing technical difficulties with the AI service. Please try again in a moment, or contact support if the issue persists. For immediate legal guidance, please consult Citizens Advice or a qualified UK solicitor.",
      citations: "Fallback response - API connection failed",
      responseId: `ERR-${Date.now()}`,
      category: request.category || 'general'
    };
  }
}

function generateCitations(category: string, response: string): string {
  const baseCitations = {
    employment: "Employment Rights Act 1996, National Minimum Wage Act 1998, Equality Act 2010, Working Time Regulations 1998, ACAS Employment Law Guide 2024",
    housing: "Housing Act 1988, Landlord and Tenant Act 1985, Housing Act 2004, Tenancy Deposit Schemes, Consumer Rights Act 2015",
    consumer: "Consumer Rights Act 2015, Consumer Contracts Regulations 2013, Consumer Credit Act 1974, Competition and Markets Authority Guidelines",
    police: "Police and Criminal Evidence Act 1984 (PACE), Human Rights Act 1998, Criminal Justice and Public Order Act 1994",
    family: "Children Act 1989, Divorce Dissolution and Separation Act 2020, Family Law Act 1996, Civil Partnership Act 2004",
    benefits: "Welfare Reform Act 2012, Universal Credit Regulations 2013, Social Security Administration Act 1992, DWP Guidance 2024",
    general: "UK Legal System, Human Rights Act 1998, Citizens Advice Legal Guidance"
  };

  return baseCitations[category as keyof typeof baseCitations] || baseCitations.general;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    return response.choices.length > 0;
  } catch (error) {
    console.error('OpenAI Health Check Failed:', error);
    return false;
  }
}
