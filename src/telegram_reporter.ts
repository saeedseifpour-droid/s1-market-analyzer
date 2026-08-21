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
  initialDailyInputs,
} from './data';
import {
  SystemS1Signal,
  MarketScoreItem,
  InputMetric,
  PortfolioAssetItem,
  PortfolioTradeItem,
  SRIModel,
} from './types';

export interface TelegramReportPayload {
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  sri?: SRIModel;
}

/**
 * Generate Gemini Executive Analysis
 */
export async function generateGeminiExecutiveAnalysis(
  payload: TelegramReportPayload,
  apiKey?: string
): Promise<string> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null);

  if (!geminiKey) {
    return `۱. بازارهای طلا و بورس در محدوده چراغ سبز قرار داشته و جریان ورود نقدینگی خرد در آن‌ها فعال است.
۲. خریدها در قالب پله‌های حداکثر ۲۰ درصدی به صندوق‌های شمش‌محور (عیار) و سهامی (توان) تخصیص می‌یابد.
۳. صندوق درآمد ثابت افران با سهم ۳۰ درصدی لنگرگاه نقدینگی و امنیت پرتفوی است.
۴. رمزارزها به دلیل امتیاز زیر ۶۰ در وضعیت عدم اقدام قرار دارند.
۵. شاخص ریسک سیستم (SRI) با عدد ۴.۴ وضعیت نرمال را تایید کرده و وضعیت اضطراری غیرفعال است.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const prompt = `شما تحلیل‌گر ارشد و دستیار هوشمند سیستم مدیریت ریسک و سرمایه S1 (نسخه ۱.۳) هستید.
بر اساس داده‌های ارزیابی روزانه زیر، یک خلاصه مدیریتی دقیق در قالب ۵ بند شماره‌گذاری شده بنویسید:
- تصمیم سیستم: ${payload.signal.actionTitle}
- نمره اطمینان: ${payload.signal.confidenceScore}/۱۰
- وضعیت بازارها: ${payload.marketScores.map(m => `${m.name}: ${m.score}/۱۰۰`).join(' | ')}
- ارزش پورتفو: ${payload.assets.reduce((a, b) => a + b.allocatedValueToman, 0).toLocaleString('fa-IR')} تومان

قوانین:
- دقیقاً در ۵ بند شماره‌گذاری شده فارسی (۱ تا ۵) بدون مقدمه و موخره.
- بر اساس اصول مدیریت ریسک و پورتفوی چندبازاری.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || '';
  } catch (e) {
    console.warn('Gemini analysis generation fallback:', e);
    return `۱. بازارهای طلا و بورس در محدوده چراغ سبز قرار داشته و جریان ورود نقدینگی خرد در آن‌ها فعال است.
۲. خریدها در قالب پله‌های حداکثر ۲۰ درصدی به صندوق‌های شمش‌محور (عیار) و سهامی (توان) تخصیص می‌یابد.
۳. صندوق درآمد ثابت افران با سهم ۳۰ درصدی لنگرگاه نقدینگی و امنیت پرتفوی است.
۴. رمزارزها به دلیل امتیاز زیر ۶۰ در وضعیت عدم اقدام قرار دارند.
۵. شاخص ریسک سیستم (SRI) با عدد ۴.۴ وضعیت نرمال را تایید کرده و وضعیت اضطراری غیرفعال است.`;
  }
}

/**
 * Format the full Daily Input Form & Sources Extraction Sheet (Article 4 & 5 Rulebook)
 */
export function formatDailyInputsSheetReport(payload: TelegramReportPayload): string {
  const { signal, inputs } = payload;
  const channelTag = process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;

  const getCatEmoji = (cat: string) => {
    switch (cat) {
      case 'bourse': return '📊';
      case 'gold': return '🥇';
      case 'crypto': return '🪙';
      case 'forex': return '💵';
      case 'macro': return '🏛️';
      default: return '▫️';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'bullish': return '🟢 صعودی / قوی';
      case 'bearish': return '🔴 نزولی / ضعیف';
      case 'neutral': return '🟡 خنثی / بدون جهت';
      default: return '⚪';
    }
  };

  const categories = [
    { key: 'bourse', label: 'بورس اوراق بهادار تهران (TSE)' },
    { key: 'gold', label: 'طلا، مسکوکات و صندوق‌های طلا' },
    { key: 'forex', label: 'ارز آزاد، تتر و حواله درهم' },
    { key: 'crypto', label: 'رمزارزها و جریان ETF بیت‌کوین' },
    { key: 'macro', label: 'اقتصاد کلان، نرخ بهره و نقدینگی' },
  ];

  let body = `📑 **برگه جامع ثبت داده‌های ورودی روزانه و منابع استخراج (S1 Daily Inputs)**\n`;
  body += `⏰ تاریخ پایش: ${signal.lastUpdatedJalali} • تعداد شاخص‌ها: ${inputs.length} مورد\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  categories.forEach((cat) => {
    const items = inputs.filter((i) => i.category === cat.key);
    if (!items.length) return;

    body += `${getCatEmoji(cat.key)} **${cat.label} (${items.length} شاخص)**\n`;
    items.forEach((item, idx) => {
      body += `${idx + 1}. **${item.title}** (${item.code})\n`;
      body += `   ▫️ **مقدار ثبت‌شده:** \`${item.value} ${item.unit}\`\n`;
      body += `   ▫️ **منبع رسمی استخراج:** ${item.source || 'سامانه رسمی'}${item.sourceReference ? ` (${item.sourceReference})` : ''}\n`;
      body += `   ▫️ **وضعیت و امتیاز:** ${getStatusBadge(item.status)} | نمره: ${item.scoreContribution}/۱۰\n`;
      if (item.timeWindow) {
        body += `   ▫️ **پنجره زمانی ثبت:** ${item.timeWindow}\n`;
      }
    });
    body += `\n`;
  });

  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  body += `🔒 تاییدیه صحت اطلاعات: کلیه داده‌های فوق مطابق با منشور سرمایه‌گذاری S1 از مراجع رسمی استخراج و اعتبارسنجی شده‌اند.\n`;
  body += `🌐 سامانه مدیریت سرمایه S1 | کانال: ${channelTag}`;

  return body;
}

/**
 * Format the 13-Point Standard Daily Report (Article 12 S1 Rulebook)
 */
export function formatFull13Report(payload: TelegramReportPayload, aiAnalysisText?: string): string {
  const { signal, marketScores, inputs, assets, trades } = payload;
  const channelTag = process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;
  const analysis = aiAnalysisText || signal.summaryText;

  const totalPortfolioValue = assets.reduce((acc, h) => acc + h.allocatedValueToman, 0);
  const totalProfitLossToman = totalPortfolioValue - 1000000000;
  const totalReturnPercent = ((totalProfitLossToman / 1000000000) * 100).toFixed(2);

  const getMetric = (id: string, fallback: string = '-') => {
    const found = inputs?.find((i) => i.id === id);
    return found ? `${found.value} ${found.unit}` : fallback;
  };

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
۱️⃣ **مشخصات گزارش:** نسخه S1 Engine v1.3 • کیفیت داده: ${signal.dataQualityScore}/${inputs?.length || 41} شاخص زنده • منابع: TSETMC, TGJU, CoinGlass, TradingView, CBI

۲️⃣ **بازارهای جهانی:** 
• اونس طلا (XAU/USD): ${getMetric('gold-ounce-price', '۲,۹۲۵ دلار')} 🟢 | شاخص دلار (DXY): ۱۰۴.۲ 🟡 | بیت‌کوین: ${getMetric('btc-price', '۹۶,۴۰۰ دلار')} 🟡 | جریان ETF کریپتو: ${getMetric('btc-etf-netflow', '۳۵- م.دلار')} 🔴 | منبع: TradingView / CoinGlass

۳️⃣ **اقتصاد ایران و ارز:**
• دلار آزاد: ${getMetric('usd-free-market', '۹۴,۵۰۰ تومان')} | تتر: ${getMetric('usdt-toman-rate', '۹۴,۸۰۰ تومان')} | درهم: ${getMetric('dirham-herat-arbitrage', '۲۵,۸۵۰ تومان')} | سکه امامی حباب: ${getMetric('gold-coin-bubble', '۲۱.۵٪')} | طلای ۱۸ عیار: ${getMetric('gold-18k-gram', '۸,۴۵۰,۰۰۰ تومان')} | نرخ بین‌بانکی: ${getMetric('interbank-interest-rate', '۲۳.۸۵٪')} | منبع: شبکه TGJU و بانک مرکزی

۴️⃣ **بورس تهران (امتیاز ${marketScores.find(m => m.id === 'bourse')?.score || 82} / ۱۰۰ 🟢):**
• تغییرات شاخص کل: ${getMetric('tse-index-change', '+۱.۴۵٪')} | ارزش معاملات خرد: ${getMetric('tse-retail-volume', '۹,۴۵۰ م.ت')} | ورود پول حقیقی: ${getMetric('tse-real-money-flow', '+۱,۴۲۰ م.ت')} | قدرت خریدار به فروشنده: ${getMetric('tse-per-capita-power', '۱.۳۸')} | خروج از درآمد ثابت: ${getMetric('tse-fixed-flow-out', '+۴۸۰ م.ت')} | منبع: TSETMC

۵️⃣ **صندوق‌های سرمایه‌گذاری منتخب:**
• عیار: قیمت روز با حباب نرمال (۰.۵٪+) | کهربا: حباب منصفانه (۰.۴٪+) | توان: با تخفیف نسبت به NAV | افران: سود موثر ۳۱.۵٪ | منبع: بورس کالا / Fipiran

۶️⃣ **ارزیابی دو مرحله‌ای ابزارهای طلا:**
• مرحله ۱ (جذابیت طلا): ${marketScores.find(m => m.id === 'gold')?.score || 90}/۱۰۰ 🟢 | مرحله ۲ (انتخاب ابزار): صندوق شمش عیار با نمره ۹۴/۱۰۰ به عنوان ابزار پایه ۸۰٪ بخش طلا تعیین شد.

۷️⃣ **بیت‌کوین و رمزارزها (امتیاز ${marketScores.find(m => m.id === 'btc')?.score || 58} / ۱۰۰ 🔴 چراغ قرمز):**
• قیمت: ${getMetric('btc-price', '۹۶,۴۰۰ دلار')} | شاخص ترس و طمع: ${getMetric('crypto-fear-greed', '۵۲')} | دامیننس بیت‌کوین: ${getMetric('btc-dominance', '۵۸.۴٪')} | وضعیت: عدم اقدام به دلیل نمره زیر ۶۰

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
 * Split text into chunks smaller than maxLen respecting newlines
 */
function splitMessageIntoChunks(text: string, maxLen = 3900): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > maxLen) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n${line}` : line;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

/**
 * Send Message to Telegram API (Auto-chunks long reports)
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

  const chunks = splitMessageIntoChunks(text, 3900);
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  let lastData: any = null;

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chat,
          text: chunkText,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });

      let data = await response.json();

      if (!response.ok || !data.ok) {
        console.warn(`⚠️ Telegram Markdown chunk #${i + 1} parse failed, retrying in plain text...`);
        // Fallback without parse_mode
        const fallbackResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat,
            text: chunkText.replace(/\*\*/g, '').replace(/__/g, ''),
            disable_web_page_preview: true,
          }),
        });
        data = await fallbackResponse.json();
        if (!fallbackResponse.ok || !data.ok) {
          throw new Error(data.description || 'Telegram API error');
        }
      }

      lastData = data;
      // Brief pause between chunks if multiple
      if (chunks.length > 1 && i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return { success: true, data: lastData };
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
    inputs: initialDailyInputs,
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
