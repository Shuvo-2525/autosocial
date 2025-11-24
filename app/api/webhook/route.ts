import { NextResponse } from 'next/server';
import { getActiveKnowledge, logInteraction, getAccountCredentials } from '@/lib/db-service';
import { analyzeCommentWithAI } from '@/lib/ai-service';
// --- ADDED THIS IMPORT ---
import { deleteFromSocialMedia, replyToSocialMedia } from '@/lib/social-api'; 

export async function POST(req: Request) {
  try {
    // 1. INGESTION
    const body = await req.json();
    const { comment, author, platform, platformId, externalId } = body;

    if (!comment || !platform || !externalId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. VERIFICATION
    const credentials = await getAccountCredentials(platform, platformId);
    
    // Note: If testing without credentials in DB, this will result in undefined accessToken,
    // which our social-api handles gracefully (skips the call).

    // 3. CONTEXT
    const knowledgeBase = await getActiveKnowledge();

    // 4. ANALYSIS
    const startTime = Date.now();
    const aiResult = await analyzeCommentWithAI(comment, knowledgeBase);
    const processingTime = Date.now() - startTime;

    // 5. ACTION TAKEN
    let finalStatus: 'REPLIED' | 'DELETED' | 'IGNORED' = 'IGNORED';

    if (aiResult.isAbusive) {
      finalStatus = 'DELETED';
      console.log(`[${platform}] DELETING comment from ${author}:`, aiResult.reason);
      
      // --- UPDATED: Real Call ---
      if (credentials) {
        await deleteFromSocialMedia(platform, externalId, credentials.accessToken);
      }

    } else if (aiResult.reply) {
      finalStatus = 'REPLIED';
      console.log(`[${platform}] REPLYING to ${author}:`, aiResult.reply);
      
      // --- UPDATED: Real Call ---
      if (credentials) {
        await replyToSocialMedia(platform, externalId, aiResult.reply, credentials.accessToken);
      }
    }

    // 6. LOGGING
    await logInteraction({
      externalId,
      platform,
      author,
      text: comment,
      timestamp: new Date(),
      status: finalStatus,
      isAbusive: aiResult.isAbusive,
      aiReply: aiResult.reply,
      processingTimeMs: processingTime
    });

    return NextResponse.json({ 
      success: true, 
      action: finalStatus, 
      reply: aiResult.reply,
      reason: aiResult.reason 
    });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}