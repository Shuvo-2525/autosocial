import { dbAdmin } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// --- Interfaces (Types) ---

export interface KnowledgeSnippet {
  id: string;
  content: string; // The fact (e.g., "We open at 9 AM")
  tone: string;    // e.g., "Professional"
  isActive: boolean;
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'youtube';
  platformId: string; // The Page ID or Channel ID
  accessToken: string; // The token specific to this page/channel
  name: string; // Friendly name (e.g., "My Business Page")
}

export interface CommentLog {
  externalId: string;
  platform: 'facebook' | 'youtube';
  author: string;
  text: string;
  timestamp: Date;
  status: 'PENDING' | 'REPLIED' | 'DELETED' | 'IGNORED';
  isAbusive: boolean;
  aiReply?: string | null;
  processingTimeMs?: number;
}

// --- Database Functions ---

// 1. Get the "Brain" (Active Knowledge)
export async function getActiveKnowledge(): Promise<string> {
  const snapshot = await dbAdmin
    .collection('knowledge_base')
    .where('isActive', '==', true)
    .get();

  if (snapshot.empty) return '';

  // Combine all active knowledge into one text block for Gemini
  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as KnowledgeSnippet;
      return `- [${data.tone || 'Neutral'}] ${data.content}`;
    })
    .join('\n');
}

// 2. Get Social Account Credentials
// This finds the correct token for the specific Page/Channel ID that received the comment
export async function getAccountCredentials(platform: string, platformId: string): Promise<SocialAccount | null> {
  const snapshot = await dbAdmin
    .collection('social_accounts')
    .where('platform', '==', platform)
    .where('platformId', '==', platformId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as SocialAccount;
}

// 3. Log an Interaction (The "History")
export async function logInteraction(data: CommentLog) {
  // We use .doc(data.externalId) so we don't create duplicates if the webhook fires twice
  await dbAdmin.collection('comments').doc(data.externalId).set({
    ...data,
    timestamp: FieldValue.serverTimestamp(), // Use server time for accuracy
  });
}

// 4. (Optional) Initialize Default Data
// You can call this once to seed the DB if it's empty
export async function seedDatabase() {
  const kbRef = dbAdmin.collection('knowledge_base');
  const emptyCheck = await kbRef.limit(1).get();
  
  if (emptyCheck.empty) {
    await kbRef.add({
      content: "We are a friendly company. Our support email is help@autosocial.com.",
      tone: "Helpful",
      isActive: true
    });
    console.log("Database seeded with default knowledge.");
  }
}