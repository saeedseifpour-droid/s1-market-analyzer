import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Server-side Live Market Data search & extraction endpoint using Gemini + Google Search
  app.post('/api/live-market-data', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          fallbackReason: 'NO_API_KEY',
          message: 'GEMINI_API_KEY is not defined in environment. Using calibrated S1 validation core.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const todayJalali = req.body?.todayJalali || '1405/05/31';
      const todayVerbose = req.body?.todayVerbose || 'شنبه ۳۱ مرداد ۱۴۰۵';
      const miladiDate = req.body?.miladiDate || '2026/08/22';

      const prompt = `شما موتور جستجو و استخراج زنده داده‌های مالی برای سیستم مدیریت سرمایه و ریسک S1 (نسخه ۱.۳) هستید.
امروز: ${todayVerbose} مصادف با ${miladiDate} (ساعت پایش: ۱۷:۰۰ الی ۱۸:۰۰ عصر).

لطفاً با استفاده از ابزار Google Search، به‌روزترین و دقیق‌ترین قیمت‌های پایانی و آمار معاملاتی امروز (${todayVerbose}) را از مراجع رسمی زیر جستجو و استخراج کنید:
۱. بازار طلا و ارز (شبکه طلا و ارز tgju.org، اتحادیه طلا و صرافی‌های مجاز)
۲. بورس اوراق بهادار تهران (tsetmc.com، دیتابورس و Fipiran)
۳. صندوق‌های سرمایه‌گذاری (بورس کالا و فیپ‌ایران: عیار، افران، توان، خبرگان، کهربا، اهرم، سیلور)
۴. بازارهای جهانی و رمزارزها (TradingView، انس جهانی طلا، نفت برنت، شاخص DXY، قیمت لحظه‌ای BTC، اتریوم، ETF flow بیت‌کوین و شاخص ترس و طمع Alternative.me)
۵. اقتصاد کلان و بانک مرکزی (نرخ سود بین‌بانکی cbi.ir)

خروجی را صرفاً در قالب یک شیء JSON با ساختار زیر بازگردانید (بدون توضیحات اضافی خارج از JSON):
{
  "usdFreeToman": "نرخ اسکناس دلار آزاد تهران (مثلاً 94,500)",
  "usdYesterday": "نرخ دیروز دلار آزاد",
  "usdChangePct": "درصد تغییر روزانه دلار (مثلاً +0.42%)",
  "usdtToman": "نرخ تتر به تومان در صرافی‌ها (مثلاً 94,800)",
  "usdtYesterday": "نرخ دیروز تتر",
  "usdtChangePct": "درصد تغییر تتر (مثلاً +0.63%)",
  "goldOunceUsd": "قیمت انس جهانی طلا به دلار (مثلاً 2,925)",
  "ounceYesterday": "انس دیروز",
  "ounceChangePct": "درصد تغییر انس طلا (مثلاً +0.51%)",
  "gold18kGramToman": "قیمت هر گرم طلای ۱۸ عیار به تومان (مثلاً 8,450,000)",
  "gold18kYesterday": "طلای دیروز",
  "gold18kChangePct": "درصد تغییر طلای ۱۸ عیار (مثلاً +0.83%)",
  "goldCoinEmamiToman": "قیمت سکه تمام طرح جدید امامی به تومان (مثلاً 95,200,000)",
  "sekeYesterday": "سکه دیروز",
  "sekeChangePct": "درصد تغییر سکه امامی (مثلاً +0.95%)",
  "coinBubblePct": "درصد حباب سکه امامی (مثلاً 21.5%)",
  "btcPriceUsd": "قیمت بیت‌کوین به دلار (مثلاً 96,400)",
  "btcYesterday": "قیمت دیروز بیت‌کوین",
  "btcChangePct": "درصد تغییر بیت‌کوین (مثلاً -0.82%)",
  "ethPriceUsd": "قیمت اتریوم به دلار",
  "ethChangePct": "درصد تغییر اتریوم",
  "btcDominance": "دامیننس بیت‌کوین (مثلاً 58.4%)",
  "cryptoTotalMarketcap": "ارزش کل بازار کریپتو",
  "btcEtfNetflow": "خالص جریان ETF بیت‌کوین (میلیون دلار)",
  "cryptoFearGreed": "شاخص ترس و طمع کریپتو بین 0 تا 100",
  "dxyIndex": "شاخص دلار آمریکا DXY (مثلاً 104.2)",
  "dxyChangePct": "درصد تغییر DXY",
  "brentOil": "قیمت نفت برنت به دلار",
  "vixIndex": "شاخص VIX",
  "globalFearGreed": "شاخص ترس و طمع بازار جهانی",
  "tseIndex": "شاخص کل بورس تهران به واحد (مثلاً 2,845,200)",
  "tseYesterday": "شاخص کل دیروز",
  "tseIndexChangePct": "درصد تغییر شاخص کل (مثلاً +1.45%)",
  "tseEqualWeight": "شاخص هم‌وزن به واحد",
  "tseEqualWeightChangePct": "درصد تغییر شاخص هم‌وزن",
  "tseRetailVolumeBillionToman": "ارزش معاملات خرد سهام به میلیارد تومان یا همت (مثلاً 9,450)",
  "tseRealMoneyFlowBillionToman": "خالص ورود/خروج پول حقیقی به سهام به میلیارد تومان (مثلاً +1,420)",
  "interbankRatePct": "نرخ سود بین‌بانکی (مثلاً 23.85%)",
  "positiveSymbolsCount": "تعداد نمادهای مثبت بورس",
  "negativeSymbolsCount": "تعداد نمادهای منفی بورس",
  "buyQueueValue": "ارزش صفوف خرید (میلیارد تومان)",
  "sellQueueValue": "ارزش صفوف فروش (میلیارد تومان)",
  "marketSummaryFa": "خلاصه دو جمله‌ای تحلیلی وضعیت روز بازارها"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.1,
        },
      });

      const responseText = response.text || '';
      let parsedData: Record<string, any> = {};

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.error('Failed to parse Gemini JSON output:', parseErr);
        }
      }

      res.json({
        success: true,
        data: parsedData,
        rawText: responseText,
        groundedDate: todayVerbose,
      });
    } catch (error: any) {
      console.error('Error in /api/live-market-data:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Server error while fetching live market data',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`System S1 Server running on port ${PORT}`);
  });
}

startServer();
