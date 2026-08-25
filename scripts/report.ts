import 'dotenv/config';
import { executeDailyReport } from '../src/telegram_reporter';

async function main() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const reportTypeArg = (process.env.REPORT_TYPE || process.argv[2] || 'dual') as
    | 'dual'
    | 'full13'
    | 'quick'
    | 'both'
    | 'dailyInput';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 SYSTEM S1 - GITHUB ACTIONS AUTOMATED REPORTER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Environment Check:');
  console.log(`- GEMINI_API_KEY: ${geminiKey ? '✅ Present (Google Search Grounding Active)' : '⚠️ Missing (Using Direct Crypto REST APIs + S1 Validation Core)'}`);
  console.log(`- TELEGRAM_BOT_TOKEN: ${botToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`- TELEGRAM_CHAT_ID: ${chatId ? `✅ Present (${chatId})` : '❌ Missing'}`);
  console.log(`- REPORT_TYPE: ${reportTypeArg} (Default: Dual Pipeline 2-Step)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!botToken || !chatId) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in GitHub Secrets or .env file.');
    console.error('Please visit your GitHub repository -> Settings -> Secrets and variables -> Actions and add them.');
    process.exit(1);
  }

  try {
    const outcome = await executeDailyReport({
      reportType: reportTypeArg,
      botToken,
      chatId,
      geminiApiKey: geminiKey,
    });

    if (outcome.success) {
      console.log('\n🎉 S1 Telegram Report dispatched successfully to Telegram without error.');
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

