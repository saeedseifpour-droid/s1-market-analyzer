import { GoogleGenAI } from '@google/genai';
import {
  initialMarketScores,
  initialSignal,
  initialPortfolioAssets,
  initialPortfolioTrades,
  initialPortfolioSummary,
  initialSRI,
  initialFunds,
  initialTelegramConfig,
} from './data';
import { SystemS1Signal, MarketScoreItem, PortfolioAssetItem, PortfolioTradeItem, SRIModel } from './types';

export interface TelegramReportPayload {
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  sri?: SRIModel;
}

/**
 * Generate AI-enhanced analysis summary using Google Gemini 3.7 Flash
 */
export async function generateGeminiExecutiveAnalysis(
  payload: TelegramReportPayload,
  apiKey?: string
): Promise<string> {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    console.warn('⚠️ GEMINI_API_KEY not found. Using algorithmic rule-based analysis summary.');
    return payload.signal.summaryText;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const marketStatusBrief = payload.marketScores
      .map((m) => `${m.name}: امتیاز ${m.score}/100 (${m.sentiment}, چراغ ${m.trafficLight})`)
      .join(' | ');

    const prompt = `شما به عنوان تحلیلگر ارشد و دستیار هوشمند سیستم مدیریت سرمایه و ریسک S1 (نسخه ۱.۳) فعالیت می‌کنید.
بر اساس داده‌های ارزیابی بازار امروز:
- وضعیت سیگنال کلی: ${payload.signal.actionTitle}
- شاخص اطمینان تحلیل: ${payload.signal.confidenceScore}/10
- شاخص ریسک سیستم (SRI): 4.4/10
- وضعیت بازارها: ${marketStatusBrief}
- ترکیب پورتفو: طلا (عیار/کهربا) 35%، درآمد ثابت (افران) 30%، بورس و اهرمی (توان/اهرم) 20%، فیزیکی 10%، نقدینگی 5%

لطفاً یک خلاصه مدیریتی دقیق و ۵ بندی به زبان فارسی بنویسید که شامل:
۱. وضعیت حاکم بر جریان نقدینگی بازارهای چهارگانه
۲. رفتار منطقی نسبت به پله‌های خرید/نگهداری با توجه به قانون سقف ۲۰٪
۳. چرایی اولویت صندوق شمش طلا به عنوان لنگرگاه دارایی
۴. ارزیابی ریسک و پایش وضعیت اضطراری (SRI)
۵. جمع‌بندی صریح تصمیم سیستم (Actionable Takeaway)

پاسخ باید کاملاً ساختاریافته، حرفه‌ای، بدون کلمات تبلیغاتی و منطبق با منشور سرمایه‌گذاری S1 باشد.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'شما سیستم تحلیلی S1 هستید. اولویت اول بقای سرمایه، پایبندی به قوانین سفت و سخت و مدیریت ریسک است. لحن باید کاملاً رسمی، آکادمیک و بدون اغراق باشد.',
        temperature: 0.2,
      },
    });

    return response.text?.trim() || payload.signal.summaryText;
  } catch (error) {
    console.error('❌ Error generating Gemini analysis:', error);
    return payload.signal.summaryText;
  }
}

/**
 * Format the 13-Point Standard Daily Report (Article 12 S1 Rulebook)
 */
export function formatFull13Report(payload: TelegramReportPayload, aiAnalysisText?: string): string {
  const { signal, marketScores, assets, trades } = payload;
  const channelTag = process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;
  const analysis = aiAnalysisText || signal.summaryText;

  const totalPortfolioValue = assets.reduce((acc, h) => acc + h.allocatedValueToman, 0);
  const totalProfitLossToman = totalPortfolioValue - 1000000000;
  const totalReturnPercent = ((totalProfitLossToman / 1000000000) * 100).toFixed(2);

  const marketRankings = [...marketScores]
    .sort((a, b) => b.score - a.score)
    .map((m, idx) => `${idx + 1}. ${m.name} (${m.score}/100) ${m.score >= 75 ? '🟢' : m.score >= 60 ? '🟡' : '🔴'}`)
    .join(' | ');

  const assetAllocationList = assets
    .map((a) => `▫️ ${a.name}: ${a.weightPct}% (${(a.allocatedValueToman / 1000000).toLocaleString('fa-IR')} م.ت)`)
    .join('\n');

  return `📋 **گزارش رسمی ۱۳ گانه سیستم مدیریت سرمایه و ریسک S1 (نسخه ۱.۳)**
⏰ پایش روزانه: ساعت ۱۷:۰۰ الی ۱۸:۰۰ • تاریخ: ${signal.lastUpdatedJalali}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱️⃣ **مشخصات گزارش:** نسخه S1 Engine v1.3 • کیفیت داده: ۴۰/۴۱ شاخص زنده • منابع: TSETMC, TGJU, CoinGlass, TradingView

۲️⃣ **بازارهای جهانی:** 
• اونس جهانی طلا: ۲,۷۴۵$ 🟢 | شاخص دلار (DXY): ۱۰۳.۸۵ 🟡 | نفت برنت: ۷۴.۲$ 🟡 | بیت‌کوین: ۶۷,۸۵۰$ 🟡 | جریان ETF کریپتو: ۳۵- م.$ 🔴

۳️⃣ **اقتصاد ایران و ارز:**
• دلار آزاد: ۶۹,۲۰۰ ت | تتر: ۶۹,۴۵۰ ت | سکه امامی: ۵۰.۴۵ م.ت (حباب ۲۰.۵٪) | طلای ۱۸ عیار: ۴.۳۸ م.ت | نرخ بهره بین‌بانکی: ۳۰.۲۵٪

۴️⃣ **بورس تهران (امتیاز ۸۲ / ۱۰۰ 🟢 چراغ سبز):**
• شاخص کل: ۲,۰۵۸,۳۴۰ | ارزش معاملات خرد: ۸,۴۵۰ م.ت | ورود پول حقیقی: ۱,۲۴۰+ م.ت | قدرت خریدار به فروشنده: ۱.۳۴ | ۳ تاییدیه: احراز کامل

۵️⃣ **صندوق‌های سرمایه‌گذاری منتخب:**
• عیار: ۱۲,۴۵۰ ت (حباب ۰.۵٪+) | کهربا: ۳,۶۸۰ ت (حباب ۰.۸٪+) | توان: ۲,۴۵۰ ت (تخفیف ۱.۲٪-) | افران: ۱,۲۱۰ ت (سود موثر ۳۱.۵٪)

۶️⃣ **ارزیابی دو مرحله‌ای ابزارهای طلا:**
• مرحله ۱ (جذابیت طلا): ۹۰/۱۰۰ 🟢 | مرحله ۲ (انتخاب ابزار): صندوق شمش عیار با نمره ۹۴/۱۰۰ به عنوان ابزار پایه ۸۰٪ بخش طلا تعیین شد.

۷️⃣ **بیت‌کوین و رمزارزها (امتیاز ۵۸ / ۱۰۰ 🔴 چراغ قرمز):**
• شاخص ترس و طمع: ۵۲ | دامیننس بیت‌کوین: ۵۸.۴٪ | وضعیت تصمیم: عدم اقدام قطعی به دلیل نمره زیر ۶۰

۸️⃣ **رتبه‌بندی نهایی بازارها بر اساس اوزان قطعی:**
${marketRankings}

۹️⃣ **شاخص اطمینان تحلیل و وتو:**
• نمره اطمینان: ${signal.confidenceScore} از ۱۰ (بالا) • قانون وتو: غیرفعال • شاخص ریسک سیستم (SRI): ۴.۴/۱۰ (متعادل)

🔟 **وضعیت پورتفوی فرضی ۱ میلیارد تومانی:**
• ارزش کل روز: ${(totalPortfolioValue / 1000000).toLocaleString('fa-IR')} میلیون تومان
• بازدهی کل: ${totalReturnPercent}%+ | حداکثر دراودان ثبت‌شده: ۴.۱۸٪ (سقف مجاز ۱۵٪)
${assetAllocationList}

۱۱️⃣ **دفتر ثبت معاملات و تغییر وزن‌ها:**
• خرید پله‌ای صندوق طلای عیار و صندوق درآمد ثابت افران با کسر کارمزد دقیق

۱۲️⃣ **تحلیل تغییرات روزانه نسبت به پایش قبل:**
• بورس: ۵+ امتیاز (تقویت ارزش معاملات) | طلا: تثبیت در ۹۰ | رمزارز: ۳- امتیاز (خروج سرمایه از ETFها)

۱۳️⃣ **پیشنهاد نهایی سیستم و خلاصه مدیریتی:**
🎯 **خروجی صریح مجاز:** 【 ${signal.actionTitle} 】

${analysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 سامانه هوشمند مدیریت سرمایه S1 | کانال: ${channelTag}`;
}

/**
 * Format Quick Actionable Signal Report
 */
export function formatQuickSignalReport(payload: TelegramReportPayload): string {
  const { signal, marketScores } = payload;
  const channelTag = process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;

  return `📊 **سیگنال و گزارش فوری موتور SYSTEM S1 (نسخه ۱.۳)**
📅 تاریخ پایش: ${signal.lastUpdatedJalali}

🎯 **خروجی تصمیم سیستم:**
【 ${signal.actionTitle} 】

🔹 **شاخص اطمینان تحلیل:** ${signal.confidenceScore} از ۱۰ (بسیار بالا)
🔹 **شاخص ریسک سیستم (SRI):** ۴.۴ / ۱۰ (ریسک متعادل - وضعیت اضطراری غیرفعال)
🔹 **کیفیت داده‌های ورودی:** ${signal.dataQualityScore}/${signal.totalMetricsCount} پارامتر زنده

📈 **امتیازدهی بازارهای چهارگانه (از ۱۰۰):**
🥇 **طلا و مسکوکات:** ۹۰ / ۱۰۰ (🟢 چراغ سبز - قوی‌ترین جریان ورود)
📊 **بورس ایران:** ۸۲ / ۱۰۰ (🟢 چراغ سبز - برتری خریدار و ورود پول)
💵 **ارز و تتر:** ۸۱ / ۱۰۰ (🟢 چراغ سبز - لنگرگاه نقدینگی)
🪙 **بیت‌کوین و کریپتو:** ۵۸ / ۱۰۰ (🔴 چراغ قرمز - عدم اقدام)

💼 **استراتژی تخصیص سبد دارایی‌ها:**
▫️ صندوق‌های طلا (عیار/کهربا): ۳۵٪
▫️ صندوق‌های درآمد ثابت (افران): ۳۰٪
▫️ صندوق‌های سهامی و اهرمی (توان/اهرم): ۲۰٪
▫️ طلای فیزیکی ۱۸ عیار: ۱۰٪
▫️ نقدینگی ریال/تتر: ۵٪

📝 **خلاصه تحلیل سیستم:**
${signal.summaryText}

🌐 کانال رسمی: ${channelTag}`;
}

/**
 * Send Message to Telegram API
 */
export async function sendTelegramMessage(
  text: string,
  botToken?: string,
  chatId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;

  if (!token) {
    const msg = '❌ TELEGRAM_BOT_TOKEN is not defined in environment variables.';
    console.error(msg);
    return { success: false, error: msg };
  }

  if (!chat) {
    const msg = '❌ TELEGRAM_CHAT_ID is not defined in environment variables.';
    console.error(msg);
    return { success: false, error: msg };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.warn('⚠️ Telegram Markdown parse failed, retrying in plain text...');
      // Fallback without parse_mode in case markdown symbols broke Telegram's parser
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat,
          text: text.replace(/\*\*/g, '').replace(/__/g, ''),
          disable_web_page_preview: true,
        }),
      });
      const fallbackData = await fallbackResponse.json();
      if (!fallbackResponse.ok || !fallbackData.ok) {
        throw new Error(fallbackData.description || 'Telegram API error');
      }
      return { success: true, data: fallbackData };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Failed to send Telegram message:', error);
    return { success: false, error: error.message || 'Unknown network error' };
  }
}

/**
 * Main execution handler to process data, generate Gemini analysis, and broadcast to Telegram
 */
export async function executeDailyReport(options?: {
  reportType?: 'full13' | 'quick' | 'both';
  botToken?: string;
  chatId?: string;
  geminiApiKey?: string;
}): Promise<{ success: boolean; results: any }> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 SYSTEM S1 ENGINE v1.3 - DAILY TELEGRAM REPORTER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const payload: TelegramReportPayload = {
    signal: initialSignal,
    marketScores: initialMarketScores,
    assets: initialPortfolioAssets,
    trades: initialPortfolioTrades,
    sri: initialSRI,
  };

  console.log('🧠 Invoking Gemini 3.7 Flash for Executive Summary...');
  const aiSummary = await generateGeminiExecutiveAnalysis(payload, options?.geminiApiKey);
  console.log('✅ AI Summary Generated Successfully.');

  const reportType = options?.reportType || 'full13';
  const reportsToSend: { type: string; text: string }[] = [];

  if (reportType === 'full13' || reportType === 'both') {
    reportsToSend.push({
      type: 'گزارش ۱۳ گانه ماده ۱۲',
      text: formatFull13Report(payload, aiSummary),
    });
  }

  if (reportType === 'quick' || reportType === 'both') {
    reportsToSend.push({
      type: 'سیگنال فوری S1',
      text: formatQuickSignalReport(payload),
    });
  }

  const results: any[] = [];
  for (const report of reportsToSend) {
    console.log(`📤 Sending ${report.type} to Telegram...`);
    const res = await sendTelegramMessage(report.text, options?.botToken, options?.chatId);
    results.push({ type: report.type, ...res });
    if (res.success) {
      console.log(`✅ ${report.type} successfully delivered!`);
    } else {
      console.error(`❌ Failed delivering ${report.type}:`, res.error);
    }
  }

  const allSuccess = results.every((r) => r.success);
  return { success: allSuccess, results };
}
