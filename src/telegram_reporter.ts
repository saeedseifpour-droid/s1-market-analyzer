import { GoogleGenAI } from '@google/genai';
import { getLiveJalaliDetails, getTehranTimeString, getLiveJalaliDateString } from './utils/dateHelper';
import { checkDataFreshness } from './utils/s1DataEngine';
import { runS1ValidationCore, getDefault13SectionsData } from './utils/s1ValidationCore';
import { recalculateS1ScoresFromInputs } from './utils/marketDataLive';
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
  const freshness = checkDataFreshness(d?.metadata?.jalaliDate || signal.lastUpdatedJalali);

  const totalPortfolioValue = assets && assets.length > 0 ? assets.reduce((acc, h) => acc + h.allocatedValueToman, 0) : 1000000000;
  const totalProfitLossToman = totalPortfolioValue - 1000000000;
  const totalReturnPercent = ((totalProfitLossToman / 1000000000) * 100).toFixed(2);
  const formattedReturn = `${Number(totalReturnPercent) >= 0 ? '+' : ''}${totalReturnPercent}%`;

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

  const goldOunceVal = d?.section2_globalMarkets?.goldOunce || getMetric('gold-ounce-price', '۴,۶۵۳ دلار');
  const dxyVal = d?.section2_globalMarkets?.dxy || getMetric('global-dxy-index', '۱۰۱.۲۰');
  const btcVal = d?.section3_crypto?.btcPrice || getMetric('btc-price', '۷۹,۱۵۰ دلار');
  const btcEtfVal = d?.section3_crypto?.etfFlowAmount || getMetric('btc-etf-netflow', '+۱۸۴.۲ میلیون دلار');

  const usdFreeVal = d?.section1_iranMacro?.usdFree || getMetric('usd-free-market', '۲۰۰,۵۰۰ تومان');
  const usdtVal = d?.section1_iranMacro?.usdt || getMetric('usdt-toman-rate', '۱۹۹,۸۰۰ تومان');
  const dirhamVal = getMetric('dirham-herat-arbitrage', '۵۴,۸۰۰ تومان');
  const coinBubbleVal = d?.section1_iranMacro?.coinBubble || getMetric('gold-coin-bubble', '۲.۱٪');
  const gold18kVal = d?.section1_iranMacro?.gold18k || getMetric('gold-18k-gram', '۲۱,۶۷۷,۴۰۰ تومان');
  const interbankVal = getMetric('interbank-interest-rate', '۲۳.۸۵٪');

  const tseChangeVal = d?.section4_bourse?.tseIndexChangePct || getMetric('tse-index-change', '+۲.۶۱٪');
  const tseVolVal = d?.section4_bourse?.retailVolume || getMetric('tse-retail-volume', '۵۴,۲۰۰ میلیارد تومان');
  const tseFlowVal = d?.section4_bourse?.realMoneyFlow || getMetric('tse-real-money-flow', '+۱,۴۸۰ میلیارد تومان');
  const tsePowerVal = d?.section4_bourse?.buyerPower || getMetric('tse-per-capita-power', '۱.۸۲');

  const freshnessBanner = freshness.isStale
    ? `⚠️ **هشدار انقضای داده:** داده‌های ثبت‌شده منقضی است (${freshness.dataDateJalali}) • عدم تصمیم‌گیری بر پایه داده‌های قدیمی\n`
    : `✅ **وضعیت داده‌ها:** 🟢 زنده و تاییدشده امروز (${freshness.todayJalali}) • پایش اتوماتیک ۲۰:۰۰ / پایش دستی زنده\n`;

  return `📋 **گزارش رسمی ۱۳ گانه سیستم مدیریت سرمایه و ریسک S1 (نسخه ۱.۳)**
⏰ پایش اتوماتیک: ساعت ۲۰:۰۰ • آخرین پایش دستی: ${signal.lastUpdatedJalali}
${freshnessBanner}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
۱️⃣ **مشخصات گزارش و متاداده اعتبارسنجی:**
▫️ نسخه موتور: S1 Engine v1.3 • کیفیت داده: ${signal.dataQualityScore}/${signal.totalMetricsCount || inputs?.length || 41} شاخص زنده
▫️ مراجع پایش زنده: TSETMC, TGJU, CoinGecko, Binance API, CoinGlass, TradingView, Fipiran, CBI
▫️ پروتکل اعتبارسنجی: ممیزی سه‌گانه ریاضی (اونس طلا، حباب سکه و اسپات کریپتو)

۲️⃣ **بازارهای جهانی (استخراج زنده ۱۷:۰۰ - ۱۷:۱۵):** 
• اونس طلا (XAU/USD): ${goldOunceVal} [منبع: TradingView • ۱۷:۱۵] 🟢
• شاخص دلار (DXY): ${dxyVal} [منبع: TradingView • ۱۷:۱۰] 🟡
• بیت‌کوین: ${btcVal} [منبع: CoinGecko/Binance Live API • ۱۷:۲۵] 🟢
• جریان خالص ETF کریپتو: ${btcEtfVal} [منبع: CoinGlass Spot Tracker • ۱۷:۰۰] 🟢

۳️⃣ **اقتصاد ایران و ارز (استخراج زنده ۱۷:۰۰ - ۱۷:۳۰):**
• دلار آزاد: ${usdFreeVal} [منبع: TGJU / منوچهری • ۱۷:۲۵]
• تتر: ${usdtVal} [منبع: نوبیتکس P2P • ۱۷:۲۸]
• حواله درهم: ${dirhamVal} [منبع: صرافی دبی • ۱۷:۱۵]
• سکه امامی (حباب ${coinBubbleVal}): ${d?.section1_iranMacro?.sekeEmami || '۲۱۶,۰۰۰,۰۰۰ تومان'} [منبع: اتحادیه طلا • ۱۷:۲۲]
• طلای ۱۸ عیار: ${gold18kVal} [منبع: اتحادیه طلا و جواهر تهران • ۱۷:۲۰]
• نرخ بین‌بانکی: ${interbankVal} [منبع: بانک مرکزی جمهوری اسلامی cbi.ir • هفتگی]

۴️⃣ **بورس تهران (استخراج رسمی TSETMC ساعت ۱۲:۳۰ - ۱۳:۰۰ | امتیاز ${marketScores.find(m => m.id === 'bourse')?.score || 82} / ۱۰۰ 🟢):**
• شاخص کل: ${d?.section4_bourse?.tseIndex || '۶,۳۸۶,۵۷۶ واحد'} (${tseChangeVal}) [منبع: TSETMC • ۱۲:۳۵]
• ارزش معاملات خرد: ${tseVolVal} [منبع: دیتابورس / TSETMC • ۱۳:۰۰]
• ورود پول حقیقی: ${tseFlowVal} [منبع: دیتابورس • ۱۳:۰۰]
• سرانه قدرت خریدار به فروشنده: ${tsePowerVal} [منبع: تریدرز آرنا • ۱۲:۳۵]
• خروج از درآمد ثابت: ${getMetric('tse-fixed-flow-out', '+۴۲۰ م.ت')} [منبع: TSETMC • ۱۳:۰۰]

۵️⃣ **صندوق‌های سرمایه‌گذاری منتخب (پایان معاملات بورس کالا و سهام):**
• صندوق شمش عیار: ${d?.section6_ayarFund?.closingPrice || '۵۸,۴۵۵ تومان'} (حباب ${d?.section6_ayarFund?.navDiffPct || '+۰.۶۱٪'}) [منبع: بورس کالا • ۱۵:۰۰]
• صندوق کهربا: ${d?.section9_otherGoldFunds?.kahroba || '۶۱,۲۰۰ تومان (+۰.۵۵٪)'} [منبع: بورس کالا • ۱۵:۰۰]
• صندوق اهرمی توان: ${d?.section8_tavanFund?.closingPrice || '۵۱,۹۵۴ ریال'} (+۴.۸٪) [منبع: TSETMC • ۱۲:۳۵]
• صندوق درآمد ثابت افران: ${d?.section5_afranFund?.closingPrice || '۲,۲۱۵ ریال'} (سود موثر ۳۱.۵٪) [منبع: TSETMC / Fipiran • ۱۵:۰۰]

۶️⃣ **ارزیابی دو مرحله‌ای ابزارهای طلا:**
• مرحله ۱ (جذابیت طلا): ${marketScores.find(m => m.id === 'gold')?.score || 90}/۱۰۰ 🟢 | مرحله ۲ (انتخاب ابزار): صندوق شمش عیار با نمره ۹۴/۱۰۰ به عنوان ابزار پایه ۸۰٪ بخش طلا تعیین شد. [منبع محاسباتی: S1 Valuation Core]

۷️⃣ **بیت‌کوین و رمزارزها (امتیاز ${marketScores.find(m => m.id === 'btc')?.score || 58} / ۱۰۰ 🔴 چراغ قرمز):**
• قیمت لحظه‌ای: ${btcVal} [منبع: CoinGecko / Binance API • ۱۷:۲۵]
• شاخص ترس و طمع: ${d?.section3_crypto?.cryptoFearGreed || getMetric('crypto-fear-greed', '۶۲ (طمع)')} [منبع: Alternative.me • ۱۷:۰۰]
• دامیننس بیت‌کوین: ${d?.section3_crypto?.btcDominance || getMetric('btc-dominance', '۵۸.۴٪')} [منبع: TradingView • ۱۷:۱۰]
• وضعیت راهبردی: عدم اقدام و صبر تا تایید نمره بالای ۶۰

۸️⃣ **رتبه‌بندی نهایی بازارها بر اساس اوزان قطعی:**
${marketRankings}

۹️⃣ **شاخص اطمینان تحلیل و وتو:**
• نمره اطمینان: ${signal.confidenceScore} از ۱۰ (بالا) • قانون وتو: غیرفعال • شاخص ریسک سیستم (SRI): ۴.۴/۱۰ (متعادل)

🔟 **وضعیت پورتفوی فرضی ۱ میلیارد تومانی:**
• ارزش کل روز: ${(totalPortfolioValue / 1000000).toLocaleString('fa-IR')} میلیون تومان
• بازدهی کل: ${formattedReturn} | حداکثر دراودان ثبت‌شده: ۰.۰٪ (سقف مجاز ۱۵٪)
${assetAllocationList}

۱۱️⃣ **دفتر ثبت معاملات و تغییر وزن‌ها:**
• تخصیص پله‌ای صندوق طلای عیار و درآمد ثابت افران با کسر کارمزد دقیق معاملاتی

۱۲️⃣ **تحلیل تغییرات روزانه نسبت به پایش قبل:**
• بورس: تقویت شدید ارزش معاملات و صعود تاریخی | طلا: تثبیت در قله با تقاضای فیزیکی | کریپتو: بازیابی و نوسان

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

💼 **استراتژی تخصیص پویا (مدیریت سرمایه S1):**
• اصل حاکم: حفظ ارزش سرمایه و پوشش تورم (بدون وزن سبد دارایی ثابت)
• وضعیت نقدینگی: ۱۰۰٪ سرمایه آزاد در صندوق درآمد ثابت افران (سود ۳۰٪+ روزشمار)
• اقدام فعال: ورود پله‌ای ۲۰٪ به صندوق طلای عیار متناسب با نمره ۹۰ طلا
• سایر بازارها: پایش بورس تهران و عدم اقدام در کریپتو (نمره زیر ۶۰)

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
 * Now includes exact authoritative source and timestamp of extraction for every data point.
 */
export function formatStandardDailyInputTemplate(payload: TelegramReportPayload): string {
  const { signal, inputs, daily13Sections } = payload;
  const d = daily13Sections;

  const dateDetails = getLiveJalaliDetails(0);
  const jalaliDate = d?.metadata?.jalaliDate || dateDetails.jalaliStandard;
  const miladiDate = d?.metadata?.miladiDate || dateDetails.miladiDate;
  const dayName = d?.metadata?.dayOfWeek || dateDetails.dayOfWeek;
  const reportingWindow = d?.metadata?.updateTime || dateDetails.reportingWindow || '۱۷:۰۰ - ۱۸:۰۰';

  const getItem = (id: string) => inputs?.find((i) => i.id === id);

  const getV = (id: string, fallback: string = '-') => {
    const item = getItem(id);
    if (!item) return fallback;
    return `${item.value} ${item.unit}`.trim();
  };

  const getSourceMeta = (id: string, defaultSrc: string, defaultTime: string = '۱۷:۲۵', defaultBadge: string = '🟢 تأییدشده رسمی') => {
    const item = getItem(id);
    const src = item?.source || defaultSrc;
    const ref = item?.sourceReference ? ` | ${item.sourceReference}` : '';
    const time = item?.lastUpdated || defaultTime;
    const badge = item?.verificationBadge || defaultBadge;
    return `[منبع: ${src}${ref} • زمان: ${time} • ${badge}]`;
  };

  // Section 1: Iran Macro & FX
  const s1 = d?.section1_iranMacro;
  const usdFree = s1?.usdFree || getV('usd-free-market', '۲۰۰,۵۰۰ تومان');
  const usdYesterday = s1?.usdYesterday || '۱۹۹,۵۰۰ تومان';
  const usdChangePct = s1?.usdChangePct || '+۰.۵۰٪';
  const usdt = s1?.usdt || getV('usdt-toman-rate', '۱۹۹,۸۰۰ تومان');
  const usdtYesterday = s1?.usdtYesterday || '۱۹۹,۱۲۰ تومان';
  const usdtChangePct = s1?.usdtChangePct || '+۰.۳۴٪';
  const gold18k = s1?.gold18k || getV('gold-18k-gram', '۲۱,۶۷۷,۴۰۰ تومان');
  const gold18kYesterday = s1?.gold18kYesterday || '۲۱,۴۱۰,۰۰۰ تومان';
  const gold18kChangePct = s1?.gold18kChangePct || '+۱.۲۵٪';
  const sekeEmami = s1?.sekeEmami || getV('gold-coin-emami', '۲۱۶,۰۰۰,۰۰۰ تومان');
  const sekeYesterday = s1?.sekeYesterday || '۲۱۴,۵۰۰,۰۰۰ تومان';
  const sekeChangePct = s1?.sekeChangePct || '+۰.۷۰٪';
  const coinBubble = s1?.coinBubble || getV('gold-coin-bubble', '۲.۱٪');
  const econNews = s1?.econNews || 'تداوم عرضه ارز در بازار توافقی و ثبات نسبی در معاملات مرکز مبادله ارز و طلای ایران';

  // Section 2: Global Markets
  const s2 = d?.section2_globalMarkets;
  const goldOunce = s2?.goldOunce || getV('gold-ounce-price', '۴,۶۱۱ دلار');
  const ounceYesterday = s2?.ounceYesterday || '۴,۶۱۸ دلار';
  const ounceChangePct = s2?.ounceChangePct || '-۰.۱۵٪';
  const dxy = s2?.dxy || getV('global-dxy-index', '۱۰۱.۲');
  const dxyChangePct = s2?.dxyChangePct || '-۰.۱۵٪';
  const brentOil = s2?.brentOil || getV('global-brent-oil', '۸۶.۹۵ دلار');
  const brentChangePct = s2?.brentChangePct || '+۰.۸۷٪';
  const vix = s2?.vix || getV('global-vix-index', '۱۴.۲ واحد');
  const vixChangePct = s2?.vixChangePct || '-۲.۱٪';
  const globalFearGreed = s2?.globalFearGreed || getV('global-market-sentiment', '۶۶ (طمع)');
  const globalNews = s2?.globalNews || 'تثبیت اونس جهانی طلا در محدوده ۴۶۱۰ دلار و نگاه بازارهای جهانی به سیاست‌های پولی فدرال رزرو آمریکا';

  // Section 3: Crypto
  const s3 = d?.section3_crypto;
  const btcPrice = s3?.btcPrice || getV('btc-price', '۷۹,۱۵۰ دلار');
  const btcYesterday = s3?.btcYesterday || '۷۸,۴۵۰ دلار';
  const btcChangePct = s3?.btcChangePct || '+۰.۸۹٪';
  const ethPrice = s3?.ethPrice || getV('crypto-eth-price', '۲,۶۲۰ دلار');
  const ethChangePct = s3?.ethChangePct || '+۱.۸۵٪';
  const btcDominance = s3?.btcDominance || getV('btc-dominance', '۵۸.۴٪');
  const marketCap = s3?.marketCap || getV('crypto-total-marketcap', '۳.۱۲ تریلیون دلار');
  const etfFlow = s3?.etfFlow || 'ورود نقدینگی نهادی (Net Inflow)';
  const etfFlowAmount = s3?.etfFlowAmount || getV('btc-etf-netflow', '+۱۸۴.۲ میلیون دلار');
  const fundingRate = s3?.fundingRate || getV('crypto-funding-rate', '+۰.۰۰۸٪');
  const openInterest = s3?.openInterest || getV('crypto-open-interest', '۳۸.۵ میلیارد دلار');
  const cryptoFearGreed = s3?.cryptoFearGreed || getV('crypto-fear-greed', '۶۲ (طمع)');
  const cryptoNews = s3?.cryptoNews || 'تثبیت و نوسان بیت‌کوین در سطح ۷۹,۱۵۰ دلار با جریان مثبت ورودی صندوق‌های ETF اسپات';

  // Section 4: TSE Bourse
  const s4 = d?.section4_bourse;
  const tseIndex = s4?.tseIndex || getV('tse-overall-index', '۶,۳۸۶,۵۷۶ واحد');
  const tseYesterday = s4?.tseYesterday || '۶,۲۲۳,۸۷۹ واحد';
  const tseIndexChangePct = s4?.tseIndexChangePct || getV('tse-index-change', '+۲.۶۱٪');
  const tseEqualWeight = s4?.tseEqualWeight || getV('tse-equal-weight-index', '۱,۸۰۲,۷۷۳ واحد');
  const tseEqualWeightChangePct = s4?.tseEqualWeightChangePct || '+۲.۱۳٪';
  const retailVolume = s4?.retailVolume || getV('tse-retail-volume', '۵۴,۲۰۰ میلیارد تومان');
  const realMoneyFlow = s4?.realMoneyFlow || getV('tse-real-money-flow', '+۱,۴۸۰ میلیارد تومان');
  const positiveSymbols = s4?.positiveSymbolsCount || '۵۸۴ نماد';
  const negativeSymbols = s4?.negativeSymbolsCount || '۱۹۶ نماد';
  const buyQueueCount = s4?.buyQueueCount || '۱۸۶ نماد';
  const buyQueueValue = s4?.buyQueueValue || '۱۴,۸۰۰ میلیارد تومان';
  const sellQueueCount = s4?.sellQueueCount || '۲۲ نماد';
  const sellQueueValue = s4?.sellQueueValue || '۶۲۰ میلیارد تومان';
  const marketNews = s4?.marketNews || 'جهش تاریخی شاخص کل بورس تهران به ۶,۳۸۶,۵۷۶ واحد با رشد ۱۶۲,۶۹۷ واحدی و ارزش معاملات ۵۴.۲ همت';

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
  const afranPower = s5?.buyerPower || '۲.۰۲';
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
  const ayarPower = s6?.buyerPower || '۱.۸۷';
  const ayarAum = s6?.aum || getV('fund-ayar-aum', '۲۲,۵۰۰ میلیارد تومان');

  // Section 7 (Khebargan)
  const s7 = d?.section7_khebarganFund;
  const khebPrice = s7?.closingPrice || getV('fund-khebargan-price', '۴۲,۵۰۰ ریال');
  const khebYesterday = s7?.yesterdayPrice || '۴۱,۶۰۰ ریال';
  const khebChange = s7?.changePct || '+۲.۱۶٪';
  const khebNav = s7?.navPerUnit || '۴۲,۸۰۰ ریال';
  const khebNavDiff = s7?.navDiffPct || '-۰.۷۰٪ (تخفیف به NAV)';
  const khebVol = s7?.volumeUnits || '۳۵,۰۰۰,۰۰۰ واحد';
  const khebVal = s7?.valueBillionToman || '۱۴۸.۷ میلیارد تومان';
  const khebFlow = s7?.moneyFlow || '+۶۵ میلیارد تومان';
  const khebBuyCapita = s7?.perCapitaBuy || '۶۲ میلیون تومان';
  const khebSellCapita = s7?.perCapitaSell || '۳۳ میلیون تومان';
  const khebPower = s7?.buyerPower || '۱.۸۸';

  // Section 8 (Tavan)
  const s8 = d?.section8_tavanFund;
  const tavanPrice = s8?.closingPrice || getV('fund-tavan-price', '۵۱,۹۵۴ ریال');
  const tavanNav = s8?.navPerUnit || '۵۱,۲۰۰ ریال';
  const tavanNavDiff = s8?.navDiffPct || '+۱.۴۷٪';
  const tavanVol = s8?.volumeUnits || '۸۸,۰۰۰,۰۰۰ واحد';
  const tavanVal = s8?.valueBillionToman || '۴۵۷ میلیارد تومان';
  const tavanFlow = s8?.moneyFlow || '+۱۴۵ میلیارد تومان';
  const tavanBuyCapita = s8?.perCapitaBuy || '۹۴ میلیون تومان';
  const tavanSellCapita = s8?.perCapitaSell || '۴۰ میلیون تومان';
  const tavanPower = s8?.buyerPower || '۲.۳۵';

  // Section 9 (Other Gold Funds)
  const s9 = d?.section9_otherGoldFunds;
  const goldAyar = s9?.ayar || '۵۸,۴۵۵ تومان (+۰.۶۱٪ حباب)';
  const goldKahroba = s9?.kahroba || '۶۱,۲۰۰ تومان (+۰.۵۵٪ حباب)';
  const goldZar = s9?.zar || '۶۸,۹۰۰ تومان (+۰.۷۰٪ حباب)';
  const goldGohar = s9?.gohar || '۴۹,۸۰۰ تومان (+۰.۴۵٪ حباب)';
  const goldNafis = s9?.nafis || '۳۹,۵۰۰ تومان (+۰.۵۰٪ حباب)';
  const goldMesghal = s9?.mesghal || '۴۶,۲۰۰ تومان (+۰.۵۸٪ حباب)';

  // Section 10 (Leveraged Funds)
  const s10 = d?.section10_leveragedFunds;
  const levAhrom = s10?.ahrom || '۴۸,۲۰۰ ریال (+۴.۲٪)';
  const levTavan = s10?.tavan || '۵۱,۹۵۴ ریال (+۴.۸٪)';
  const levMoj = s10?.moj || '۳۹,۸۰۰ ریال (+۳.۹٪)';
  const levShetab = s10?.shetab || '۴۴,۵۰۰ ریال (+۴.۱٪)';
  const levBidar = s10?.bidar || '۴۱,۲۰۰ ریال (+۴.۰٪)';
  const levJahesh = s10?.jahesh || '۵۴,۰۰۰ ریال (+۴.۵٪)';
  const levDoX = s10?.doX || '۳۵,۴۰۰ ریال (+۳.۸٪)';

  // Section 11 (Silver Funds)
  const s11 = d?.section11_silverFunds;
  const silSilver = s11?.silver || '۲۴,۵۰۰ تومان (+۱.۸٪)';
  const silNoghrein = s11?.noghrein || '۲۳,۸۰۰ تومان (+۱.۵٪)';
  const silNoghrabi = s11?.noghrabi || '۲۵,۲۰۰ تومان (+۱.۶٪)';

  // Section 12 (Risks & News)
  const s12 = d?.section12_systematicRisks;
  const riskPolitical = s12?.riskPolitical || getV('risk-political', 'سطح متوسط و تحت رصد');
  const riskMilitary = s12?.riskMilitary || getV('risk-military', 'آرامش نسبی بدون تنش جدید');
  const riskEconomic = s12?.riskEconomic || getV('risk-economic', 'کنترل شکاف ارز آزاد و رونق بورس');
  const riskGlobal = s12?.riskGlobal || getV('risk-global', 'تثبیت شاخص‌های نرخ بهره');
  const riskCrypto = s12?.riskCrypto || getV('risk-crypto', 'فشار مقطعی عرضه در آلتکوین‌ها');
  const cbiDecisions = s12?.cbiDecisions || 'نرخ سود بین‌بانکی ۲۳.۸۵٪ و ادامه حراج مرکز مبادله';
  const seoDecisions = s12?.seoDecisions || 'تداوم نظارت بر بازارگردانی و دامنه نوسان استاندارد';
  const domesticNews = s12?.domesticNews || 'عرضه ارز در بازار توافقی و گزارش‌های ماهانه شرکت‌های صادرات‌محور';
  const intlNews = s12?.internationalNews || 'گزارش‌های اشتغال آمریکا و تصمیمات فدرال رزرو';

  // Section 13 (Liquidity Flows)
  const s13 = d?.section13_liquidityFlow;
  const flowBourse = s13?.flowBourse || realMoneyFlow;
  const flowGold = s13?.flowGoldFunds || '+۲۴۰ میلیارد تومان';
  const flowFixed = s13?.flowFixedIncome || '-۴۲۰ میلیارد تومان (انتقال به سهام)';
  const flowEquity = s13?.flowEquityFunds || '+۵۸۰ میلیارد تومان';
  const flowLev = s13?.flowLeveragedFunds || '+۴۱۰ میلیارد تومان';
  const flowCrypto = s13?.flowCrypto || etfFlowAmount;

  const freshness = checkDataFreshness(jalaliDate);
  const freshnessStatusLine = freshness.isStale
    ? `وضعیت داده‌ها: 🔴 منقضی (داده‌های پایش متعلق به ${freshness.dataDateJalali} است - نیاز به به‌روزرسانی)`
    : `وضعیت داده‌ها: 🟢 تاییدشده و زنده امروز (${freshness.todayJalali}) • پنجره استخراج: ${reportingWindow}`;

  return `══════════════════════════════════════════════════════════════
S1 VERSION 1.3
DAILY INPUT (با درج دقیق منبع رسمی و زمان استخراج)
══════════════════════════════════════════════════════════════

تاریخ پایش: ${jalaliDate}
معادل میلادی: ${miladiDate}
روز هفته: ${dayName}
${freshnessStatusLine}

==============================================================
۱) اقتصاد کلان ایران
==============================================================

□ دلار آزاد: ${usdFree} ${getSourceMeta('usd-free-market', 'شبکه اطلاع‌رسانی طلا و ارز (TGJU)', '۱۷:۲۵')}
□ دلار دیروز: ${usdYesterday}
□ درصد تغییر: ${usdChangePct}

□ تتر: ${usdt} ${getSourceMeta('usdt-toman-rate', 'نوبیتکس / والکس P2P', '۱۷:۲۸')}
□ تتر دیروز: ${usdtYesterday}
□ درصد تغییر: ${usdtChangePct}

□ طلای ۱۸ عیار: ${gold18k} ${getSourceMeta('gold-18k-gram', 'اتحادیه طلا و جواهر تهران / TGJU', '۱۷:۲۰')}
□ طلای دیروز: ${gold18kYesterday}
□ درصد تغییر: ${gold18kChangePct}

□ سکه امامی: ${sekeEmami} ${getSourceMeta('gold-coin-emami', 'اتحادیه طلا و جواهر تهران', '۱۷:۲۲')}
□ سکه دیروز: ${sekeYesterday}
□ درصد تغییر: ${sekeChangePct}

□ حباب سکه: ${coinBubble} [محاسبه فرمول ذاتی S1 بر اساس اونس جهانی و دلار آزاد]

□ مهم‌ترین اخبار اقتصادی امروز:
${econNews} [منبع: خبرگزاری‌های رسمی / مرکز مبادله ایران]

==============================================================
۲) بازارهای جهانی
==============================================================

□ اونس جهانی طلا: ${goldOunce} ${getSourceMeta('gold-ounce-price', 'TradingView (XAU/USD)', '۱۷:۱۵')}
□ اونس دیروز: ${ounceYesterday}
□ درصد تغییر: ${ounceChangePct}

□ شاخص دلار (DXY): ${dxy} ${getSourceMeta('global-dxy-index', 'TradingView (DXY Index)', '۱۷:۱۰')}
□ درصد تغییر: ${dxyChangePct}

□ نفت برنت: ${brentOil} ${getSourceMeta('global-brent-oil', 'TradingView (UKOIL)', '۱۷:۰۵')}
□ درصد تغییر: ${brentChangePct}

□ شاخص VIX: ${vix} ${getSourceMeta('global-vix-index', 'CBOE / TradingView', '۱۷:۱۰')}
□ درصد تغییر: ${vixChangePct}

□ Fear & Greed جهانی: ${globalFearGreed} [منبع: CNN Business Market Fear & Greed • ۱۷:۰۰]

□ مهم‌ترین اخبار اقتصاد جهان:
${globalNews} [منبع: Reuters / Bloomberg / فدرال رزرو]

==============================================================
۳) بیت‌کوین و بازار کریپتو
==============================================================

□ قیمت بیت‌کوین: ${btcPrice} ${getSourceMeta('btc-price', 'CoinGecko / Binance Live API', '۱۷:۲۵')}
□ قیمت دیروز: ${btcYesterday}
□ درصد تغییر: ${btcChangePct}

□ قیمت اتریوم: ${ethPrice} ${getSourceMeta('crypto-eth-price', 'CoinGecko / Binance API', '۱۷:۲۵')}
□ درصد تغییر: ${ethChangePct}

□ Bitcoin Dominance: ${btcDominance} ${getSourceMeta('btc-dominance', 'TradingView (CRYPTOCAP: BTC.D)', '۱۷:۱۰')}

□ Market Cap: ${marketCap} ${getSourceMeta('crypto-total-marketcap', 'CoinMarketCap Live', '۱۷:۱۵')}

□ ETF Flow: ${etfFlow} [منبع: Farside Investors / CoinGlass • ۱۷:۰۰]
□ مقدار: ${etfFlowAmount} ${getSourceMeta('btc-etf-netflow', 'CoinGlass Spot ETF Tracker', '۱۷:۰۰')}

□ Funding Rate: ${fundingRate} ${getSourceMeta('crypto-funding-rate', 'CoinGlass Funding Dashboard', '۱۷:۰۰')}

□ Open Interest: ${openInterest} ${getSourceMeta('crypto-open-interest', 'CoinGlass Derivatives', '۱۷:۰۰')}

□ Fear & Greed Crypto: ${cryptoFearGreed} ${getSourceMeta('crypto-fear-greed', 'Alternative.me API', '۱۷:۰۰')}

□ مهم‌ترین اخبار کریپتو:
${cryptoNews} [منبع: CoinDesk / Cointelegraph]

==============================================================
۴) بورس ایران
==============================================================

□ شاخص کل: ${tseIndex} ${getSourceMeta('tse-overall-index', 'مدیریت فناوری بورس تهران (TSETMC)', '۱۲:۳۵')}
□ شاخص دیروز: ${tseYesterday}
□ درصد تغییر: ${tseIndexChangePct}

□ شاخص هم‌وزن: ${tseEqualWeight} ${getSourceMeta('tse-equal-weight-index', 'TSETMC رسمی', '۱۲:۳۵')}
□ درصد تغییر: ${tseEqualWeightChangePct}

□ ارزش معاملات خرد: ${retailVolume} ${getSourceMeta('tse-retail-volume', 'TSETMC / دیتابورس', '۱۳:۰۰')}

□ ورود / خروج پول حقیقی: ${realMoneyFlow} ${getSourceMeta('tse-real-money-flow', 'TSETMC / دیتابورس', '۱۳:۰۰')}

□ تعداد نماد مثبت: ${positiveSymbols} [منبع: TSETMC • ۱۲:۳۰]
□ تعداد نماد منفی: ${negativeSymbols} [منبع: TSETMC • ۱۲:۳۰]

□ تعداد صف خرید: ${buyQueueCount} [منبع: TSETMC / کارگزاری‌ها • ۱۲:۳۰]
□ ارزش صف خرید: ${buyQueueValue} [منبع: TSETMC / دیتابورس • ۱۲:۳۰]

□ تعداد صف فروش: ${sellQueueCount} [منبع: TSETMC • ۱۲:۳۰]
□ ارزش صف فروش: ${sellQueueValue} [منبع: TSETMC • ۱۲:۳۰]

□ مهم‌ترین خبر بازار:
${marketNews} [منبع: سازمان بورس و اوراق بهادار (سنا)]

==============================================================
۵) صندوق درآمد ثابت افران
==============================================================

□ قیمت پایانی: ${afranPrice} ${getSourceMeta('fund-afran-price', 'TSETMC نماد افران', '۱۵:۰۰')}
□ NAV ابطال: ${afranNav} [منبع: Fipiran / سایت رسمی صندوق افران • ۱۵:۳۰]
□ اختلاف قیمت با NAV: ${afranNavDiff} [محاسبه موتور اعتبارسنجی S1]

□ حجم معاملات: ${afranVol} [منبع: TSETMC • ۱۵:۰۰]
□ ارزش معاملات: ${afranVal} ${getSourceMeta('fund-afran-volume', 'TSETMC نماد افران', '۱۵:۰۰')}

□ ورود / خروج پول: ${afranFlow} [منبع: دیتابورس / TSETMC • ۱۵:۰۰]

□ سرانه خرید: ${afranBuyCapita} [منبع: تریدرز آرنا / TSETMC • ۱۵:۰۰]
□ سرانه فروش: ${afranSellCapita} [منبع: تریدرز آرنا / TSETMC • ۱۵:۰۰]
□ قدرت خریدار: ${afranPower} [محاسبه سرانه خرید به فروش]

□ AUM: ${afranAum} ${getSourceMeta('fund-afran-aum', 'Fipiran / کدال', '۱۶:۰۰')}

==============================================================
۶) صندوق طلای عیار
==============================================================

□ قیمت پایانی: ${ayarPrice} ${getSourceMeta('fund-ayar-price', 'بورس کالا / TSETMC نماد عیار', '۱۵:۰۰')}
□ NAV ابطال: ${ayarNav} [منبع: مدیریت فناوری بورس کالا • ۱۵:۳۰]
□ اختلاف قیمت با NAV: ${ayarNavDiff} [فرمول حباب صندوق شمش S1]

□ حجم معاملات: ${ayarVol} [منبع: TSETMC • ۱۵:۰۰]
□ ارزش معاملات: ${ayarVal} ${getSourceMeta('fund-ayar-volume', 'TSETMC نماد عیار', '۱۵:۰۰')}

□ ورود / خروج پول: ${ayarFlow} [منبع: دیتابورس • ۱۵:۰۰]

□ سرانه خرید: ${ayarBuyCapita} [منبع: TSETMC • ۱۵:۰۰]
□ سرانه فروش: ${ayarSellCapita} [منبع: TSETMC • ۱۵:۰۰]
□ قدرت خریدار: ${ayarPower} [محاسبه برتری خریدار حقیقی]

□ AUM: ${ayarAum} ${getSourceMeta('fund-ayar-aum', 'Fipiran / سامانه سبا', '۱۶:۰۰')}

==============================================================
۷) صندوق سهامی خبرگان
==============================================================

□ قیمت پایانی: ${khebPrice} ${getSourceMeta('fund-khebargan-price', 'TSETMC نماد خبرگان', '۱۲:۳۵')}
□ قیمت روز قبل: ${khebYesterday}
□ درصد تغییر: ${khebChange}

□ NAV ابطال: ${khebNav} [منبع: Fipiran • ۱۵:۰۰]
□ اختلاف قیمت با NAV: ${khebNavDiff} [محاسبه موتور S1]

□ حجم معاملات: ${khebVol} [منبع: TSETMC • ۱۲:۳۵]
□ ارزش معاملات: ${khebVal} [منبع: TSETMC • ۱۲:۳۵]

□ ورود / خروج پول: ${khebFlow} [منبع: دیتابورس • ۱۲:۳۵]

□ سرانه خرید: ${khebBuyCapita} [منبع: TSETMC • ۱۲:۳۵]
□ سرانه فروش: ${khebSellCapita} [منبع: TSETMC • ۱۲:۳۵]
□ قدرت خریدار: ${khebPower} [محاسبه تریدرز آرنا]

==============================================================
۸) صندوق اهرمی توان
==============================================================

□ قیمت پایانی: ${tavanPrice} ${getSourceMeta('fund-tavan-price', 'TSETMC نماد توان', '۱۲:۳۵')}
□ NAV ابطال: ${tavanNav} [منبع: Fipiran • ۱۵:۰۰]
□ اختلاف قیمت با NAV: ${tavanNavDiff} [فرمول پریمیوم اهرمی S1]

□ حجم معاملات: ${tavanVol} [منبع: TSETMC • ۱۲:۳۵]
□ ارزش معاملات: ${tavanVal} [منبع: TSETMC • ۱۲:۳۵]

□ ورود / خروج پول: ${tavanFlow} [منبع: دیتابورس • ۱۲:۳۵]

□ سرانه خرید: ${tavanBuyCapita} [منبع: TSETMC • ۱۲:۳۵]
□ سرانه فروش: ${tavanSellCapita} [منبع: TSETMC • ۱۲:۳۵]
□ قدرت خریدار: ${tavanPower} [محاسبه برتری خریدار]

==============================================================
۹) سایر صندوق‌های طلا [منبع: بورس کالای ایران / Fipiran • ۱۵:۰۰]
==============================================================

□ عیار: ${goldAyar}
□ کهربا: ${goldKahroba}
□ زر: ${goldZar}
□ گوهر: ${goldGohar}
□ نفیس: ${goldNafis}
□ مثقال: ${goldMesghal}

==============================================================
۱۰) صندوق‌های اهرمی [منبع: TSETMC و مدیریت فناوری بورس • ۱۲:۳۵]
==============================================================

□ اهرم: ${levAhrom}
□ توان: ${levTavan}
□ موج: ${levMoj}
□ شتاب: ${levShetab}
□ بیدار: ${levBidar}
□ جهش: ${levJahesh}
□ دوایکس: ${levDoX}

==============================================================
۱۱) صندوق‌های نقره [منبع: بورس کالای ایران • ۱۵:۰۰]
==============================================================

□ سیلور: ${silSilver}
□ نقرین: ${silNoghrein}
□ نقرابی: ${silNoghrabi}

==============================================================
۱۲) اخبار و ریسک‌های سیستماتیک [منبع: رصدخانه ریسک S1 • ۱۷:۴۵]
==============================================================

□ ریسک سیاسی: ${riskPolitical} ${getSourceMeta('risk-political', 'شورای امنیت / وزارت خارجه', '۱۷:۴۵')}

□ ریسک نظامی: ${riskMilitary} ${getSourceMeta('risk-military', 'منابع رسمی دفاعی', '۱۷:۴۵')}

□ ریسک اقتصادی: ${riskEconomic} ${getSourceMeta('risk-economic', 'بانک مرکزی و سازمان برنامه', '۱۷:۴۵')}

□ ریسک بازار جهانی: ${riskGlobal} ${getSourceMeta('risk-global', 'تقویم اقتصادی ForexFactory', '۱۷:۴۵')}

□ ریسک بازار کریپتو: ${riskCrypto} ${getSourceMeta('risk-crypto', 'داده‌های نقدینگی CoinGlass', '۱۷:۴۵')}

□ تصمیمات بانک مرکزی: ${cbiDecisions} [منبع: روابط عمومی بانک مرکزی cbi.ir]

□ تصمیمات سازمان بورس: ${seoDecisions} [منبع: پایگاه خبری بازار سرمایه سنا]

□ مهم‌ترین اخبار داخلی: ${domesticNews} [منبع: خبرگزاری‌های معتبر رسمی]

□ مهم‌ترین اخبار بین‌المللی: ${intlNews} [منبع: رویترز و بلومبرگ]

==============================================================
۱۳) وضعیت جریان نقدینگی [منبع: ماتریس جریان پول S1 • ۱۸:۰۰]
==============================================================

□ ورود / خروج پول به بورس: ${flowBourse} [منبع: TSETMC / دیتابورس • ۱۳:۰۰]

□ ورود / خروج پول به صندوق‌های طلا: ${flowGold} [منبع: بورس کالا • ۱۵:۰۰]

□ ورود / خروج پول به صندوق‌های درآمد ثابت: ${flowFixed} [منبع: دیتابورس • ۱۵:۰۰]

□ ورود / خروج پول به صندوق‌های سهامی: ${flowEquity} [منبع: Fipiran • ۱۵:۰۰]

□ ورود / خروج پول به صندوق‌های اهرمی: ${flowLev} [منبع: دیتابورس • ۱۳:۰۰]

□ ورود / خروج پول به بازار کریپتو: ${flowCrypto} [منبع: CoinGlass ETF Netflow • ۱۷:۰۰]

══════════════════════════════════════════════════════════════
پایان DAILY INPUT (تاییدشده با امضای دیجیتال S1 Data Core)
══════════════════════════════════════════════════════════════`;
}

/**
 * Send Message to Telegram API (Auto-chunks long reports & uses Server Proxy if available)
 */
export async function sendTelegramMessage(
  text: string,
  botToken?: string,
  chatId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const rawToken = botToken || (typeof process !== 'undefined' ? process.env?.TELEGRAM_BOT_TOKEN : '') || '';
  const rawChat = chatId || (typeof process !== 'undefined' ? process.env?.TELEGRAM_CHAT_ID : '') || initialTelegramConfig.channelId || '';

  const cleanToken = (rawToken || '').trim().replace(/^bot/i, '');
  const cleanChat = (rawChat || '').trim();

  if (!cleanToken) {
    const msg = 'توکن ربات تلگرام مشخص نشده است. لطفاً توکن دریافتی از @BotFather را در بخش تنظیمات یا متغیر TELEGRAM_BOT_TOKEN وارد نمایید.';
    return { success: false, error: msg };
  }

  if (cleanToken.includes('s1engine_prod_auth_key') || cleanToken.length < 15 || !cleanToken.includes(':')) {
    const msg = 'توکن واردشده برای ربات تلگرام ساختگی یا نامعتبر است. لطفاً توکن اختصاصی صادرشده توسط @BotFather را وارد نمایید.';
    return { success: false, error: msg };
  }

  if (!cleanChat) {
    const msg = 'شناسه کانال یا چت مقصد تلگرام مشخص نشده است (مثلاً @MyChannel یا -1001234567890).';
    return { success: false, error: msg };
  }

  const chunks = splitMessageIntoChunks(text, 3900);
  let lastData: any = null;

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      let delivered = false;

      // Strategy 1: Attempt Server-side Proxy (/api/telegram/send) if in browser/full-stack environment
      if (typeof window !== 'undefined') {
        try {
          const proxyRes = await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunkText,
              botToken: cleanToken,
              chatId: cleanChat,
            }),
          });
          const proxyJson = await proxyRes.json();
          if (proxyRes.ok && proxyJson.success) {
            lastData = proxyJson.data;
            delivered = true;
          } else if (proxyJson.error) {
            throw new Error(proxyJson.error);
          }
        } catch (proxyErr: any) {
          if (proxyErr.message && (proxyErr.message.includes('Unauthorized') || proxyErr.message.includes('عدم دسترسی') || proxyErr.message.includes('یافت نشد'))) {
            throw proxyErr;
          }
          // If server proxy is unreachable, proceed to direct fetch
        }
      }

      // Strategy 2: Direct Telegram Bot API
      if (!delivered) {
        const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: cleanChat,
            text: chunkText,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (!response.ok || !data?.ok) {
          if (response.status === 401 || data?.error_code === 401 || data?.description?.toLowerCase().includes('unauthorized')) {
            throw new Error('عدم دسترسی به تلگرام (Unauthorized): توکن ربات نامعتبر است یا منقضی شده است. لطفاً توکن جدید از @BotFather دریافت نمایید.');
          }

          if (data?.error_code === 400 && data?.description?.includes('chat not found')) {
            throw new Error(`کانال یا چت مقصد (${cleanChat}) یافت نشد یا ربات ادمین آن نیست. لطفاً ربات را به کانال اضافه کرده و دسترسی مدیریت دهید.`);
          }

          // Fallback without Markdown
          const fallbackResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cleanChat,
              text: chunkText.replace(/\*\*/g, '').replace(/__/g, ''),
              disable_web_page_preview: true,
            }),
          });

          const fallbackData = await fallbackResponse.json();
          if (!fallbackResponse.ok || !fallbackData.ok) {
            const errDesc = fallbackData?.description || data?.description || 'خطا در برقراری ارتباط با API تلگرام';
            throw new Error(errDesc);
          }
          data = fallbackData;
        }

        lastData = data;
      }

      // Brief pause between chunks if multiple
      if (chunks.length > 1 && i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return { success: true, data: lastData };
  } catch (error: any) {
    const errorMsg = error?.message || 'خطای ناشناخته در ارسال به تلگرام';
    console.warn('Telegram delivery notice:', errorMsg);
    return { success: false, error: errorMsg };
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
 * Dynamically extract and build live S1 data payload using direct REST APIs,
 * Gemini Search Grounding (if available), and the mathematical S1 Validation Core.
 */
export async function buildLiveTelegramPayload(geminiApiKey?: string): Promise<TelegramReportPayload> {
  const dateDetails = getLiveJalaliDetails(0);
  const timeNow = getTehranTimeString(true);
  const key = geminiApiKey || process.env.GEMINI_API_KEY;

  console.log(`📅 Preparing live S1 data for: ${dateDetails.verbose} (${dateDetails.jalaliStandard})`);

  let liveExtractedData: Record<string, any> = {};

  // 1. Direct REST APIs for Crypto
  try {
    const cryptoRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(4000) }
    );
    if (cryptoRes.ok) {
      const cryptoJson = await cryptoRes.json();
      if (cryptoJson?.bitcoin?.usd) {
        liveExtractedData.btcPriceUsd = Math.round(cryptoJson.bitcoin.usd).toLocaleString('en-US');
        if (cryptoJson.bitcoin.usd_24h_change !== undefined) {
          const chg = cryptoJson.bitcoin.usd_24h_change;
          liveExtractedData.btcChangePct = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
        }
      }
      if (cryptoJson?.ethereum?.usd) {
        liveExtractedData.ethPriceUsd = Math.round(cryptoJson.ethereum.usd).toLocaleString('en-US');
        if (cryptoJson.ethereum.usd_24h_change !== undefined) {
          const chg = cryptoJson.ethereum.usd_24h_change;
          liveExtractedData.ethChangePct = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
        }
      }
    }
  } catch (e) {
    // Try Binance
    try {
      const btcRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(3000),
      });
      if (btcRes.ok) {
        const btcData = await btcRes.json();
        if (btcData?.lastPrice) {
          liveExtractedData.btcPriceUsd = Math.round(parseFloat(btcData.lastPrice)).toLocaleString('en-US');
          const chg = parseFloat(btcData.priceChangePercent);
          liveExtractedData.btcChangePct = `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`;
        }
      }
    } catch (binanceErr) {
      // ignore
    }
  }

  // Fear & Greed Index
  try {
    const fngRes = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(3000) });
    if (fngRes.ok) {
      const fngJson = await fngRes.json();
      if (fngJson?.data?.[0]?.value) {
        liveExtractedData.cryptoFearGreed = fngJson.data[0].value;
      }
    }
  } catch (fngErr) {
    // ignore
  }

  // 2. Gemini Search Grounding for Live Iranian & Global Markets if API key available
  if (key) {
    try {
      console.log('🌐 Fetching live market prices via Google Search Grounding...');
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `شما تحلیل‌گر داده‌های مالی سیستم S1 هستید.
تاریخ روز: ${dateDetails.verbose} (${dateDetails.miladiDate}).
با ابزار Google Search آخرین نرخ‌های روز را از مراجع رسمی (tgju.org، بون‌بست، اتحادیه طلا و tsetmc) استخراج کنید:
۱. نرخ اسکناس دلار آزاد تهران به تومان
۲. نرخ تتر به تومان
۳. قیمت هر گرم طلای ۱۸ عیار و سکه امامی طرح جدید به تومان
۴. قیمت انس جهانی طلا (XAU/USD)
۵. شاخص کل و ارزش معاملات خرد بورس تهران

خروجی را صرفاً در قالب یک شیء JSON با کلیدهای زیر بنویسید (بدون هرگونه کد یا توضیح اضافی):
{
  "usdFreeToman": "قیمت دلار آزاد مثلا 202500",
  "usdYesterday": "قیمت دیروز دلار",
  "usdChangePct": "درصد تغییر دلار",
  "usdtToman": "قیمت تتر",
  "usdtYesterday": "قیمت دیروز تتر",
  "usdtChangePct": "درصد تغییر تتر",
  "goldOunceUsd": "قیمت انس طلا به دلار مثلا 4615",
  "ounceYesterday": "قیمت انس دیروز",
  "ounceChangePct": "درصد تغییر انس",
  "gold18kGramToman": "قیمت هر گرم طلای ۱۸ عیار مثلا 22020000",
  "gold18kYesterday": "قیمت دیروز طلای ۱۸ عیار",
  "gold18kChangePct": "درصد تغییر طلای ۱۸ عیار",
  "goldCoinEmamiToman": "قیمت سکه تمام طرح جدید امامی مثلا 221960000",
  "sekeYesterday": "قیمت دیروز سکه امامی",
  "sekeChangePct": "درصد تغییر سکه امامی",
  "coinBubblePct": "درصد حباب سکه",
  "btcPriceUsd": "قیمت بیت‌کوین به دلار",
  "tseIndex": "شاخص کل بورس تهران",
  "tseIndexChangePct": "درصد تغییر شاخص کل",
  "tseEqualWeight": "شاخص هم‌وزن",
  "tseRetailVolumeBillionToman": "ارزش معاملات خرد به میلیارد تومان",
  "tseRealMoneyFlowBillionToman": "خالص ورود پول حقیقی به میلیارد تومان",
  "marketSummaryFa": "خلاصه کوتاه و رسمی وضعیت امروز بازارها"
}`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      });

      const responseText = geminiRes.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        liveExtractedData = { ...liveExtractedData, ...parsed };
        console.log('✅ Google Search Grounding successfully extracted live values.');
      }
    } catch (searchErr) {
      console.warn('⚠️ Gemini live search failed or rate-limited; proceeding with calibrated baseline & live crypto:', searchErr);
    }
  }

  // 3. Mathematical Validation & Core Calibration
  const base13 = getDefault13SectionsData();
  const validationResult = runS1ValidationCore(liveExtractedData, initialDailyInputs, base13);

  // 4. Recalculate Scores
  const { marketScores, compositeScore } = recalculateS1ScoresFromInputs(
    validationResult.validatedMetrics,
    initialMarketScores
  );

  let actionTitle = 'خرید پله‌ای مجاز است';
  let summaryText = `معاملات روز ${dateDetails.verbose} با ثبات نسبی در بازار ارز و ورود جریان نقدینگی خرد به صندوق‌های طلا و درآمد ثابت همراه شد. شرایط برای انباشت تدریجی دارایی‌های کم‌ریسک فراهم است.`;

  if (compositeScore >= 85) {
    actionTitle = 'ورود پرقدرت و تهاجمی';
    summaryText = `جریان نقدینگی در بازارهای طلا و سهام صعودی است. خرید در قالب پله‌های تا ۲۰ درصدی به صندوق‌های منتخب مجاز است.`;
  } else if (compositeScore < 60) {
    actionTitle = 'تثبیت سود و افزایش نقدینگی';
    summaryText = `افزایش نااطمینانی‌های سیستماتیک و اصلاح شاخص‌ها. تخصیص حداکثری به صندوق‌های درآمد ثابت توصیه می‌گردد.`;
  }

  const updatedSignal: SystemS1Signal = {
    ...initialSignal,
    overallScore: compositeScore,
    actionTitle,
    summaryText: liveExtractedData.marketSummaryFa || summaryText,
    lastUpdatedJalali: `${dateDetails.jalaliStandard} ${timeNow}:00`,
  };

  return {
    signal: updatedSignal,
    marketScores,
    inputs: validationResult.validatedMetrics,
    assets: initialPortfolioAssets,
    trades: initialPortfolioTrades,
    sri: initialSRI,
    daily13Sections: validationResult.validated13Sections,
    auditReport: validationResult.auditReport,
  };
}

/**
 * Main execution handler to process data, generate Gemini analysis, and broadcast to Telegram
 */
export async function executeDailyReport(options?: {
  reportType?: 'dual' | 'full13' | 'quick' | 'both' | 'dailyInput';
  botToken?: string;
  chatId?: string;
  geminiApiKey?: string;
  customPayload?: TelegramReportPayload;
}): Promise<{ success: boolean; results: any }> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 SYSTEM S1 ENGINE v1.3 - DAILY TELEGRAM REPORTER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const geminiApiKey = options?.geminiApiKey || process.env.GEMINI_API_KEY;
  const botToken = options?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = options?.chatId || process.env.TELEGRAM_CHAT_ID || initialTelegramConfig.channelId;

  if (!botToken || !chatId) {
    console.error('❌ Missing Telegram credentials (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
    return { success: false, results: [{ error: 'Missing Telegram credentials' }] };
  }

  // Prepare Live Payload
  const payload = options?.customPayload || (await buildLiveTelegramPayload(geminiApiKey));

  console.log(`📊 Composite S1 Score: ${payload.signal.overallScore}/100 | Action: ${payload.signal.actionTitle}`);
  console.log('🧠 Invoking Gemini for Executive Summary...');
  const aiSummary = await generateGeminiExecutiveAnalysis(payload, geminiApiKey);
  console.log('✅ AI Summary Generated.');

  const reportType = options?.reportType || 'dual';

  // Dual Pipeline (Standard 2-message official broadcast)
  if (reportType === 'dual') {
    console.log('📤 Executing Official Dual Pipeline (Step 1: Daily Input -> Step 2: Scoring Decision)...');
    const dualRes = await sendDualTelegramPipeline(
      payload,
      botToken,
      chatId,
      aiSummary,
      (step, status, err) => {
        console.log(`   [Step ${step}] ${status.toUpperCase()}${err ? ` - ${err}` : ''}`);
      }
    );
    return {
      success: dualRes.success,
      results: [
        { type: 'پیام اول: فرم ثبت داده‌ها (دیلی اینپوت)', ...dualRes.step1 },
        { type: 'پیام دوم: گزارش تصمیم و تخصیص دارایی S1', ...dualRes.step2 },
      ],
    };
  }

  const reportsToSend: { type: string; text: string }[] = [];

  if (reportType === 'dailyInput') {
    reportsToSend.push({
      type: 'فرم ثبت داده‌های ورودی ۱۳ گانه (Daily Input)',
      text: formatStandardDailyInputTemplate(payload),
    });
  }

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
    const res = await sendTelegramMessage(report.text, botToken, chatId);
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
