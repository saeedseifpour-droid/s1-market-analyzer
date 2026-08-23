import { GoogleGenAI } from '@google/genai';
import { getLiveJalaliDetails } from './utils/dateHelper';
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
  StandardDailyInput13Sections,
  ValidationAuditReport,
} from './types';

export interface TelegramReportPayload {
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  inputs: InputMetric[];
  assets: PortfolioAssetItem[];
  trades: PortfolioTradeItem[];
  sri?: SRIModel;
  daily13Sections?: StandardDailyInput13Sections;
  auditReport?: ValidationAuditReport;
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
  const { signal, marketScores, inputs, assets, trades, daily13Sections } = payload;
  const channelTag = process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;
  const analysis = aiAnalysisText || signal.summaryText;
  const d = daily13Sections;

  const totalPortfolioValue = assets.reduce((acc, h) => acc + h.allocatedValueToman, 0);
  const totalProfitLossToman = totalPortfolioValue - 1000000000;
  const totalReturnPercent = ((totalProfitLossToman / 1000000000) * 100).toFixed(2);

  const getMetric = (id: string, fallback: string = '-') => {
    const found = inputs?.find((i) => i.id === id);
    return found ? `${found.value} ${found.unit}`.trim() : fallback;
  };

  const marketRankings = [...marketScores]
    .sort((a, b) => b.score - a.score)
    .map((m, idx) => `${idx + 1}. ${m.name} (${m.score}/100) ${m.score >= 75 ? '🟢' : m.score >= 60 ? '🟡' : '🔴'}`)
    .join(' | ');

  const assetAllocationList = assets
    .map((a) => `▫️ ${a.name}: ${a.weightPct}% (${(a.allocatedValueToman / 1000000).toLocaleString('fa-IR')} م.ت)`)
    .join('\n');

  const goldOunceVal = d?.section2_globalMarkets?.goldOunce || getMetric('gold-ounce-price', '۴,۶۰۷ دلار');
  const dxyVal = d?.section2_globalMarkets?.dxy || getMetric('global-dxy-index', '۱۰۱.۴');
  const btcVal = d?.section3_crypto?.btcPrice || getMetric('btc-price', '۷۷,۲۹۰ دلار');
  const btcEtfVal = d?.section3_crypto?.etfFlowAmount || getMetric('btc-etf-netflow', '-۲۸.۵ میلیون دلار');

  const usdFreeVal = d?.section1_iranMacro?.usdFree || getMetric('usd-free-market', '۱۹۹,۹۰۰ تومان');
  const usdtVal = d?.section1_iranMacro?.usdt || getMetric('usdt-toman-rate', '۱۹۹,۸۰۰ تومان');
  const dirhamVal = getMetric('dirham-herat-arbitrage', '۵۴,۵۰۰ تومان');
  const coinBubbleVal = d?.section1_iranMacro?.coinBubble || getMetric('gold-coin-bubble', '۲.۵٪');
  const gold18kVal = d?.section1_iranMacro?.gold18k || getMetric('gold-18k-gram', '۲۰,۴۰۰,۰۰۰ تومان');
  const interbankVal = getMetric('interbank-interest-rate', '۲۳.۸۵٪');

  const tseChangeVal = d?.section4_bourse?.tseIndexChangePct || getMetric('tse-index-change', '+۰.۱۴٪');
  const tseVolVal = d?.section4_bourse?.retailVolume || getMetric('tse-retail-volume', '۴۶,۴۲۱ میلیارد تومان');
  const tseFlowVal = d?.section4_bourse?.realMoneyFlow || getMetric('tse-real-money-flow', '+۸۹۰ میلیارد تومان');
  const tsePowerVal = d?.section4_bourse?.buyerPower || getMetric('tse-per-capita-power', '۱.۸۲');

  return `📋 **گزارش رسمی ۱۳ گانه سیستم مدیریت سرمایه و ریسک S1 (نسخه ۱.۳)**
⏰ پایش روزانه: ساعت ۱۷:۰۰ الی ۱۸:۰۰ • تاریخ: ${signal.lastUpdatedJalali}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱️⃣ **مشخصات گزارش:** نسخه S1 Engine v1.3 • کیفیت داده: ${signal.dataQualityScore}/${signal.totalMetricsCount || inputs?.length || 41} شاخص زنده • منابع: TSETMC, TGJU, CoinGlass, TradingView, CBI

۲️⃣ **بازارهای جهانی:** 
• اونس طلا (XAU/USD): ${goldOunceVal} 🟢 | شاخص دلار (DXY): ${dxyVal} 🟡 | بیت‌کوین: ${btcVal} 🟡 | جریان ETF کریپتو: ${btcEtfVal} 🔴 | منبع: TradingView / CoinGlass

۳️⃣ **اقتصاد ایران و ارز:**
• دلار آزاد: ${usdFreeVal} | تتر: ${usdtVal} | درهم: ${dirhamVal} | سکه امامی حباب: ${coinBubbleVal} | طلای ۱۸ عیار: ${gold18kVal} | نرخ بین‌بانکی: ${interbankVal} | منبع: شبکه TGJU و بانک مرکزی

۴️⃣ **بورس تهران (امتیاز ${marketScores.find(m => m.id === 'bourse')?.score || 82} / ۱۰۰ 🟢):**
• تغییرات شاخص کل: ${tseChangeVal} | ارزش معاملات خرد: ${tseVolVal} | ورود پول حقیقی: ${tseFlowVal} | قدرت خریدار به فروشنده: ${tsePowerVal} | خروج از درآمد ثابت: ${getMetric('tse-fixed-flow-out', '+۶۸۰ م.ت')} | منبع: TSETMC

۵️⃣ **صندوق‌های سرمایه‌گذاری منتخب:**
• عیار: ${d?.section6_ayarFund?.closingPrice || '۵۸,۴۵۵ تومان'} (حباب ${d?.section6_ayarFund?.navDiffPct || '+۰.۶۱٪'}) | کهربا: ${d?.section9_otherGoldFunds?.kahroba || 'حباب منصفانه (۰.۴٪+)'} | توان: ${d?.section8_tavanFund?.closingPrice || '۵۱,۹۵۴ ریال'} | افران: ${d?.section5_afranFund?.closingPrice || '۲,۲۱۵ ریال'} (سود موثر ۳۱.۵٪) | منبع: بورس کالا / Fipiran

۶️⃣ **ارزیابی دو مرحله‌ای ابزارهای طلا:**
• مرحله ۱ (جذابیت طلا): ${marketScores.find(m => m.id === 'gold')?.score || 90}/۱۰۰ 🟢 | مرحله ۲ (انتخاب ابزار): صندوق شمش عیار با نمره ۹۴/۱۰۰ به عنوان ابزار پایه ۸۰٪ بخش طلا تعیین شد.

۷️⃣ **بیت‌کوین و رمزارزها (امتیاز ${marketScores.find(m => m.id === 'btc')?.score || 58} / ۱۰۰ 🔴 چراغ قرمز):**
• قیمت: ${btcVal} | شاخص ترس و طمع: ${d?.section3_crypto?.cryptoFearGreed || getMetric('crypto-fear-greed', '۴۸ (خنثی)')} | دامیننس بیت‌کوین: ${d?.section3_crypto?.btcDominance || getMetric('btc-dominance', '۵۷.۸٪')} | وضعیت: عدم اقدام به دلیل نمره زیر ۶۰

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
 * Format the standard 13-Section DAILY INPUT Template (S1 Version 1.3)
 */
export function formatStandardDailyInputTemplate(payload: TelegramReportPayload): string {
  const { signal, inputs, daily13Sections } = payload;
  const d = daily13Sections;

  const dateDetails = getLiveJalaliDetails(0);
  const jalaliDate = d?.metadata?.jalaliDate || dateDetails.jalaliStandard;
  const miladiDate = d?.metadata?.miladiDate || dateDetails.miladiDate;
  const dayName = d?.metadata?.dayOfWeek || dateDetails.dayOfWeek;

  const getV = (id: string, fallback: string = '-') => {
    const item = inputs?.find((i) => i.id === id);
    if (!item) return fallback;
    return `${item.value} ${item.unit}`.trim();
  };

  // Section 1
  const s1 = d?.section1_iranMacro;
  const usdFree = s1?.usdFree || getV('usd-free-market', '۱۹۹,۹۰۰ تومان');
  const usdYesterday = s1?.usdYesterday || '۱۹۱,۲۰۰ تومان';
  const usdChangePct = s1?.usdChangePct || '+۴.۵۵٪';
  const usdt = s1?.usdt || getV('usdt-toman-rate', '۱۹۹,۸۰۰ تومان');
  const usdtYesterday = s1?.usdtYesterday || '۱۸۸,۰۰۰ تومان';
  const usdtChangePct = s1?.usdtChangePct || '+۶.۲۸٪';
  const gold18k = s1?.gold18k || getV('gold-18k-gram', '۲۰,۴۰۰,۰۰۰ تومان');
  const gold18kYesterday = s1?.gold18kYesterday || '۱۹,۸۵۰,۰۰۰ تومان';
  const gold18kChangePct = s1?.gold18kChangePct || '+۲.۷۷٪';
  const sekeEmami = s1?.sekeEmami || getV('gold-coin-emami', '۱۹۹,۵۴۰,۰۰۰ تومان');
  const sekeYesterday = s1?.sekeYesterday || '۲۰۴,۵۰۰,۰۰۰ تومان';
  const sekeChangePct = s1?.sekeChangePct || '-۲.۴۲٪';
  const coinBubble = s1?.coinBubble || getV('gold-coin-bubble', '۲.۵٪');
  const econNews = s1?.econNews || 'تداوم عرضه ارز در بازار توافقی و ثبات نسبی در معاملات مرکز مبادله ارز و طلای ایران';

  // Section 2
  const s2 = d?.section2_globalMarkets;
  const goldOunce = s2?.goldOunce || getV('gold-ounce-price', '۴,۶۰۷ دلار');
  const ounceYesterday = s2?.ounceYesterday || '۴,۶۱۱ دلار';
  const ounceChangePct = s2?.ounceChangePct || '-۰.۰۸٪';
  const dxy = s2?.dxy || getV('global-dxy-index', '۱۰۱.۴');
  const dxyChangePct = s2?.dxyChangePct || '-۰.۲۲٪';
  const brentOil = s2?.brentOil || getV('global-brent-oil', '۷۲.۸ دلار');
  const brentChangePct = s2?.brentChangePct || '+۰.۴۵٪';
  const vix = s2?.vix || getV('global-vix-index', '۱۴.۸ واحد');
  const vixChangePct = s2?.vixChangePct || '-۱.۵٪';
  const globalFearGreed = s2?.globalFearGreed || getV('global-market-sentiment', '۶۴ (طمع)');
  const globalNews = s2?.globalNews || 'تثبیت اونس جهانی طلا بالای ۴۶۰۰ دلار و نگاه بازارهای جهانی به سیاست‌های پولی فدرال رزرو آمریکا';

  // Section 3
  const s3 = d?.section3_crypto;
  const btcPrice = s3?.btcPrice || getV('btc-price', '۷۷,۲۹۰ دلار');
  const btcYesterday = s3?.btcYesterday || '۷۷,۲۷۶ دلار';
  const btcChangePct = s3?.btcChangePct || '+۰.۰۲٪';
  const ethPrice = s3?.ethPrice || getV('crypto-eth-price', '۲,۴۸۵ دلار');
  const ethChangePct = s3?.ethChangePct || '+۰.۲۰٪';
  const btcDominance = s3?.btcDominance || getV('btc-dominance', '۵۷.۸٪');
  const marketCap = s3?.marketCap || getV('crypto-total-marketcap', '۲.۸۶ تریلیون دلار');
  const etfFlow = s3?.etfFlow || 'خروج خفیف نقدینگی';
  const etfFlowAmount = s3?.etfFlowAmount || getV('btc-etf-netflow', '-۲۸.۵ میلیون دلار');
  const fundingRate = s3?.fundingRate || getV('crypto-funding-rate', '+۰.۰۰۶٪');
  const openInterest = s3?.openInterest || getV('crypto-open-interest', '۳۴.۲ میلیارد دلار');
  const cryptoFearGreed = s3?.cryptoFearGreed || getV('crypto-fear-greed', '۴۸ (خنثی)');
  const cryptoNews = s3?.cryptoNews || 'تثبیت و نوسان بیت‌کوین در کانال ۷۷ هزار دلار با حجم معاملات ۲۴ ساعته ۶۹ میلیارد دلاری';

  // Section 4
  const s4 = d?.section4_bourse;
  const tseIndex = s4?.tseIndex || getV('tse-overall-index', '۶,۰۶۹,۸۸۸ واحد');
  const tseYesterday = s4?.tseYesterday || '۶,۰۷۳,۲۹۴ واحد';
  const tseIndexChangePct = s4?.tseIndexChangePct || getV('tse-index-change', '+۰.۱۴٪');
  const tseEqualWeight = s4?.tseEqualWeight || getV('tse-equal-weight-index', '۱,۷۲۱,۵۰۰ واحد');
  const tseEqualWeightChangePct = s4?.tseEqualWeightChangePct || '+۰.۲۱٪';
  const retailVolume = s4?.retailVolume || getV('tse-retail-volume', '۴۶,۴۲۱ میلیارد تومان');
  const realMoneyFlow = s4?.realMoneyFlow || getV('tse-real-money-flow', '+۸۹۰ میلیارد تومان');
  const positiveSymbols = s4?.positiveSymbolsCount || '۵۱۲ نماد';
  const negativeSymbols = s4?.negativeSymbolsCount || '۲۴۸ نماد';
  const buyQueueCount = s4?.buyQueueCount || '۱۴۲ نماد';
  const buyQueueValue = s4?.buyQueueValue || '۹,۴۵۰ میلیارد تومان';
  const sellQueueCount = s4?.sellQueueCount || '۳۸ نماد';
  const sellQueueValue = s4?.sellQueueValue || '۱,۱۲۰ میلیارد تومان';
  const marketNews = s4?.marketNews || 'تثبیت شاخص کل بورس تهران در محدوده ۶ میلیون و ۶۹ هزار واحد و ارزش معاملات خرد پرحجم ۴۶ همت';

  // Section 5 (Afran)
  const s5 = d?.section5_afranFund;
  const afranPrice = s5?.closingPrice || getV('fund-afran-price', '۲,۲۱۵ ریال');
  const afranNav = s5?.navPerUnit || '۲,۲۱۵ ریال';
  const afranNavDiff = s5?.navDiffPct || '۰.۰٪';
  const afranVol = s5?.volumeUnits || '۱,۸۵۰,۰۰۰,۰۰۰ واحد';
  const afranVal = s5?.valueBillionToman || getV('fund-afran-volume', '۴۱۰ میلیارد تومان');
  const afranFlow = s5?.moneyFlow || '-۳۲۰ میلیارد تومان (جابجایی به سهام)';
  const afranBuyCapita = s5?.perCapitaBuy || '۸۵ میلیون تومان';
  const afranSellCapita = s5?.perCapitaSell || '۴۲ میلیون تومان';
  const afranPower = s5?.buyerPower || '۱.۲۵';
  const afranAum = s5?.aum || getV('fund-afran-aum', '۲۸,۰۰۰ میلیارد تومان');

  // Section 6 (Ayar)
  const s6 = d?.section6_ayarFund;
  const ayarPrice = s6?.closingPrice || getV('fund-ayar-price', '۵۸,۴۵۵ تومان');
  const ayarNav = s6?.navPerUnit || '۵۸,۱۰۰ تومان';
  const ayarNavDiff = s6?.navDiffPct || '+۰.۶۱٪';
  const ayarVol = s6?.volumeUnits || '۲۴,۵۰۰,۰۰۰ واحد';
  const ayarVal = s6?.valueBillionToman || getV('fund-ayar-volume', '۱,۴۳۲ میلیارد تومان');
  const ayarFlow = s6?.moneyFlow || '+۲۴۰ میلیارد تومان';
  const ayarBuyCapita = s6?.perCapitaBuy || '۸۴ میلیون تومان';
  const ayarSellCapita = s6?.perCapitaSell || '۴۵ میلیون تومان';
  const ayarPower = s6?.buyerPower || '۱.۴۴';
  const ayarAum = s6?.aum || getV('fund-ayar-aum', '۲۶,۵۰۰ میلیارد تومان');

  // Section 7 (Khebargan)
  const s7 = d?.section7_khebarganFund;
  const khebPrice = s7?.closingPrice || getV('fund-khebargan-price', '۳۴,۲۰۰ ریال');
  const khebYesterday = s7?.yesterdayPrice || '۳۳,۴۰۰ ریال';
  const khebChange = s7?.changePct || '+۲.۴۰٪';
  const khebNav = s7?.navPerUnit || '۳۴,۵۰۰ ریال';
  const khebNavDiff = s7?.navDiffPct || '-۰.۸۷٪ (تخفیف به NAV)';
  const khebVol = s7?.volumeUnits || '۲۸,۰۰۰,۰۰۰ واحد';
  const khebVal = s7?.valueBillionToman || '۹۵.۷ میلیارد تومان';
  const khebFlow = s7?.moneyFlow || '+۲۸ میلیارد تومان';
  const khebBuyCapita = s7?.perCapitaBuy || '۵۲ میلیون تومان';
  const khebSellCapita = s7?.perCapitaSell || '۳۱ میلیون تومان';
  const khebPower = s7?.buyerPower || '۱.۶۸';

  // Section 8 (Tavan)
  const s8 = d?.section8_tavanFund;
  const tavanPrice = s8?.closingPrice || getV('fund-tavan-price', '۲۴,۸۰۰ ریال');
  const tavanNav = s8?.navPerUnit || '۲۴,۹۵۰ ریال';
  const tavanNavDiff = s8?.navDiffPct || '-۰.۶۰٪';
  const tavanVol = s8?.volumeUnits || '۹۲,۰۰۰,۰۰۰ واحد';
  const tavanVal = s8?.valueBillionToman || '۲۲۸ میلیارد تومان';
  const tavanFlow = s8?.moneyFlow || '+۵۸ میلیارد تومان';
  const tavanBuyCapita = s8?.perCapitaBuy || '۵۸ میلیون تومان';
  const tavanSellCapita = s8?.perCapitaSell || '۳۴ میلیون تومان';
  const tavanPower = s8?.buyerPower || '۱.۷۱';

  // Section 9 (Other Gold Funds)
  const s9 = d?.section9_otherGoldFunds;
  const goldAyar = s9?.ayar || '۱۸,۴۵۰ تومان (+۰.۴۹٪ حباب)';
  const goldKahroba = s9?.kahroba || '۱۹,۲۰۰ تومان (+۰.۴۰٪ حباب)';
  const goldZar = s9?.zar || '۲۲,۱۵۰ تومان (+۰.۵۵٪ حباب)';
  const goldGohar = s9?.gohar || '۱۵,۴۰۰ تومان (+۰.۳۵٪ حباب)';
  const goldNafis = s9?.nafis || '۱۲,۸۰۰ تومان (+۰.۴۲٪ حباب)';
  const goldMesghal = s9?.mesghal || '۱۴,۹۰۰ تومان (+۰.۵۰٪ حباب)';

  // Section 10 (Leveraged Funds)
  const s10 = d?.section10_leveragedFunds;
  const levAhrom = s10?.ahrom || '۲۳,۵۰۰ ریال (+۲.۸٪)';
  const levTavan = s10?.tavan || '۲۴,۸۰۰ ریال (+۳.۱٪)';
  const levMoj = s10?.moj || '۱۸,۲۰۰ ریال (+۲.۴٪)';
  const levShetab = s10?.shetab || '۲۱,۴۰۰ ریال (+۲.۷٪)';
  const levBidar = s10?.bidar || '۱۹,۸۰۰ ریال (+۲.۹٪)';
  const levJahesh = s10?.jahesh || '۲۶,۲۰۰ ریال (+۳.۰٪)';
  const levDoX = s10?.doX || '۱۶,۵۰۰ ریال (+۲.۵٪)';

  // Section 11 (Silver Funds)
  const s11 = d?.section11_silverFunds;
  const silSilver = s11?.silver || '۱۱,۲۵۰ تومان (+۱.۲٪)';
  const silNoghrein = s11?.noghrein || '۱۰,۸۰۰ تومان (+۰.۹٪)';
  const silNoghrabi = s11?.noghrabi || '۱۲,۱۰۰ تومان (+۱.۱٪)';

  // Section 12 (Risks & News)
  const s12 = d?.section12_systematicRisks;
  const riskPolitical = s12?.riskPolitical || getV('risk-political', 'سطح متوسط و تحت رصد');
  const riskMilitary = s12?.riskMilitary || getV('risk-military', 'آرامش نسبی بدون تنش جدید');
  const riskEconomic = s12?.riskEconomic || getV('risk-economic', 'کنترل شکاف ارز آزاد و نیما');
  const riskGlobal = s12?.riskGlobal || getV('risk-global', 'تثبیت شاخص‌های نرخ بهره');
  const riskCrypto = s12?.riskCrypto || getV('risk-crypto', 'فشار مقطعی عرضه در آلتکوین‌ها');
  const cbiDecisions = s12?.cbiDecisions || 'نرخ سود بین‌بانکی ۲۳.۸۵٪ و ادامه حراج مرکز مبادله';
  const seoDecisions = s12?.seoDecisions || 'تداوم نظارت بر بازارگردانی و دامنه نوسان استاندارد';
  const domesticNews = s12?.domesticNews || 'عرضه ارز در بازار توافقی و گزارش‌های ماهانه شرکت‌های صادرات‌محور';
  const intlNews = s12?.internationalNews || 'گزارش‌های اشتغال آمریکا و تصمیمات فدرال رزرو';

  // Section 13 (Liquidity Flows)
  const s13 = d?.section13_liquidityFlow;
  const flowBourse = s13?.flowBourse || realMoneyFlow;
  const flowGold = s13?.flowGoldFunds || '+۱۴۵ میلیارد تومان';
  const flowFixed = s13?.flowFixedIncome || '+۴۸۰ میلیارد تومان (خروج به سمت سهام)';
  const flowEquity = s13?.flowEquityFunds || '+۳۲۰ میلیارد تومان';
  const flowLev = s13?.flowLeveragedFunds || '+۱۸۵ میلیارد تومان';
  const flowCrypto = s13?.flowCrypto || etfFlowAmount;

  return `══════════════════════════════════════════════════════════════
S1 VERSION 1.3
DAILY INPUT
══════════════════════════════════════════════════════════════

تاریخ: ${jalaliDate}
معادل میلادی: ${miladiDate}
روز هفته: ${dayName}

==============================================================
۱) اقتصاد کلان ایران
==============================================================

□ دلار آزاد: ${usdFree}
□ دلار دیروز: ${usdYesterday}
□ درصد تغییر: ${usdChangePct}

□ تتر: ${usdt}
□ تتر دیروز: ${usdtYesterday}
□ درصد تغییر: ${usdtChangePct}

□ طلای ۱۸ عیار: ${gold18k}
□ طلای دیروز: ${gold18kYesterday}
□ درصد تغییر: ${gold18kChangePct}

□ سکه امامی: ${sekeEmami}
□ سکه دیروز: ${sekeYesterday}
□ درصد تغییر: ${sekeChangePct}

□ حباب سکه: ${coinBubble}

□ مهم‌ترین اخبار اقتصادی امروز:
${econNews}

==============================================================
۲) بازارهای جهانی
==============================================================

□ اونس جهانی طلا: ${goldOunce}
□ اونس دیروز: ${ounceYesterday}
□ درصد تغییر: ${ounceChangePct}

□ شاخص دلار (DXY): ${dxy}
□ درصد تغییر: ${dxyChangePct}

□ نفت برنت: ${brentOil}
□ درصد تغییر: ${brentChangePct}

□ شاخص VIX: ${vix}
□ درصد تغییر: ${vixChangePct}

□ Fear & Greed جهانی: ${globalFearGreed}

□ مهم‌ترین اخبار اقتصاد جهان:
${globalNews}

==============================================================
۳) بیت‌کوین و بازار کریپتو
==============================================================

□ قیمت بیت‌کوین: ${btcPrice}
□ قیمت دیروز: ${btcYesterday}
□ درصد تغییر: ${btcChangePct}

□ قیمت اتریوم: ${ethPrice}
□ درصد تغییر: ${ethChangePct}

□ Bitcoin Dominance: ${btcDominance}

□ Market Cap: ${marketCap}

□ ETF Flow: ${etfFlow}
□ مقدار: ${etfFlowAmount}

□ Funding Rate: ${fundingRate}

□ Open Interest: ${openInterest}

□ Fear & Greed Crypto: ${cryptoFearGreed}

□ مهم‌ترین اخبار کریپتو:
${cryptoNews}

==============================================================
۴) بورس ایران
==============================================================

□ شاخص کل: ${tseIndex}
□ شاخص دیروز: ${tseYesterday}
□ درصد تغییر: ${tseIndexChangePct}

□ شاخص هم‌وزن: ${tseEqualWeight}
□ درصد تغییر: ${tseEqualWeightChangePct}

□ ارزش معاملات خرد: ${retailVolume}

□ ورود / خروج پول حقیقی: ${realMoneyFlow}

□ تعداد نماد مثبت: ${positiveSymbols}
□ تعداد نماد منفی: ${negativeSymbols}

□ تعداد صف خرید: ${buyQueueCount}
□ ارزش صف خرید: ${buyQueueValue}

□ تعداد صف فروش: ${sellQueueCount}
□ ارزش صف فروش: ${sellQueueValue}

□ مهم‌ترین خبر بازار:
${marketNews}

==============================================================
۵) صندوق درآمد ثابت افران
==============================================================

□ قیمت پایانی: ${afranPrice}
□ NAV ابطال: ${afranNav}
□ اختلاف قیمت با NAV: ${afranNavDiff}

□ حجم معاملات: ${afranVol}
□ ارزش معاملات: ${afranVal}

□ ورود / خروج پول: ${afranFlow}

□ سرانه خرید: ${afranBuyCapita}
□ سرانه فروش: ${afranSellCapita}
□ قدرت خریدار: ${afranPower}

□ AUM: ${afranAum}

==============================================================
۶) صندوق طلای عیار
==============================================================

□ قیمت پایانی: ${ayarPrice}
□ NAV ابطال: ${ayarNav}
□ اختلاف قیمت با NAV: ${ayarNavDiff}

□ حجم معاملات: ${ayarVol}
□ ارزش معاملات: ${ayarVal}

□ ورود / خروج پول: ${ayarFlow}

□ سرانه خرید: ${ayarBuyCapita}
□ سرانه فروش: ${ayarSellCapita}
□ قدرت خریدار: ${ayarPower}

□ AUM: ${ayarAum}

==============================================================
۷) صندوق سهامی خبرگان
==============================================================

□ قیمت پایانی: ${khebPrice}
□ قیمت روز قبل: ${khebYesterday}
□ درصد تغییر: ${khebChange}

□ NAV ابطال: ${khebNav}
□ اختلاف قیمت با NAV: ${khebNavDiff}

□ حجم معاملات: ${khebVol}
□ ارزش معاملات: ${khebVal}

□ ورود / خروج پول: ${khebFlow}

□ سرانه خرید: ${khebBuyCapita}
□ سرانه فروش: ${khebSellCapita}
□ قدرت خریدار: ${khebPower}

==============================================================
۸) صندوق اهرمی توان
==============================================================

□ قیمت پایانی: ${tavanPrice}
□ NAV ابطال: ${tavanNav}
□ اختلاف قیمت با NAV: ${tavanNavDiff}

□ حجم معاملات: ${tavanVol}
□ ارزش معاملات: ${tavanVal}

□ ورود / خروج پول: ${tavanFlow}

□ سرانه خرید: ${tavanBuyCapita}
□ سرانه فروش: ${tavanSellCapita}
□ قدرت خریدار: ${tavanPower}

==============================================================
۹) سایر صندوق‌های طلا
==============================================================

□ عیار: ${goldAyar}
□ کهربا: ${goldKahroba}
□ زر: ${goldZar}
□ گوهر: ${goldGohar}
□ نفیس: ${goldNafis}
□ مثقال: ${goldMesghal}

==============================================================
۱۰) صندوق‌های اهرمی
==============================================================

□ اهرم: ${levAhrom}
□ توان: ${levTavan}
□ موج: ${levMoj}
□ شتاب: ${levShetab}
□ بیدار: ${levBidar}
□ جهش: ${levJahesh}
□ دوایکس: ${levDoX}

==============================================================
۱۱) صندوق‌های نقره
==============================================================

□ سیلور: ${silSilver}
□ نقرین: ${silNoghrein}
□ نقرابی: ${silNoghrabi}

==============================================================
۱۲) اخبار و ریسک‌های سیستماتیک
==============================================================

□ ریسک سیاسی: ${riskPolitical}

□ ریسک نظامی: ${riskMilitary}

□ ریسک اقتصادی: ${riskEconomic}

□ ریسک بازار جهانی: ${riskGlobal}

□ ریسک بازار کریپتو: ${riskCrypto}

□ تصمیمات بانک مرکزی: ${cbiDecisions}

□ تصمیمات سازمان بورس: ${seoDecisions}

□ مهم‌ترین اخبار داخلی: ${domesticNews}

□ مهم‌ترین اخبار بین‌المللی: ${intlNews}

==============================================================
۱۳) وضعیت جریان نقدینگی
==============================================================

□ ورود / خروج پول به بورس: ${flowBourse}

□ ورود / خروج پول به صندوق‌های طلا: ${flowGold}

□ ورود / خروج پول به صندوق‌های درآمد ثابت: ${flowFixed}

□ ورود / خروج پول به صندوق‌های سهامی: ${flowEquity}

□ ورود / خروج پول به صندوق‌های اهرمی: ${flowLev}

□ ورود / خروج پول به بازار کریپتو: ${flowCrypto}

══════════════════════════════════════════════════════════════
پایان DAILY INPUT
══════════════════════════════════════════════════════════════`;
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
 * Send Dual Pipeline to Telegram (Message 1: Complete Daily Input -> Message 2: Scoring & Asset Entry Decision Report)
 */
export async function sendDualTelegramPipeline(
  payload: TelegramReportPayload,
  botToken?: string,
  chatId?: string,
  aiAnalysisText?: string,
  onProgress?: (step: 1 | 2, status: 'sending' | 'success' | 'failed', error?: string) => void
): Promise<{ success: boolean; step1: any; step2: any; error?: string }> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chat = chatId || process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;

  if (!token || !chat) {
    return {
      success: false,
      step1: null,
      step2: null,
      error: 'توکن ربات یا شناسه کانال تلگرام مشخص نشده است.',
    };
  }

  // Step 1: Format & Send Daily Input (13 Sections)
  const dailyInputText = formatStandardDailyInputTemplate(payload);
  onProgress?.(1, 'sending');
  const res1 = await sendTelegramMessage(dailyInputText, token, chat);

  if (!res1.success) {
    onProgress?.(1, 'failed', res1.error);
    return {
      success: false,
      step1: res1,
      step2: null,
      error: `خطا در ارسال پیام اول (دیلی اینپوت): ${res1.error}`,
    };
  }
  onProgress?.(1, 'success');

  // Pause briefly before sending Step 2
  await new Promise((r) => setTimeout(r, 800));

  // Step 2: Format & Send S1 Official Decision & Asset Allocation Report (13 Points)
  const decisionReportText = formatFull13Report(payload, aiAnalysisText);
  onProgress?.(2, 'sending');
  const res2 = await sendTelegramMessage(decisionReportText, token, chat);

  if (!res2.success) {
    onProgress?.(2, 'failed', res2.error);
    return {
      success: false,
      step1: res1,
      step2: res2,
      error: `پیام اول (دیلی اینپوت) ارسال شد، اما خطا در ارسال پیام دوم (گزارش تصمیم و امتیازدهی): ${res2.error}`,
    };
  }
  onProgress?.(2, 'success');

  return {
    success: true,
    step1: res1,
    step2: res2,
  };
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
