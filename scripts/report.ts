import 'dotenv/config';
import { executeDailyReport } from '../src/telegram_reporter';

async function main() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log('Environment Check:');
  console.log(`- GEMINI_API_KEY: ${geminiKey ? '✅ Present' : '⚠️ Missing (Will use rule-based fallback)'}`);
  console.log(`- TELEGRAM_BOT_TOKEN: ${botToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`- TELEGRAM_CHAT_ID: ${chatId ? `✅ Present (${chatId})` : '❌ Missing'}`);

  if (!botToken || !chatId) {
    console.error('\n❌ ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in GitHub Secrets or .env file.');
    process.exit(1);
  }

  try {
    const outcome = await executeDailyReport({
      reportType: 'full13',
      botToken,
      chatId,
      geminiApiKey: geminiKey,
    });

    if (outcome.success) {
      console.log('\n🎉 S1 Telegram Report dispatched successfully without error.');
      process.exit(0);
    } else {
      console.error('\n❌ Failed to deliver one or more reports:', outcome.results);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unhandled exception during report execution:', error);
    process.exit(1);
  }
}

main();
