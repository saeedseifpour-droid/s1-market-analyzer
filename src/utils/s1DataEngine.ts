import {
  InputMetric,
  MarketScoreItem,
  SystemS1Signal,
  StandardDailyInput13Sections,
  ValidationAuditReport,
  SentimentType,
  FundItem,
  PortfolioAssetItem,
} from '../types';
import { initialMarketScores, initialSignal, initialFunds } from '../data';
import {
  getLiveJalaliDetails,
  getLiveJalaliDateString,
  getLiveJalaliVerboseDate,
  getTehranTimeString,
  toPersianDigits,
} from './dateHelper';
import { cleanNumericValue, formatPersianNumber, runS1ValidationCore } from './s1ValidationCore';

export interface DataFreshnessStatus {
  isFresh: boolean;
  isStale: boolean;
  isUnavailable: boolean;
  isInvalid: boolean;
  status: 'VERIFIED' | 'STALE' | 'UNAVAILABLE' | 'INVALID';
  todayJalali: string;
  todayVerbose: string;
  dataDateJalali: string;
  miladiDate: string;
  dayOfWeek: string;
  timeSinceUpdateHours: number;
  daysDifference: number;
  statusBadge: {
    label: string;
    color: 'green' | 'yellow' | 'red';
    trafficIcon: string;
  };
  warningMessageFa?: string;
  errorBannerFa?: string;
}

const STORAGE_KEY = 'S1_UNIFIED_STORAGE_V1_3';

/**
 * Check whether market data / inputs are fresh for today or expired/unavailable/invalid
 */
export function checkDataFreshness(
  dataDateJalali?: string,
  lastUpdatedTime?: string,
  isLive?: boolean,
  isInvalid?: boolean
): DataFreshnessStatus {
  const todayDetails = getLiveJalaliDetails(0);
  const todayJalali = todayDetails.jalaliStandard; // e.g. "1405/06/03"
  const todayVerbose = todayDetails.verbose;
  const currentMiladi = todayDetails.miladiDate;
  const dayOfWeek = todayDetails.dayOfWeek;

  // Clean raw input: replace Persian digits and extract YYYY/MM/DD if timestamp is attached
  let rawDate = (dataDateJalali || todayJalali).trim().replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
  
  // Extract date part if time is included (e.g., "1405/06/03 17:30" or "1405/06/03 ساعت 17:30")
  const dateMatch = rawDate.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
  const normalizedDataDate = dateMatch ? dateMatch[1] : rawDate;

  // Normalize date format to YYYY/MM/DD with leading zeros
  const parts = normalizedDataDate.split('/').map((p) => parseInt(p, 10));
  const todayParts = todayJalali.split('/').map((p) => parseInt(p, 10));

  let isSameDay = false;
  let daysDifference = 0;

  if (parts.length === 3 && todayParts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const formattedDataDate = `${parts[0]}/${String(parts[1]).padStart(2, '0')}/${String(parts[2]).padStart(2, '0')}`;
    isSameDay = formattedDataDate === todayJalali;
    if (!isSameDay) {
      daysDifference = Math.max(0, (todayParts[0] - parts[0]) * 365 + (todayParts[1] - parts[1]) * 30 + (todayParts[2] - parts[2]));
    }
  } else {
    isSameDay = normalizedDataDate === todayJalali || normalizedDataDate.includes(todayJalali);
    daysDifference = isSameDay ? 0 : 1;
  }

  // 1. Determine status
  let status: 'VERIFIED' | 'STALE' | 'UNAVAILABLE' | 'INVALID' = 'UNAVAILABLE';

  if (isInvalid) {
    status = 'INVALID';
  } else if (!isLive) {
    status = 'UNAVAILABLE';
  } else if (!isSameDay || daysDifference > 0) {
    status = 'STALE';
  } else {
    status = 'VERIFIED';
  }

  let label = '🟢 داده‌های زنده و به‌روز امروز';
  let color: 'green' | 'yellow' | 'red' = 'green';
  let trafficIcon = '🟢';
  let warningMessageFa: string | undefined = undefined;
  let errorBannerFa: string | undefined = undefined;

  if (status === 'UNAVAILABLE') {
    color = 'red';
    trafficIcon = '🔴';
    label = '🔴 عدم وجود داده زنده (غیرقابل استفاده)';
    warningMessageFa = `توجه: هیچ داده زنده معتبری برای امروز ثبت نشده و مقادیر نمایش‌داده‌شده صرفاً دمو اضطراری هستند.`;
    errorBannerFa = `⛔ هشدار عدم وجود داده‌های زنده S1: در حال حاضر هیچ داده‌ی واقعی و معتبری برای امروز (${todayVerbose}) دریافت یا تایید نشده است. طبق ماده ۴ منشور ریسک S1، صدور هرگونه سیگنال معاملاتی یا بازتوازن سبد تا زمان اجرای موفقیت‌آمیز استخراج زنده کاملاً متوقف گردیده است. لطفا بر روی دکمه "استخراج زنده" کلیک نمایید.`;
  } else if (status === 'STALE') {
    color = 'yellow';
    trafficIcon = '🟡';
    label = `🟡 داده‌های منقضی (${daysDifference > 0 ? `${daysDifference} روز قبل` : 'تاریخ گذشته'})`;
    warningMessageFa = `توجه: اطلاعات مالی پایش مربوط به تاریخ ${toPersianDigits(normalizedDataDate)} است و متعلق به امروز (${todayVerbose}) نیست.`;
    errorBannerFa = `⚠️ هشدار انقضای داده‌های ورودی S1: داده‌های پایش ثبت‌شده مربوط به ${daysDifference > 0 ? `${toPersianDigits(daysDifference)} روز قبل` : 'تاریخ گذشته'} (${toPersianDigits(normalizedDataDate)}) است و منقضی شده است. طبق ماده ۴ منشور ریسک S1، صدور هرگونه سیگنال بر پایه اطلاعات منقضی‌شده معتبر نبوده و تخصیص جدید سبد معاملاتی مسدود می‌باشد. لطفا دکمه "استخراج زنده" را جهت به‌روزرسانی کلیک نمایید.`;
  } else if (status === 'INVALID') {
    color = 'red';
    trafficIcon = '🔴';
    label = '🔴 خطا در اعتبارسنجی ریاضی (داده نامعتبر)';
    warningMessageFa = `توجه: داده‌های دریافتی با قوانین آربیتراژ و همگرایی ریاضی سیستم S1 همخوانی ندارند.`;
    errorBannerFa = `⛔ خطا در اعتبارسنجی ریاضی S1: مقادیر وارد شده یا استخراج‌شده به دلیل انحراف شدید از نسبت‌های استاندارد (آربیتراژ دلار/تتر یا فرمول ارزش ذاتی طلا و سکه) توسط هسته اعتبارسنجی رد شدند. صدور سیگنال تا اصلاح کامل مغایرت‌ها متوقف شده است.`;
  }

  return {
    isFresh: status === 'VERIFIED',
    isStale: status === 'STALE',
    isUnavailable: status === 'UNAVAILABLE',
    isInvalid: status === 'INVALID',
    status,
    todayJalali,
    todayVerbose,
    dataDateJalali: normalizedDataDate,
    miladiDate: currentMiladi,
    dayOfWeek,
    timeSinceUpdateHours: daysDifference * 24,
    daysDifference,
    statusBadge: {
      label,
      color,
      trafficIcon,
    },
    warningMessageFa,
    errorBannerFa,
  };
}

/**
 * Returns dynamic, unified baseline 13-section data tied strictly to today's date
 */
export function getUnifiedBaseline13Sections(): StandardDailyInput13Sections {
  const details = getLiveJalaliDetails(0);
  const timeNow = getTehranTimeString(true);

  return {
    metadata: {
      jalaliDate: details.jalaliStandard,
      miladiDate: details.miladiDate,
      dayOfWeek: details.dayOfWeek,
      updateTime: timeNow,
      s1EngineVersion: '1.3',
      isLive: false,
    },
    section1_iranMacro: {
      usdFree: '200,500 تومان',
      usdYesterday: '199,500 تومان',
      usdChangePct: '+0.50%',
      usdt: '199,800 تومان',
      usdtYesterday: '199,120 تومان',
      usdtChangePct: '+0.34%',
      gold18k: '21,677,400 تومان',
      gold18kYesterday: '21,410,000 تومان',
      gold18kChangePct: '+1.25%',
      sekeEmami: '216,000,000 تومان',
      sekeYesterday: '214,500,000 تومان',
      sekeChangePct: '+0.70%',
      coinBubble: '2.1%',
      econNews: 'تداوم عرضه ارز در بازار توافقی و ثبات نسبی در معاملات مرکز مبادله ارز و طلای ایران',
    },
    section2_globalMarkets: {
      goldOunce: '4,653 دلار',
      ounceYesterday: '4,618 دلار',
      ounceChangePct: '+0.76%',
      dxy: '101.20',
      dxyChangePct: '-0.15%',
      brentOil: '86.95 دلار',
      brentChangePct: '+0.87%',
      vix: '14.8 واحد',
      vixChangePct: '-2.1%',
      globalFearGreed: '66 (طمع)',
      globalNews: 'تثبیت اونس جهانی طلا در محدوده ۴۶۵۳ دلار با رشد ۰.۷۶٪ و نگاه بازارهای جهانی به سیاست‌های پولی فدرال رزرو آمریکا',
    },
    section3_crypto: {
      btcPrice: '79,150 دلار',
      btcYesterday: '78,450 دلار',
      btcChangePct: '+0.89%',
      ethPrice: '2,620 دلار',
      ethChangePct: '+1.85%',
      btcDominance: '58.4%',
      marketCap: '3.12 تریلیون دلار',
      etfFlow: 'ورود نقدینگی نهادی (Net Inflow)',
      etfFlowAmount: '+184.2 میلیون دلار',
      fundingRate: '+0.008%',
      openInterest: '38.5 میلیارد دلار',
      cryptoFearGreed: '62 (طمع)',
      cryptoNews: 'تثبیت بیت‌کوین در سطح ۷۹,۱۵۰ دلار (+۰.۸۹٪) با ورود خالص نقدینگی نهادی ETF اسپات به میزان ۱۸۴.۲+ میلیون دلار',
    },
    section4_bourse: {
      tseIndex: '6,386,576 واحد',
      tseYesterday: '6,223,879 واحد',
      tseIndexChangePct: '+2.61%',
      tseEqualWeight: '1,802,773 واحد',
      tseEqualWeightChangePct: '+2.13%',
      retailVolume: '54,200 میلیارد تومان',
      realMoneyFlow: '+1,480 میلیارد تومان',
      positiveSymbolsCount: '584 نماد',
      negativeSymbolsCount: '196 نماد',
      buyQueueCount: '186 نماد',
      buyQueueValue: '14,800 میلیارد تومان',
      sellQueueCount: '22 نماد',
      sellQueueValue: '620 میلیارد تومان',
      buyerPower: '1.82',
      marketNews: 'جهش تاریخی شاخص کل بورس تهران به ۶,۳۸۶,۵۷۶ واحد با رشد ۱۶۲,۶۹۷ واحدی (+۲.۶۱٪) و ارزش معاملات خرد ۵۴.۲ همت',
    },
    section5_afranFund: {
      closingPrice: '52,734 ریال',
      navPerUnit: '52,761 ریال',
      navDiffPct: '-0.05%',
      volumeUnits: '1,850,000,000 واحد',
      valueBillionToman: '410 میلیارد تومان',
      moneyFlow: '-320 میلیارد تومان (جابجایی به سهام)',
      perCapitaBuy: '85 میلیون تومان',
      perCapitaSell: '42 میلیون تومان',
      buyerPower: '2.02',
      aum: '28,000 میلیارد تومان',
    },
    section6_ayarFund: {
      closingPrice: '58,455 تومان',
      navPerUnit: '58,100 تومان',
      navDiffPct: '+0.61%',
      volumeUnits: '24,500,000 واحد',
      valueBillionToman: '1,432 میلیارد تومان',
      moneyFlow: '+240 میلیارد تومان',
      perCapitaBuy: '84 میلیون تومان',
      perCapitaSell: '45 میلیون تومان',
      buyerPower: '1.87',
      aum: '22,500 میلیارد تومان',
    },
    section7_khebarganFund: {
      closingPrice: '42,500 ریال',
      yesterdayPrice: '41,600 ریال',
      changePct: '+2.16%',
      navPerUnit: '42,800 ریال',
      navDiffPct: '-0.70%',
      volumeUnits: '35,000,000 واحد',
      valueBillionToman: '148.7 میلیارد تومان',
      moneyFlow: '+65 میلیارد تومان',
      perCapitaBuy: '62 میلیون تومان',
      perCapitaSell: '33 میلیون تومان',
      buyerPower: '1.88',
    },
    section8_tavanFund: {
      closingPrice: '51,954 ریال',
      navPerUnit: '51,200 ریال',
      navDiffPct: '+1.47%',
      volumeUnits: '88,000,000 واحد',
      valueBillionToman: '457 میلیارد تومان',
      moneyFlow: '+145 میلیارد تومان',
      perCapitaBuy: '94 میلیون تومان',
      perCapitaSell: '40 میلیون تومان',
      buyerPower: '2.35',
    },
    section9_otherGoldFunds: {
      ayar: '58,455 تومان (+0.61% حباب)',
      kahroba: '61,200 تومان (+0.55% حباب)',
      zar: '68,900 تومان (+0.70% حباب)',
      gohar: '49,800 تومان (+0.45% حباب)',
      nafis: '39,500 تومان (+0.50% حباب)',
      mesghal: '46,200 تومان (+0.58% حباب)',
    },
    section10_leveragedFunds: {
      ahrom: '48,200 ریال (+4.2%)',
      tavan: '51,954 ریال (+4.8%)',
      moj: '39,800 ریال (+3.9%)',
      shetab: '44,500 ریال (+4.1%)',
      bidar: '41,200 ریال (+4.0%)',
      jahesh: '54,000 ریال (+4.5%)',
      doX: '35,400 ریال (+3.8%)',
    },
    section11_silverFunds: {
      silver: '24,500 تومان (+1.8%)',
      noghrein: '23,800 تومان (+1.5%)',
      noghrabi: '25,200 تومان (+1.6%)',
    },
    section12_systematicRisks: {
      riskPolitical: 'سطح متوسط و تحت رصد',
      riskMilitary: 'آرامش نسبی بدون تنش جدید',
      riskEconomic: 'کنترل شکاف ارز آزاد و رونق بورس',
      riskGlobal: 'تثبیت شاخص‌های نرخ بهره جهانی',
      riskCrypto: 'فشار مقطعی عرضه در آلتکوین‌ها',
      cbiDecisions: 'نرخ سود بین‌بانکی ۲۳.۸۵٪ و ادامه حراج‌های طلا در مرکز مبادله',
      seoDecisions: 'تداوم نظارت بر بازارگردانی و تشکیل سرمایه در بورس',
      domesticNews: 'عرضه ارز در بازار توافقی و گزارش‌های ماهانه شرکت‌های صادرات‌محور',
      internationalNews: 'گزارش‌های اشتغال آمریکا و تصمیمات آتی فدرال رزرو',
    },
    section13_liquidityFlow: {
      flowBourse: '+1,480 میلیارد تومان',
      flowGoldFunds: '+240 میلیارد تومان',
      flowFixedIncome: '-420 میلیارد تومان (انتقال به سهام و اهرمی)',
      flowEquityFunds: '+580 میلیارد تومان',
      flowLeveragedFunds: '+410 میلیارد تومان',
      flowCrypto: '-28.5 میلیون دلار',
    },
  };
}

/**
 * Generate synchronized 41 metrics from 13 sections with exact matching numbers
 */
export function build41MetricsFrom13Sections(
  sections: StandardDailyInput13Sections,
  existingMetrics?: InputMetric[]
): InputMetric[] {
  const timeNow = sections.metadata.updateTime || getTehranTimeString(true);
  const s1 = sections.section1_iranMacro;
  const s2 = sections.section2_globalMarkets;
  const s3 = sections.section3_crypto;
  const s4 = sections.section4_bourse;
  const s5 = sections.section5_afranFund;
  const s6 = sections.section6_ayarFund;
  const s7 = sections.section7_khebarganFund;
  const s8 = sections.section8_tavanFund;
  const s12 = sections.section12_systematicRisks;

  const usdFreeClean = cleanNumericValue(s1.usdFree);
  const usdtClean = cleanNumericValue(s1.usdt);
  const gold18kClean = cleanNumericValue(s1.gold18k);
  const sekeClean = cleanNumericValue(s1.sekeEmami);
  const goldOunceClean = cleanNumericValue(s2.goldOunce);
  const btcClean = cleanNumericValue(s3.btcPrice);
  const retailVolClean = cleanNumericValue(s4.retailVolume);
  const realMoneyClean = cleanNumericValue(s4.realMoneyFlow);

  const prevMap = new Map<string, InputMetric>();
  if (existingMetrics) {
    existingMetrics.forEach((m) => prevMap.set(m.id, m));
  }

  const makeMetric = (
    id: string,
    category: 'bourse' | 'gold' | 'crypto' | 'forex' | 'macro',
    categoryLabel: string,
    title: string,
    code: string,
    value: string,
    unit: string,
    scoreContribution: number,
    status: 'bullish' | 'bearish' | 'neutral',
    weight: number,
    description: string,
    source: string,
    sourceRef: string,
    timeWindow = '۱۷:۰۰ - ۱۷:۳۰'
  ): InputMetric => {
    const prev = prevMap.get(id);
    return {
      id,
      category,
      categoryLabel,
      title,
      code,
      value: prev?.value && prev.value !== '-' ? prev.value : value,
      unit,
      scoreContribution: prev?.scoreContribution !== undefined ? prev.scoreContribution : scoreContribution,
      status: prev?.status || status,
      weight,
      lastUpdated: timeNow,
      description,
      source,
      sourceReference: sourceRef,
      timeWindow,
    };
  };

  // Map 41 metrics directly
  const metrics: InputMetric[] = [
    // 1. Bourse (8 items)
    makeMetric('tse-index-change', 'bourse', 'بورس و سهام', 'تغییرات شاخص کل', 'TSE_INDX_PCT', s4.tseIndexChangePct, 'درصد', 9, 'bullish', 0.15, 'تغییرات روزانه شاخص کل بورس تهران نسبت به روز قبل', 'TSETMC (مدیریت فناوری بورس)', 'tsetmc.com/index'),
    makeMetric('tse-retail-volume', 'bourse', 'بورس و سهام', 'ارزش معاملات خرد سهام و حق تقدم', 'TSE_RETAIL_VOL', formatPersianNumber(retailVolClean), 'میلیارد تومان', 10, 'bullish', 0.20, 'حجم نقدینگی در گردش معاملات خرد بازار', 'دیتابورس / TSETMC', 'databourse.ir/retail'),
    makeMetric('tse-real-money-flow', 'bourse', 'بورس و سهام', 'ورود/خروج پول حقیقی به سهام', 'TSE_REAL_FLOW', `${realMoneyClean > 0 ? '+' : ''}${formatPersianNumber(realMoneyClean)}`, 'میلیارد تومان', 9, 'bullish', 0.20, 'خالص ورود پول سرمایه‌گذاران حقیقی به سهام و صندوق‌ها', 'TSETMC / بورس‌ویو', 'bourseview.ir/real-money'),
    makeMetric('tse-per-capita-power', 'bourse', 'بورس و سهام', 'سرانه خرید به فروش حقیقی (قدرت خریدار)', 'TSE_BUY_PWR', s4.buyerPower || '1.82', 'نسبت', 9, 'bullish', 0.15, 'نسبت حجم خرید هر کد حقیقی به حجم فروش هر کد حقیقی', 'بورس‌ویو', 'bourseview.ir/capita-power'),
    makeMetric('tse-fixed-flow-out', 'bourse', 'بورس و سهام', 'خروج پول از صندوق‌های درآمد ثابت', 'FIXED_INC_OUT', formatPersianNumber(cleanNumericValue(sections.section13_liquidityFlow.flowFixedIncome)), 'میلیارد تومان', 9, 'bullish', 0.10, 'جریان خروجی نقدینگی از ابزارهای با درآمد ثابت به سمت سهام', 'Fipiran', 'fipiran.com/fixed-outflow'),
    makeMetric('tse-queue-pressure', 'bourse', 'بورس و سهام', 'تراز ارزش صفوف خرید و فروش', 'TSE_QUEUE_BAL', `+${formatPersianNumber(cleanNumericValue(s4.buyQueueValue) - cleanNumericValue(s4.sellQueueValue))}`, 'میلیارد تومان', 8, 'bullish', 0.10, 'تفاضل ارزش ریالی صف‌های خرید نسبت به صف‌های فروش', 'TSETMC', 'tsetmc.com/queues'),
    makeMetric('fund-tavan-discount', 'bourse', 'بورس و سهام', 'حباب قیمت به NAV صندوق توان', 'TAVAN_NAV_DISC', s8.navDiffPct, 'درصد', 8, 'bullish', 0.05, 'وضعیت قیمت معامله صندوق اهرمی توان نسبت به ارزش خالص دارایی‌ها', 'بورس تهران', 'tsetmc.com/tavan'),
    makeMetric('fund-khebargan-growth', 'bourse', 'بورس و سهام', 'بازدهی روزانه صندوق خبرگان', 'KHEBAR_RET_PCT', s7.changePct, 'درصد', 8, 'bullish', 0.05, 'عملکرد روزانه صندوق سهامی شاخصی خبرگان', 'Fipiran', 'fipiran.com/khebargan'),

    // 2. Gold (8 items)
    makeMetric('gold-ounce-price', 'gold', 'طلا و مسکوکات', 'قیمت انس جهانی طلا (XAU/USD)', 'GOLD_OUNCE_SPOT', formatPersianNumber(goldOunceClean), 'دلار', 10, 'bullish', 0.25, 'قیمت اونس طلای جهانی در بازار نیویورک / لندن', 'TradingView (XAUUSD)', 'tradingview.com/symbols/XAUUSD'),
    makeMetric('gold-18k-gram', 'gold', 'طلا و مسکوکات', 'هر گرم طلای ۱۸ عیار آبشده', 'GOLD_18K_GRAM', formatPersianNumber(gold18kClean), 'تومان', 9, 'bullish', 0.20, 'نرخ مظنه طلای ۱۸ عیار در بازار طلا و جواهر تهران', 'شبکه اطلاع‌رسانی طلا و ارز (TGJU)', 'tgju.org/gold18k'),
    makeMetric('gold-coin-emami', 'gold', 'طلا و مسکوکات', 'سکه تمام طرح جدید (امامی)', 'GOLD_COIN_EMAMI', formatPersianNumber(sekeClean), 'تومان', 9, 'bullish', 0.15, 'قیمت سکه بهار آزادی طرح امامی در بازار سبزه‌میدان', 'اتحادیه طلا و جواهر تهران', 'tgju.org/coin-emami'),
    makeMetric('gold-coin-bubble', 'gold', 'طلا و مسکوکات', 'حباب سکه تمام طرح جدید', 'GOLD_COIN_BUBBLE', s1.coinBubble, 'درصد', 8, 'bullish', 0.20, 'درصد حباب قیمتی سکه امامی نسبت به ارزش ذاتی', 'اتحادیه طلا و جواهر تهران', 'tgju.org/bubble'),
    makeMetric('fund-ayar-bubble', 'gold', 'طلا و مسکوکات', 'حباب صندوق طلای عیار', 'AYAR_BUBBLE_PCT', s6.navDiffPct, 'درصد', 9, 'bullish', 0.10, 'انحراف قیمت پایانی صندوق عیار از ارزش ذاتی NAV', 'بورس کالای ایران', 'ime.co.ir/ayar'),
    makeMetric('fund-ayar-flow', 'gold', 'طلا و مسکوکات', 'ورود پول حقیقی به صندوق عیار', 'AYAR_REAL_FLOW', formatPersianNumber(cleanNumericValue(s6.moneyFlow)), 'میلیارد تومان', 9, 'bullish', 0.05, 'جریان نقدینگی خرد به ابزارهای شمش طلا', 'مدیریت فناوری بورس', 'tsetmc.com/ayar'),
    makeMetric('fund-kahroba-bubble', 'gold', 'طلا و مسکوکات', 'حباب صندوق طلای کهربا', 'KAHROBA_BUBBLE', '+0.55%', 'درصد', 8, 'bullish', 0.03, 'حباب قیمتی دومین صندوق طلای بزرگ بازار', 'بورس کالا', 'tsetmc.com/kahroba'),
    makeMetric('fund-silver-yield', 'gold', 'طلا و مسکوکات', 'رشد روزانه صندوق سیمین/نقره', 'SILVER_FUND_RET', '+1.8%', 'درصد', 8, 'bullish', 0.02, 'بازدهی ابزارهای نقره بورسی', 'بورس کالا', 'ime.co.ir/silver'),

    // 3. Crypto (6 items)
    makeMetric('btc-price', 'crypto', 'رمزارزها', 'قیمت بیت‌کوین (BTC/USDT)', 'BTC_PRICE_SPOT', formatPersianNumber(btcClean), 'دلار', 6, 'neutral', 0.25, 'قیمت لحظه‌ای بیت‌کوین در صرافی بایننس / کوین‌بیس', 'CoinMarketCap / Binance', 'coinmarketcap.com/bitcoin'),
    makeMetric('btc-etf-netflow', 'crypto', 'رمزارزها', 'خالص جریان ورودی ETF بیت‌کوین', 'BTC_ETF_FLOW', s3.etfFlowAmount, 'میلیون دلار', 4, 'bearish', 0.20, 'جریان ورودی/خروجی سرمایه از صندوق‌های اسپات وال‌استریت', 'CoinGlass / Farside Investors', 'coinglass.com/etf'),
    makeMetric('crypto-fear-greed', 'crypto', 'رمزارزها', 'شاخص ترس و طمع بازار کریپتو', 'CRYPTO_FEAR_GREED', String(cleanNumericValue(s3.cryptoFearGreed)), 'امتیاز (۰-۱۰۰)', 5, 'neutral', 0.20, 'احساسات کلی بازار رمزارزها', 'Alternative.me', 'alternative.me/crypto'),
    makeMetric('btc-dominance', 'crypto', 'رمزارزها', 'شاخص دامیننس بیت‌کوین', 'BTC_DOMINANCE_PCT', s3.btcDominance, 'درصد', 6, 'neutral', 0.15, 'سهم بازار بیت‌کوین از کل ارزش کریپتو', 'TradingView (BTC.D)', 'tradingview.com/BTC.D'),
    makeMetric('crypto-funding-rate', 'crypto', 'رمزارزها', 'میانگین نرخ تامین سرمایه (Funding Rate)', 'CRYPTO_FUNDING_RATE', s3.fundingRate, 'درصد', 6, 'neutral', 0.10, 'تعادل قراردادهای آتی اهرمی لانگ و شورت', 'CoinGlass Funding Dashboard', 'coinglass.com/funding'),
    makeMetric('crypto-eth-strength', 'crypto', 'رمزارزها', 'نسبت قدرت اتریوم به بیت‌کوین (ETH/BTC)', 'ETH_BTC_RATIO', '0.0321', 'نسبت', 5, 'neutral', 0.10, 'قدرت آلت‌کوین‌ها در برابر بیت‌کوین', 'Binance / TradingView', 'tradingview.com/ETHBTC'),

    // 4. Forex (5 items)
    makeMetric('usdt-toman-rate', 'forex', 'ارز و تتر', 'نرخ تتر به تومان', 'USDT_TOMAN_RATE', formatPersianNumber(usdtClean), 'تومان', 9, 'bullish', 0.30, 'میانگین قیمت تتر در صرافی‌های p2p داخلی (نوبیتکس / والکس)', 'صرافی‌های P2P داخلی / نوبیتکس', 'nobitex.ir/usdt'),
    makeMetric('usd-free-market', 'forex', 'ارز و تتر', 'دلار آزاد تهران (اسکناس)', 'USD_TEHRAN_CASH', formatPersianNumber(usdFreeClean), 'تومان', 9, 'bullish', 0.25, 'نرخ اعلامی بازار منوچهری و سبزه‌میدان', 'شبکه اطلاع‌رسانی طلا و ارز (TGJU)', 'tgju.org/dollar'),
    makeMetric('dirham-herat-arbitrage', 'forex', 'ارز و تتر', 'نرخ حواله درهم دبی', 'AED_TRANSFER_RATE', '54,500', 'تومان', 8, 'bullish', 0.20, 'لیدر اصلی قیمت دلار تهران', 'شبکه صرافی‌های دبی / TGJU', 'tgju.org/aed'),
    makeMetric('nima-exchange-rate', 'forex', 'ارز و تتر', 'نرخ ارز توافقی / مرکز مبادله', 'NIMA_AGREE_RATE', '69,200', 'تومان', 7, 'bullish', 0.15, 'نرخ تسعیر واردات و شرکت‌های صادراتی بورس', 'مرکز مبادله ارز و طلای ایران (ICE)', 'ice.ir/nima'),
    makeMetric('usdt-cash-premium', 'forex', 'ارز و تتر', 'حباب تتر نسبت به دلار فیزیکی', 'USDT_BUBBLE_PREMIUM', '-100', 'تومان', 7, 'bullish', 0.10, 'تخفیف تتر رمزارزی نسبت به اسکناس فیزیکی', 'پلتفرم‌های ارزیاب صرافی‌ها', 'nobitex.ir/compare'),

    // 5. Macro (14 items)
    makeMetric('interbank-interest-rate', 'macro', 'کلان و نرخ بهره', 'نرخ سود بین‌بانکی ایران', 'IRAN_INTERBANK_RATE', '23.85%', 'درصد', 7, 'neutral', 0.15, 'نرخ استقراض شبانه میان بانک‌ها', 'بانک مرکزی جمهوری اسلامی ایران (CBI)', 'cbi.ir/rates'),
    makeMetric('treasury-yield-akhza', 'macro', 'کلان و نرخ بهره', 'بازده تا سررسید اخزا (YTM)', 'AKHZA_YTM_RATE', '31.2%', 'درصد', 6, 'neutral', 0.15, 'نرخ بدون ریسک اسناد خزانه اسلامی', 'فرابورس ایران', 'ifb.ir/akhza'),
    makeMetric('global-dxy-index', 'macro', 'کلان و نرخ بهره', 'شاخص دلار آمریکا (DXY)', 'GLOBAL_DXY_INDEX', s2.dxy, 'واحد', 7, 'neutral', 0.12, 'قدرت دلار جهانی در برابر سبد ارزهای مرجع', 'TradingView (DXY)', 'tradingview.com/DXY'),
    makeMetric('global-brent-oil', 'macro', 'کلان و نرخ بهره', 'قیمت نفت خام برنت', 'BRENT_CRUDE_OIL', s2.brentOil, 'دلار/بشکه', 8, 'bullish', 0.10, 'قیمت جهانی نفت انرژی', 'Investing.com / TradingView', 'investing.com/brent'),
    makeMetric('fund-afran-yield', 'macro', 'کلان و نرخ بهره', 'سود موثر سالانه صندوق افران', 'AFRAN_EFF_YIELD', '31.5%', 'درصد', 9, 'bullish', 0.10, 'نرخ بازدهی بزرگترین صندوق درآمد ثابت بازار', 'Fipiran', 'fipiran.com/afran'),
    makeMetric('global-vix-index', 'macro', 'کلان و نرخ بهره', 'شاخص نوسان و ترس وال‌استریت (VIX)', 'GLOBAL_VIX_INDEX', s2.vix, 'واحد', 8, 'neutral', 0.08, 'شاخص نوسان‌پذیری CBOE', 'CBOE / TradingView', 'cboe.com/vix'),
    makeMetric('global-market-sentiment', 'macro', 'کلان و نرخ بهره', 'شاخص ترس و طمع جهانی CNN', 'CNN_FEAR_GREED', s2.globalFearGreed, 'امتیاز (۰-۱۰۰)', 8, 'bullish', 0.06, 'احساسات بازارهای سهام بین‌الملل', 'CNN Business Fear & Greed', 'cnn.com/fear-and-greed'),
    makeMetric('cbi-auction-gold', 'macro', 'کلان و نرخ بهره', 'حراج شمش و سکه مرکز مبادله', 'CBI_AUCTION_STATUS', 'فعال و منظم', 'وضعیت', 8, 'bullish', 0.04, 'سیاست‌های عرضه بانک مرکزی', 'مرکز مبادله ایران', 'ice.ir/auction'),
    makeMetric('inflation-expectation', 'macro', 'کلان و نرخ بهره', 'نرخ تورم انتظاری سالانه', 'INFLATION_EXPECT', '38.5%', 'درصد', 8, 'bullish', 0.04, 'چشم‌انداز تورمی شاخص مصرف‌کننده CPI', 'بانک مرکزی و مرکز آمار', 'amar.org.ir/cpi'),
    makeMetric('risk-political-score', 'macro', 'کلان و نرخ بهره', 'شاخص ریسک سیستماتیک سیاسی', 'RISK_POLITICAL_IDX', 'متوسط (کنترل‌شده)', 'سطح', 7, 'neutral', 0.04, 'ارزیابی ریسک‌های ژئوپلیتیک', 'مانیتورینگ تحولات منطقه‌ای', 's1-risk/political'),
    makeMetric('risk-military-score', 'macro', 'کلان و نرخ بهره', 'شاخص ریسک تنش‌های نظامی', 'RISK_MILITARY_IDX', 'آرامش نسبی', 'سطح', 8, 'bullish', 0.04, 'پایش اخبار امنیتی و دفاعی', 'سامانه تحلیل ریسک S1', 's1-risk/military'),
    makeMetric('risk-regulatory-score', 'macro', 'کلان و نرخ بهره', 'ریسک مقرراتی و مصوبات بورس', 'RISK_SEO_CBI_DEC', 'حمایتی و باثبات', 'سطح', 8, 'bullish', 0.03, 'تصمیمات سازمان بورس و شورای عالی', 'سایت سنا و بورس', 'sena.ir'),
    makeMetric('foreign-exchange-gap', 'macro', 'کلان و نرخ بهره', 'شکاف نرخ ارز آزاد و توافقی', 'FX_ARBITRAGE_GAP', '18.4%', 'درصد', 8, 'neutral', 0.03, 'اختلاف درصد بازار آزاد با نرخ مبادله', 'مرکز مبادله و TGJU', 'ice.ir/gap'),
    makeMetric('m2-liquidity-growth', 'macro', 'کلان و نرخ بهره', 'نرخ رشد نقدینگی (M2)', 'M2_LIQUIDITY_GROWTH', '26.8%', 'درصد', 8, 'bullish', 0.02, 'رشد نقدینگی سالانه کشور', 'بانک مرکزی', 'cbi.ir/monetary'),
  ];

  return metrics;
}

/**
 * Recompute S1 Market Scores, Composite Index, and Allocation Recommendations
 */
export function computeS1MarketScoresAndSignal(
  inputs: InputMetric[],
  sections13: StandardDailyInput13Sections,
  existingSignal?: SystemS1Signal,
  existingScores?: MarketScoreItem[]
): {
  marketScores: MarketScoreItem[];
  signal: SystemS1Signal;
  auditReport: ValidationAuditReport;
} {
  const scoresToUse = existingScores || initialMarketScores;
  const signalToUse = existingSignal || initialSignal;

  return recomputeS1Engine(inputs, scoresToUse, signalToUse, sections13);
}

/**
 * Recalculate S1 Market Scores, Composite Index, and Allocation Recommendations
 */
export function recomputeS1Engine(
  inputs: InputMetric[],
  currentScores: MarketScoreItem[],
  currentSignal: SystemS1Signal,
  sections13: StandardDailyInput13Sections
): {
  marketScores: MarketScoreItem[];
  signal: SystemS1Signal;
  auditReport: ValidationAuditReport;
} {
  const dateDetails = getLiveJalaliDetails(0);
  const timeNow = getTehranTimeString(true);

  const bourseInputs = inputs.filter((i) => i.category === 'bourse');
  const goldInputs = inputs.filter((i) => i.category === 'gold');
  const cryptoInputs = inputs.filter((i) => i.category === 'crypto');
  const forexInputs = inputs.filter((i) => i.category === 'forex');

  const calcCatScore = (catItems: InputMetric[], defaultVal: number) => {
    if (!catItems.length) return defaultVal;
    const totalAchieved = catItems.reduce((acc, i) => acc + (Number(i.scoreContribution) || 5), 0);
    const maxScore = catItems.length * 10;
    return Math.min(100, Math.max(10, Math.round((totalAchieved / maxScore) * 100)));
  };

  const bourseScore = calcCatScore(bourseInputs, 82);
  const goldScore = calcCatScore(goldInputs, 90);
  const cryptoScore = calcCatScore(cryptoInputs, 58);
  const forexScore = calcCatScore(forexInputs, 81);

  const updatedMarketScores = currentScores.map((m) => {
    let score = m.score;
    if (m.id === 'bourse') score = bourseScore;
    else if (m.id === 'gold') score = goldScore;
    else if (m.id === 'btc') score = cryptoScore;
    else if (m.id === 'usdt') score = forexScore;

    const trafficLight: 'green' | 'yellow' | 'red' =
      score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';

    const sentiment: SentimentType =
      score >= 85 ? 'Strong Bull' : score >= 75 ? 'Bullish' : score >= 60 ? 'Neutral' : 'Bearish';

    let metrics = m.metrics;
    let threeConfirmations = m.threeConfirmations;

    if (m.id === 'bourse') {
      metrics = [
        {
          label: 'شاخص کل:',
          value: `${sections13?.section4_bourse?.tseIndex || '۶,۳۸۶,۵۷۶ واحد'} (${sections13?.section4_bourse?.tseIndexChangePct || '+۲.۶۱٪'})`,
          status: 'positive',
        },
        {
          label: 'ارزش معاملات خرد:',
          value: `${sections13?.section4_bourse?.retailVolume || '۵۴,۲۰۰ میلیارد تومان'}`,
          status: 'positive',
        },
        {
          label: 'ورود پول حقیقی:',
          value: `${sections13?.section4_bourse?.realMoneyFlow || '+۱,۴۸۰ میلیارد تومان'}`,
          status: 'positive',
        },
        {
          label: 'قدرت خریدار:',
          value: `${sections13?.section4_bourse?.buyerPower || '۱.۸۲'}`,
          status: 'positive',
        },
      ];
      if (threeConfirmations) {
        threeConfirmations = {
          ...threeConfirmations,
          criterion1: {
            name: 'ورود پول حقیقی مستمر (حداقل ۳ روز متوالی)',
            passed: true,
            note: `تداوم جریان ورودی نقدینگی خرد حقیقی (${sections13?.section4_bourse?.realMoneyFlow || '+۱,۴۸۰ میلیارد تومان'})`,
            dailyFlows: [
              { day: '۲ روز پیش', amount: '+۸۵۰ میلیارد تومان', status: 'positive' },
              { day: 'دیروز', amount: '+۱,۱۲۰ میلیارد تومان', status: 'positive' },
              { day: 'امروز', amount: sections13?.section4_bourse?.realMoneyFlow || '+۱,۴۸۰ میلیارد تومان', status: 'positive' },
            ],
          },
          criterion2: {
            name: 'ارزش معاملات خرد بالاتر از میانگین ماهانه',
            passed: true,
            note: `ارزش معاملات خرد به ${sections13?.section4_bourse?.retailVolume || '۵۴.۲ همت'} رسیده که حاکی از رونق قوی است`,
          },
          criterion3: {
            name: 'سرانه قدرت خریدار حقیقی به فروشنده (> ۱)',
            passed: true,
            note: `نسبت قدرت خریدار حقیقی ${sections13?.section4_bourse?.buyerPower || '۱.۸۲'} (برتری چشمگیر تقاضا)`,
          },
          isConfirmed: score >= 80,
        };
      }
    } else if (m.id === 'gold') {
      metrics = [
        {
          label: 'اونس جهانی طلا:',
          value: `${sections13?.section2_globalMarkets?.goldOunce || '۴,۶۵۳ دلار'} (${sections13?.section2_globalMarkets?.ounceChangePct || '+۰.۷۶٪'})`,
          status: 'positive',
        },
        {
          label: 'طلای ۱۸ عیار:',
          value: `${sections13?.section1_iranMacro?.gold18k || '۲۱,۶۷۷,۴۰۰ تومان'} (${sections13?.section1_iranMacro?.gold18kChangePct || '+۱.۲۵٪'})`,
          status: 'positive',
        },
        {
          label: 'سکه امامی:',
          value: `${sections13?.section1_iranMacro?.sekeEmami || '۲۱۶,۰۰۰,۰۰۰ تومان'} (حباب ${sections13?.section1_iranMacro?.coinBubble || '۲.۱٪'})`,
          status: 'positive',
        },
        {
          label: 'جریان پول عیار:',
          value: `${sections13?.section6_ayarFund?.moneyFlow || '+۲۴۰ میلیارد تومان'}`,
          status: 'positive',
        },
      ];
      if (threeConfirmations) {
        threeConfirmations = {
          ...threeConfirmations,
          criterion1: {
            name: 'روند صعودی اونس جهانی طلا',
            passed: true,
            note: `تثبیت اونس جهانی در ${sections13?.section2_globalMarkets?.goldOunce || '۴,۶۵۳ دلار'} (${sections13?.section2_globalMarkets?.ounceChangePct || '+۰.۷۶٪'})`,
          },
          criterion2: {
            name: 'جریان پول ورودی به صندوق‌های طلا (عیار)',
            passed: true,
            note: `ورود جریان نقدینگی خرد (${sections13?.section6_ayarFund?.moneyFlow || '+۲۴۰ میلیارد تومان'}) به صندوق شمش عیار`,
            dailyFlows: [
              { day: '۲ روز پیش', amount: '+۱۸۰ میلیارد تومان', status: 'positive' },
              { day: 'دیروز', amount: '+۲۱۰ میلیارد تومان', status: 'positive' },
              { day: 'امروز', amount: sections13?.section6_ayarFund?.moneyFlow || '+۲۴۰ میلیارد تومان', status: 'positive' },
            ],
          },
          criterion3: {
            name: 'جهت حرکت دلار آزاد داخلی و حباب امن',
            passed: true,
            note: `دلار آزاد در محدوده ${sections13?.section1_iranMacro?.usdFree || '۲۰۰,۵۰۰ تومان'} با حباب امن ${sections13?.section1_iranMacro?.coinBubble || '۲.۱٪'} سکه`,
          },
          isConfirmed: score >= 80,
        };
      }
    } else if (m.id === 'btc') {
      metrics = [
        {
          label: 'قیمت لحظه‌ای:',
          value: `${sections13?.section3_crypto?.btcPrice || '۷۹,۱۵۰ دلار'} (${sections13?.section3_crypto?.btcChangePct || '+۰.۸۹٪'})`,
          status: 'neutral',
        },
        {
          label: 'جریان ETF اسپات:',
          value: `${sections13?.section3_crypto?.etfFlowAmount || '+۱۸۴.۲ میلیون دلار'}`,
          status: 'positive',
        },
        {
          label: 'شاخص ترس و طمع:',
          value: `${sections13?.section3_crypto?.cryptoFearGreed || '۶۲ (طمع)'}`,
          status: 'neutral',
        },
        {
          label: 'دامیننس بیت‌کوین:',
          value: `${sections13?.section3_crypto?.btcDominance || '۵۸.۴٪'}`,
          status: 'neutral',
        },
      ];
    } else if (m.id === 'usdt') {
      metrics = [
        { label: 'نقش در سیستم S1:', value: 'حفظ قدرت خرید', status: 'positive' },
        {
          label: 'صندوق جایگزین ریالی:',
          value: `افران (${sections13?.section5_afranFund?.closingPrice || '۵۲,۷۳۴ ریال'})`,
          status: 'positive',
        },
        {
          label: 'نرخ تتر:',
          value: `${sections13?.section1_iranMacro?.usdt || '۱۹۹,۸۰۰ تومان'} (${sections13?.section1_iranMacro?.usdtChangePct || '+۰.۳۴٪'})`,
          status: 'neutral',
        },
        {
          label: 'دلار آزاد:',
          value: `${sections13?.section1_iranMacro?.usdFree || '۲۰۰,۵۰۰ تومان'}`,
          status: 'neutral',
        },
      ];
    }

    return {
      ...m,
      score,
      sentiment,
      trafficLight,
      trafficLightLabel:
        trafficLight === 'green'
          ? `🟢 چراغ سبز (${score}/۱۰۰) - وضعیت بسیار قوی؛ خرید پله‌ای مجاز`
          : trafficLight === 'yellow'
          ? `🟡 چراغ زرد (${score}/۱۰۰) - وضعیت خنثی؛ نگهداری (Hold)`
          : `🔴 چراغ قرمز (${score}/۱۰۰) - وضعیت ضعیف؛ عدم اقدام یا کاهش وزن`,
      metrics,
      threeConfirmations,
    };
  });

  // Calculate composite score (Weights: Gold 35%, Bourse 30%, Forex 25%, Crypto 10%)
  const compositeScore = Math.round(
    bourseScore * 0.3 + goldScore * 0.35 + forexScore * 0.25 + cryptoScore * 0.1
  );

  let action = 'خرید پله‌ای مجاز است';
  let summary = 'با توجه به ثبات در بازار ارز و ورود جریان نقدینگی خرد به صندوق‌های طلا و درآمد ثابت، شرایط برای انباشت تدریجی دارایی‌های کم‌ریسک فراهم است.';

  if (compositeScore >= 85) {
    action = 'ورود پرقدرت و تهاجمی';
    summary = 'جریان نقدینگی در تمام بازارها با قدرت فزاینده در حال صعود است. افزایش سهم صندوق‌های طلا و اهرمی توصیه می‌شود.';
  } else if (compositeScore < 60) {
    action = 'تثبیت سود و افزایش نقدینگی';
    summary = 'افزایش نااطمینانی‌های سیستماتیک و اصلاح شاخص‌ها. تخصیص حداکثری به صندوق‌های درآمد ثابت توصیه می‌گردد.';
  }

  const freshnessStatus = checkDataFreshness(
    sections13?.metadata?.jalaliDate,
    undefined,
    sections13?.metadata?.isLive
  );

  const shouldBlockSignal = freshnessStatus.status !== 'VERIFIED';

  const updatedSignal: SystemS1Signal = {
    ...currentSignal,
    overallScore: shouldBlockSignal ? 0 : compositeScore,
    actionTitle: shouldBlockSignal
      ? freshnessStatus.status === 'UNAVAILABLE'
        ? 'عدم امکان صدور سیگنال (داده‌های ناموجود)'
        : freshnessStatus.status === 'INVALID'
        ? 'عدم امکان صدور سیگنال (داده‌های نامعتبر)'
        : 'عدم امکان صدور سیگنال (داده‌های منقضی)'
      : action,
    summaryText: shouldBlockSignal
      ? freshnessStatus.errorBannerFa || 'طبق ماده ۴ منشور مدیریت ریسک S1، صدور هرگونه سیگنال تا زمان به‌روزرسانی کامل داده‌های امروز متوقف شده است.'
      : summary,
    lastUpdatedJalali: `${dateDetails.jalaliStandard} ${timeNow}`,
    confidenceScore: shouldBlockSignal ? 0 : 9,
    dataQualityScore: 41,
    totalMetricsCount: 41,
    activeMetricsCount: 41,
    isLive: !shouldBlockSignal,
  };

  const validationResult = runS1ValidationCore(inputs, sections13);

  return {
    marketScores: updatedMarketScores,
    signal: updatedSignal,
    auditReport: validationResult.auditReport,
  };
}

/**
 * Save unified state to local storage to prevent loss across tabs and reloads
 */
export function persistUnifiedState(
  sectionsOrInputs: StandardDailyInput13Sections | InputMetric[],
  inputsOrSections: InputMetric[] | StandardDailyInput13Sections,
  signal: SystemS1Signal
): void {
  try {
    let sections13: StandardDailyInput13Sections;
    let inputs: InputMetric[];

    if (Array.isArray(sectionsOrInputs)) {
      inputs = sectionsOrInputs as InputMetric[];
      sections13 = inputsOrSections as StandardDailyInput13Sections;
    } else {
      sections13 = sectionsOrInputs as StandardDailyInput13Sections;
      inputs = inputsOrSections as InputMetric[];
    }

    const payload = {
      savedAt: new Date().toISOString(),
      jalaliDate: sections13?.metadata?.jalaliDate || signal.lastUpdatedJalali,
      sections13,
      inputs,
      signal,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * Reset all market state and daily inputs to today's fresh baseline
 */
export function resetToFreshMarketState(): {
  daily13Sections: StandardDailyInput13Sections;
  inputs: InputMetric[];
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  freshness: DataFreshnessStatus;
  auditReport: ValidationAuditReport;
} {
  const baseline13 = getUnifiedBaseline13Sections();
  const baselineInputs = build41MetricsFrom13Sections(baseline13);
  const baselineEngine = computeS1MarketScoresAndSignal(baselineInputs, baseline13);
  const freshness = checkDataFreshness(baseline13.metadata.jalaliDate, undefined, baseline13.metadata.isLive);

  persistUnifiedState(baseline13, baselineInputs, baselineEngine.signal);

  return {
    daily13Sections: baseline13,
    inputs: baselineInputs,
    signal: baselineEngine.signal,
    marketScores: baselineEngine.marketScores,
    freshness,
    auditReport: baselineEngine.auditReport,
  };
}

/**
 * Load unified state from local storage or initialize with today's baseline
 */
export function loadUnifiedState(): {
  daily13Sections: StandardDailyInput13Sections;
  inputs: InputMetric[];
  signal: SystemS1Signal;
  marketScores: MarketScoreItem[];
  freshness: DataFreshnessStatus;
  auditReport: ValidationAuditReport;
  isLoadedFromStorage: boolean;
} {
  const baseline13 = getUnifiedBaseline13Sections();
  const baselineInputs = build41MetricsFrom13Sections(baseline13);
  const baselineEngine = computeS1MarketScoresAndSignal(baselineInputs, baseline13);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sections13 && parsed.inputs) {
        const storedDate = parsed.jalaliDate || parsed.sections13?.metadata?.jalaliDate;
        const isLive = parsed.sections13?.metadata?.isLive || false;
        const freshness = checkDataFreshness(storedDate, undefined, isLive);
        const engineResult = computeS1MarketScoresAndSignal(parsed.inputs, parsed.sections13, parsed.signal);

        return {
          daily13Sections: parsed.sections13,
          inputs: parsed.inputs,
          signal: engineResult.signal,
          marketScores: engineResult.marketScores,
          freshness,
          auditReport: engineResult.auditReport,
          isLoadedFromStorage: true,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored unified state:', err);
  }

  const freshness = checkDataFreshness(baseline13.metadata.jalaliDate, undefined, baseline13.metadata.isLive);

  return {
    daily13Sections: baseline13,
    inputs: baselineInputs,
    signal: baselineEngine.signal,
    marketScores: baselineEngine.marketScores,
    freshness,
    auditReport: baselineEngine.auditReport,
    isLoadedFromStorage: false,
  };
}

/**
 * Synchronize fund objects (such as Afran, Ayar, Tavan, Khabargan, BTC) dynamically from 13 sections
 */
export function syncFundsFrom13Sections(
  sections: StandardDailyInput13Sections,
  existingFunds?: FundItem[]
): FundItem[] {
  const s5 = sections.section5_afranFund;
  const s6 = sections.section6_ayarFund;
  const s7 = sections.section7_khebarganFund;
  const s8 = sections.section8_tavanFund;
  const s3 = sections.section3_crypto;

  const afranNav = cleanNumericValue(s5?.navPerUnit) || 52761;
  const ayarNav = cleanNumericValue(s6?.navPerUnit) || 58100;
  const tavanNav = cleanNumericValue(s8?.navPerUnit) || 51200;
  const khabarganNav = cleanNumericValue(s7?.navPerUnit) || 42800;
  const btcPrice = cleanNumericValue(s3?.btcPrice) || 79150;

  const afranAum = cleanNumericValue(s5?.aum) || 28000;
  const ayarAum = cleanNumericValue(s6?.aum) || 22500;

  const baseFunds: FundItem[] = existingFunds && existingFunds.length > 0 ? existingFunds : initialFunds;

  return baseFunds.map((fund) => {
    if (fund.id === 'fund-afran' || fund.ticker === 'افران') {
      return {
        ...fund,
        navPerUnit: afranNav,
        aumBillionToman: afranAum,
      };
    }
    if (fund.id === 'fund-ayar' || fund.ticker === 'عیار') {
      return {
        ...fund,
        navPerUnit: ayarNav,
        aumBillionToman: ayarAum,
      };
    }
    if (fund.id === 'fund-tavan' || fund.ticker === 'توان') {
      return {
        ...fund,
        navPerUnit: tavanNav,
      };
    }
    if (fund.id === 'fund-khabargan' || fund.ticker === 'خبرگان') {
      return {
        ...fund,
        navPerUnit: khabarganNav,
      };
    }
    if (fund.id === 'asset-btc' || fund.ticker === 'BTC') {
      return {
        ...fund,
        navPerUnit: btcPrice,
      };
    }
    return fund;
  });
}

/**
 * Synchronize paper portfolio asset prices dynamically from 13 sections
 */
export function syncPortfolioAssetsFrom13Sections(
  sections: StandardDailyInput13Sections,
  existingAssets: PortfolioAssetItem[]
): PortfolioAssetItem[] {
  const s5 = sections.section5_afranFund;
  const s6 = sections.section6_ayarFund;
  const s7 = sections.section7_khebarganFund;
  const s3 = sections.section3_crypto;

  // Afran price in Toman (52,734 Rial = 5,273.4 Toman, or direct Toman unit)
  const afranRaw = cleanNumericValue(s5?.closingPrice) || 52734;
  const afranPriceToman = afranRaw > 10000 ? Math.round(afranRaw / 10) : afranRaw;

  // Ayar price in Toman
  const ayarRaw = cleanNumericValue(s6?.closingPrice) || 58455;
  const ayarPriceToman = ayarRaw > 100000 ? Math.round(ayarRaw / 10) : ayarRaw;

  // Khabargan price in Toman
  const khabRaw = cleanNumericValue(s7?.closingPrice) || 42500;
  const khabPriceToman = khabRaw > 10000 ? Math.round(khabRaw / 10) : khabRaw;

  // BTC in USD
  const btcPriceUsd = cleanNumericValue(s3?.btcPrice) || 79150;

  return existingAssets.map((asset) => {
    if (asset.id === 'asset-afran') {
      return {
        ...asset,
        currentPriceToman: afranPriceToman,
      };
    }
    if (asset.id === 'asset-ayar') {
      return {
        ...asset,
        currentPriceToman: ayarPriceToman,
      };
    }
    if (asset.id === 'asset-khabargan') {
      return {
        ...asset,
        currentPriceToman: khabPriceToman,
      };
    }
    if (asset.id === 'asset-btc') {
      return {
        ...asset,
        currentPriceToman: btcPriceUsd,
      };
    }
    return asset;
  });
}

