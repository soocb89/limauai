import { db } from './index.js'

const defaults: Record<string, string> = {
  tone: 'friendly',
  persona_name: 'Aina',
  language_fallback: 'bm',
  handoff_threshold: '0.6',
  handoff_hold_msg_bm: 'Sila tunggu sebentar, agen kami akan membantu anda.',
  handoff_hold_msg_zh: '请稍等，我们的客服将为您服务。',
  handoff_hold_msg_ta: 'கொஞ்சம் காத்திருங்கள், எங்கள் முகவர் உதவுவார்.',
  handoff_hold_msg_en: 'Please wait, our agent will attend to you shortly.',
  owner_phone: process.env.OWNER_PHONE ?? '',
}

async function seed() {
  for (const [key, value] of Object.entries(defaults)) {
    await db.query(
      'INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    )
  }
  console.log('Seed complete.')
  await db.end()
}

seed().catch(err => { console.error(err); process.exit(1) })
