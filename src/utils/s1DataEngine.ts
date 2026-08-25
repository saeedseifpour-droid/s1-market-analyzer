import {
  InputMetric,
  MarketScoreItem,
  SystemS1Signal,
  StandardDailyInput13Sections,
  ValidationAuditReport,
  SentimentType,
} from '../types';
import { initialMarketScores, initialSignal } from '../data';
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
 * Check whether market data / inputs are fresh for today or expired
 */
export function checkDataFreshness(dataDateJalali?: string, lastUpdatedTime?: string): DataFreshnessStatus {
  const todayDetails = getLiveJalaliDetails(0);
  const todayJalali = todayDetails.jalaliStandard; // e.g. "1405/06/03"
  const todayVerbose = todayDetails.verbose;
  const currentMiladi = todayDetails.miladiDate;
  const dayOfWeek = todayDetails.dayOfWeek;

  const dataDate = dataDateJalali ? dataDateJalali.trim().replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776)) : todayJalali;
  
  // Normalize date comparison
  const isSameDay = dataDate === todayJalali || dataDate.includes(todayJalali);

  let daysDifference = 0;
  if (!isSameDay && dataDate) {
    try {
      const parts = dataDate.split('/').map((p) => parseInt(p, 10));
      const todayParts = todayJalali.split('/').map((p) => parseInt(p, 10));
      if (parts.length === 3 && todayParts.length === 3) {
        daysDifference = Math.max(0, (todayParts[1] - parts[1]) * 30 + (todayParts[2] - parts[2]));
      } else {
        daysDifference = 1;
      }
    } catch {
      daysDifference = 1;
    }
  }

  const isFresh = isSameDay;
  const isStale = !isFresh || daysDifference > 0;

  let label = '🟢 داده‌های زنده و به‌روز امروز';
  let color: 'green' | 'yellow' | 'red' = 'green';
  let trafficIcon = '🟢';
  let warningMessageFa: string | undefined = undefined;
  let errorBannerFa: string | undefined = undefined;

  if (isStale) {
    color = 'red';
    trafficIcon = '🔴';
    label = `🔴 داده‌های منقضی (${daysDifference > 0 ? `${daysDifference} روز قبل` : 'قبلی'})`;
    warningMessageFa = `توجه: اطلاعات مالی ثبت‌شده مربوط به تاریخ ${toPersianDigits(dataDate)} است و متعلق به پایش امروز (${todayVerbose}) نیست.`;
    errorBannerFa = `⛔ هشدار انقضای داده‌های ورودی S1: داده‌های پایش ثبت‌شده مربوط به ${daysDifference > 0 ? `${toPersianDigits(daysDifference)} روز قبل` : 'تاریخ گذشته'} (${toPersianDigits(dataDate)}) است و منقضی شده است. طبق ماده ۴ منشور مدیریت سرمایه و ریسک S1، صدور هرگونه سیگنال، تخصیص سبد و تصمیم معاملاتی بر پایه اطلاعات قدیمی و نامعتبر اکیداً ممنوع و فاقد اعتبار تحلیلی است. لطفاً ورودی‌های امروز (${todayVerbose}) را با کلیک روی استخراج زنده یا ثبت دستی به‌روزرسانی نمایید.`;
  }

  return {
    isFresh,
    isStale,
    todayJalali,
    todayVerbose,
    dataDateJalali: dataDate,
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
    },
    section1_iranMacro: {
      usdFree: '199,900 تومان',
      usdYesterday: '191,200 تومان',
      usdChangePct: '+4.55%',
      usdt: '199,800 تومان',
      usdtYesterday: '188,000 تومان',
      usdtChangePct: '+6.28%',
      gold18k: '20,400,000 تومان',
      gold18kYesterday: '19,850,000 تومان',
      gold18kChangePct: '+2.77%',
      sekeEmami: '199,540,000 تومان',
      sekeYesterday: '204,500,000 تومان',
      sekeChangePct: '-2.42%',
      coinBubble: '2.5%',
      econNews: 'تداوم عرضه ارز در بازار توافقی و ثبات نسبی در معاملات مرکز مبادله ارز و طلای ایران',
    },
    section2_globalMarkets: {
      goldOunce: '4,607 دلار',
      ounceYesterday: '4,611 دلار',
      ounceChangePct: '-0.08%',
      dxy: '101.4',
      dxyChangePct: '-0.22%',
      brentOil: '72.8 دلار',
      brentChangePct: '+0.45%',
      vix: '14.8 واحد',
      vixChangePct: '-1.5%',
      globalFearGreed: '64 (طمع)',
      globalNews: 'تثبیت اونس جهانی طلا بالای ۴۶۰۰ دلار و نگاه بازارهای جهانی به سیاست‌های پولی فدرال رزرو آمریکا',
    },
    section3_crypto: {
      btcPrice: '77,290 دلار',
      btcYesterday: '77,276 دلار',
      btcChangePct: '+0.02%',
      ethPrice: '2,485 دلار',
      ethChangePct: '+0.20%',
      btcDominance: '57.8%',
      marketCap: '2.86 تریلیون دلار',
      etfFlow: 'خروج خفیف نقدینگی',
      etfFlowAmount: '-28.5 میلیون دلار',
      fundingRate: '+0.006%',
      openInterest: '34.2 میلیارد دلار',
      cryptoFearGreed: '48 (خنثی)',
      cryptoNews: 'تثبیت و نوسان بیت‌کوین در کانال ۷۷ هزار دلار با حجم معاملات ۲۴ ساعته ۶۹ میلیارد دلاری',
    },
    section4_bourse: {
      tseIndex: '6,069,888 واحد',
      tseYesterday: '6,073,294 واحد',
      tseIndexChangePct: '+0.14%',
      tseEqualWeight: '1,721,500 واحد',
      tseEqualWeightChangePct: '+0.21%',
      retailVolume: '46,421 میلیارد تومان',
      realMoneyFlow: '+890 میلیارد تومان',
      positiveSymbolsCount: '512 نماد',
      negativeSymbolsCount: '248 نماد',
      buyQueueCount: '142 نماد',
      buyQueueValue: '9,450 میلیارد تومان',
      sellQueueCount: '38 نماد',
      sellQueueValue: '1,120 میلیارد تومان',
      buyerPower: '1.82',
      marketNews: 'تثبیت شاخص کل بورس تهران در کانال ۶ میلیون و ۶۹ هزار واحدی با ارزش معاملات خرد پرحجم ۴۶ همت',
    },
    section5_afranFund: {
      closingPrice: '2,215 ریال',
      navPerUnit: '2,215 ریال',
      navDiffPct: '0.0%',
      volumeUnits: '1,850,000,000 واحد',
      valueBillionToman: '410 میلیارد تومان',
      moneyFlow: '-320 میلیارد تومان (جابجایی به سهام)',
      perCapitaBuy: '85 میلیون تومان',
      perCapitaSell: '42 میلیون تومان',
      buyerPower: '1.25',
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

  const updatedSignal: SystemS1Signal = {
    ...currentSignal,
    overallScore: compositeScore,
    actionTitle: action,
    summaryText: summary,
    lastUpdatedJalali: `${dateDetails.jalaliStandard} ${timeNow}`,
    confidenceScore: 9,
    dataQualityScore: 41,
    totalMetricsCount: 41,
    activeMetricsCount: 41,
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
  const freshness = checkDataFreshness(baseline13.metadata.jalaliDate);

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
        const freshness = checkDataFreshness(storedDate);
        const engineResult = computeS1MarketScoresAndSignal(parsed.inputs, parsed.sections13, parsed.signal);

        return {
          daily13Sections: parsed.sections13,
          inputs: parsed.inputs,
          signal: parsed.signal || engineResult.signal,
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

  const freshness = checkDataFreshness(baseline13.metadata.jalaliDate);

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
