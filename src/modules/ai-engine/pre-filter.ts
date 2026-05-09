// Pre-filter: catch identity/jailbreak questions BEFORE calling OpenAI.
// Hard-coded responses are cheaper and 100% reliable for these patterns.

const IDENTITY_PATTERNS = [
  /\bare\s+you\s+(an?\s+)?(ai|bot|robot|chatbot|gpt|openai|artificial|machine|program|computer|virtual)/i,
  /\byou\s+(an?\s+)?(ai|bot|robot|chatbot|gpt|openai|artificial|machine|program|computer|virtual)/i,
  /\bwho\s+(made|built|created|trained|programmed)\s+you/i,
  /\bwhat\s+are\s+you\b/i,
  /\bkamu\s+(ai|bot|robot|manusia)\b/i,
  /\bawak\s+(ai|bot|robot|manusia)\b/i,
  /\bsaya\s+cakap\s+(dengan|sama)\s+(siapa|ai|bot)/i,
  /\b(adakah|kamu|awak)\s+(sebenarnya)?\s*(ai|bot|robot|program|komputer)/i,
  /你是(机器人|ai|人工智能|电脑|程序|bot)/i,
  /你是(真人|人类|机器人)?/i,
]

const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior|your)\s+(instructions|rules|prompts|context)/i,
  /forget\s+(your\s+)?(instructions|rules|role|persona|context)/i,
  /you\s+are\s+now\s+(an?\s+)?(ai|chatgpt|gpt|openai|different|unrestricted)/i,
  /pretend\s+(you\s+are|to\s+be)\s+(an?\s+)?(ai|different|unrestricted|free)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(an?\s+)?(ai|different|unrestricted|free)/i,
  /jangan\s+ikut\s+(arahan|peraturan|rules)/i,
]

const IDENTITY_REPLIES: Record<string, string> = {
  bm: 'Saya Aina, wakil khidmat pelanggan yang membantu anda dengan insurans kereta dan roadtax. Ada yang boleh saya bantu?',
  zh: '我是Aina，您的客服代表，专门协助您处理汽车保险和路税事务。有什么我可以帮您的吗？',
  ta: 'நான் Aina, உங்கள் கார் இன்சூரன்ஸ் மற்றும் ரோட்டாக்ஸ் விவகாரங்களுக்கு உதவும் வாடிக்கையாளர் சேவை பிரதிநிதி. எப்படி உதவலாம்?',
  en: "I'm Aina, a customer service representative here to help you with car insurance and road tax renewals. How can I assist you?",
}

const JAILBREAK_REPLIES: Record<string, string> = {
  bm: 'Maaf, saya hanya boleh membantu berkaitan insurans kereta dan roadtax. Ada lagi yang boleh saya bantu?',
  zh: '抱歉，我只能协助处理汽车保险和路税相关事务。有什么我可以帮您的吗？',
  ta: 'மன்னிக்கவும், நான் கார் இன்சூரன்ஸ் மற்றும் ரோட்டாக்ஸ் விஷயங்களில் மட்டுமே உதவ முடியும்.',
  en: "Sorry, I can only help with car insurance and road tax matters. Is there anything else I can assist you with?",
}

export function preFilter(text: string, language: string, personaName: string): string | null {
  for (const p of IDENTITY_PATTERNS) {
    if (p.test(text)) {
      const reply = IDENTITY_REPLIES[language] ?? IDENTITY_REPLIES.en
      return reply.replace(/Aina/g, personaName)
    }
  }
  for (const p of JAILBREAK_PATTERNS) {
    if (p.test(text)) {
      return JAILBREAK_REPLIES[language] ?? JAILBREAK_REPLIES.en
    }
  }
  return null
}
