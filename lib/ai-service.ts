import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface AIAnalysisResult {
  isAbusive: boolean;
  reply: string | null;
  reason: string; // Why it was flagged or why this reply was chosen
}

export async function analyzeCommentWithAI(
  userComment: string,
  knowledgeBase: string
): Promise<AIAnalysisResult> {
  
  // 1. Construct the Strict Prompt
  const prompt = `
    You are an expert Social Media Manager AI for a business.
    
    ### CONTEXT (Business Knowledge):
    ${knowledgeBase || "No specific knowledge base provided. Be polite and professional."}

    ### USER COMMENT:
    "${userComment}"

    ### INSTRUCTIONS:
    1. Analyze the comment for toxicity, spam, abuse, or hate speech.
    2. If it is ABUSIVE: Set "isAbusive" to true. Do NOT generate a reply.
    3. If it is SAFE: Set "isAbusive" to false. Generate a polite, helpful reply based *strictly* on the Context provided. If the context doesn't have the answer, politely ask them to contact support.
    
    ### RESPONSE FORMAT:
    You must return a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
    Format:
    {
      "isAbusive": boolean,
      "reply": "string (or null if abusive)",
      "reason": "short explanation of your decision"
    }
  `;

  try {
    // 2. Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 3. Clean and Parse JSON
    // Sometimes AI adds markdown code blocks, we remove them to be safe
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return {
      isAbusive: data.isAbusive,
      reply: data.reply || null,
      reason: data.reason || "Processed successfully",
    };

  } catch (error) {
    console.error("AI Processing Error:", error);
    // Fallback if AI fails (Safety First)
    return {
      isAbusive: false,
      reply: null,
      reason: "AI Error - Manual review needed",
    };
  }
}