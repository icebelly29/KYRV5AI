import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

// Alternative free AI service configuration
const HUGGING_FACE_API = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large";
const TOGETHER_AI_API = "https://api.together.xyz/inference";

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
    // Try free alternatives first if OpenAI fails
    const category = request.category || detectCategory(request.message);
    
    // Try OpenAI first
    try {
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
        temperature: 0.1,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const responseContent = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      const responseId = `LR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const citations = generateCitations(category, responseContent);

      return {
        response: responseContent,
        citations,
        responseId,
        category
      };

    } catch (openaiError) {
      console.log('OpenAI failed, trying free alternative...');
      
      // Try free Groq API as fallback
      try {
        const groqResponse = await tryGroqAPI(request.message, category);
        if (groqResponse) {
          return groqResponse;
        }
      } catch (groqError) {
        console.log('Groq failed, using enhanced fallback...');
      }
      
      // If all else fails, use enhanced fallback
      const fallbackResponse = generateFallbackResponse(category, request.message);
      
      return {
        response: fallbackResponse,
        citations: generateCitations(category, fallbackResponse),
        responseId: `DEMO-${Date.now()}`,
        category
      };
    }

  } catch (error) {
    console.error('All AI services failed:', error);
    
    const category = request.category || detectCategory(request.message);
    const fallbackResponse = generateFallbackResponse(category, request.message);
    
    return {
      response: fallbackResponse,
      citations: generateCitations(category, fallbackResponse),
      responseId: `DEMO-${Date.now()}`,
      category
    };
  }
}

// Free Groq API integration (no signup required for basic usage)
async function tryGroqAPI(message: string, category: string): Promise<LegalChatResponse | null> {
  // This would require a Groq API key, but they offer generous free tiers
  // For now, return null to use fallback
  return null;
}

function generateFallbackResponse(category: string, message: string): string {
  const fallbackResponses = {
    employment: `**Employment Rights Information**

Based on your question about "${message.substring(0, 50)}...", here's some key UK employment law information:

**Your Key Rights:**
• **Contract Terms**: You're entitled to written terms within 2 months of starting work
• **Minimum Wage**: Currently £10.42/hour for those 23+ (April 2023 rates)
• **Notice Periods**: Minimum 1 week (1 month-2 years service), 1 week per year thereafter
• **Unfair Dismissal**: Protected after 2 years continuous service
• **Discrimination**: Protected against discrimination based on age, disability, gender, race, religion, sexual orientation

**Next Steps:**
1. Check your written contract terms
2. Keep records of all communications with your employer
3. Consider contacting ACAS (Advisory, Conciliation and Arbitration Service) for free guidance
4. If needed, consult with an employment solicitor

**Important**: This is general information only. For specific legal advice about your situation, please consult a qualified UK employment solicitor.`,

    housing: `**Housing & Tenancy Rights Information**

Regarding your housing question "${message.substring(0, 50)}...", here are your key UK tenant rights:

**Your Rights as a Tenant:**
• **Deposit Protection**: Landlords must protect your deposit in a government-approved scheme
• **Repairs**: Landlords must maintain the property structure and utilities
• **Notice**: Landlords must give proper notice before entering (usually 24 hours)
• **Eviction**: Specific legal procedures must be followed for eviction
• **Safe Housing**: Property must meet safety and habitability standards

**Common Protections:**
• Section 21 notices require 2 months' notice (for assured shorthold tenancies)
• Section 8 notices require specific grounds and procedures
• Rent increases must follow proper procedures
• Harassment by landlords is illegal

**Next Steps:**
1. Check your tenancy agreement type
2. Document any issues with photos and written records
3. Contact Shelter (housing charity) for free advice
4. Consider local council housing department for serious issues

**Important**: This is general information only. For specific legal advice about your housing situation, please consult a qualified UK housing solicitor.`,

    consumer: `**Consumer Rights Information**

About your consumer rights question "${message.substring(0, 50)}...", here's what UK law protects:

**Your Consumer Rights:**
• **Goods Must Be**: As described, fit for purpose, and of satisfactory quality
• **Refund Rights**: 30 days for faulty goods, up to 6 months for other issues
• **Repair/Replace**: Right to repair or replacement before refund
• **Services**: Must be carried out with reasonable care and skill
• **Distance Selling**: 14-day cooling-off period for online/phone purchases

**Key Laws:**
• Consumer Rights Act 2015
• Consumer Contracts Regulations 2013
• Sale of Goods Act 1979 (still applies in some cases)

**Next Steps:**
1. Contact the trader first to resolve the issue
2. Keep all receipts and documentation
3. Contact Citizens Advice for free guidance
4. Consider Alternative Dispute Resolution (ADR)
5. Small claims court for unresolved disputes

**Important**: This is general information only. For specific legal advice about your consumer issue, please consult a qualified UK consumer rights solicitor.`,

    general: `**UK Legal Information**

Thank you for your question about "${message.substring(0, 50)}...". While I'm currently unable to provide AI-powered responses due to API limitations, here's some general guidance:

**Key UK Legal Resources:**
• **Citizens Advice**: Free, confidential advice on legal issues
• **Law Society**: Find qualified solicitors in your area
• **Gov.uk**: Official government legal guidance
• **Legal Aid**: May be available for certain cases

**Common Legal Areas:**
• Employment law and workplace rights
• Housing and tenancy issues
• Consumer rights and purchases
• Family law and relationships
• Immigration and nationality
• Benefits and social security

**Next Steps:**
1. Contact Citizens Advice for free initial guidance
2. Check if you qualify for legal aid
3. Consider consulting with a qualified solicitor
4. Keep detailed records of your situation

**Important**: This is general information only. For specific legal advice about your situation, please consult a qualified UK solicitor.

*Note: The AI service will provide more detailed, context-aware responses once the API quota is restored.*`
  };

  return fallbackResponses[category as keyof typeof fallbackResponses] || fallbackResponses.general;
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
