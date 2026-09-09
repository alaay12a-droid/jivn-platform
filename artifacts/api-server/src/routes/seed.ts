import { db } from "@workspace/db";
import {
  contactSettingsTable,
  featureTable,
  marketingOrderCounterTable,
  notificationTable,
  pricingPlansTable,
  restaurantLogosTable,
  siteContentTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

let seeded = false;
let seedPromise: Promise<void> | null = null;

async function seedDefaults() {
  if (seeded) return;
  const [content] = await db.select({ id: siteContentTable.id }).from(siteContentTable).limit(1);
  if (!content) {
    await db.insert(siteContentTable).values({
      heroTitle: "تطبيق مطعمك… الآن على جوال عملائك",
      heroDescription: "نصمم ونطور لك تطبيق مطعم احترافي بجودة عالية، يحمل اسم وهُوية مطعمك، ويكون جاهزًا للنشر على App Store وGoogle Play.",
      primaryCta: "ابدأ تطبيق مطعمك",
      secondaryCta: "شاهد أعمالنا",
      featuresTitle: "كل ما يحتاجه مطعمك في تطبيق واحد",
      howTitle: "كيف نطلق تطبيق مطعمك؟",
      workTitle: "مطاعم وثقت بنا",
      pricingTitle: "باقات مصممة لنمو مطعمك",
      whyTitle: "لماذا تختار چڤن؟",
      finalCta: "خلّ مطعمك له تطبيقه الخاص",
      finalCtaButton: "تواصل معنا على واتساب",
    });
  }
  const features = await db.select({ id: featureTable.id }).from(featureTable).limit(1);
  if (!features[0]) {
    await db.insert(featureTable).values([
      { title: "هوية تليق بمطعمك", description: "تصميم يحمل شخصية مطعمك ويجعل التجربة مألوفة من أول لمسة.", icon: "sparkles", sortOrder: 1, active: true },
      { title: "منيو إلكتروني على الآيباد", description: "شاشة واضحة داخل المطعم لعرض الصور والأسعار وتحديثها بسهولة.", icon: "tablet", sortOrder: 2, active: true },
      { title: "نقطة بيع للمطعم", description: "استقبال الطلبات من الكاشير وتوجيهها بسلاسة إلى المطبخ والصالة.", icon: "store", sortOrder: 3, active: true },
      { title: "محاسبة وتقارير أوضح", description: "تابع المبيعات والفواتير وإغلاق اليوم من لوحة واحدة.", icon: "calculator", sortOrder: 4, active: true },
      { title: "طلبات وإشعارات فورية", description: "ابقَ قريبًا من عملائك ووصل الطلبات والتنبيهات في وقتها.", icon: "bell", sortOrder: 5, active: true },
      { title: "جاهز للنشر والتطوير", description: "نجهز تطبيقك للمتاجر ونبقى معك بعد الإطلاق.", icon: "rocket", sortOrder: 6, active: true },
    ]).onConflictDoNothing({ target: featureTable.title });
  }
  const pricing = await db.select({ id: pricingPlansTable.id }).from(pricingPlansTable).limit(1);
  if (!pricing[0]) {
    await db.insert(pricingPlansTable).values({
      name: "باقة تطبيق مطعمك",
      price: 299,
      currency: "SAR",
      billingPeriod: "شهريًا",
      description: "كل ما تحتاجه لإطلاق تطبيقك بثقة",
      features: ["تطبيق خاص باسم المطعم", "تصميم يناسب الهوية", "قائمة طعام رقمية", "استقبال الطلبات", "إشعارات العملاء", "تجهيز App Store وGoogle Play", "دعم وتعديلات"],
      recommended: true,
      active: true,
      sortOrder: 1,
    });
  }
  const contact = await db.select({ id: contactSettingsTable.id }).from(contactSettingsTable).limit(1);
  if (!contact[0]) {
    await db.insert(contactSettingsTable).values({
      whatsapp: "966510531741",
      email: "alaay12a@gmail.com",
      instagram: "",
      twitter: "",
      tiktok: "",
    });
  }
  const notifications = await db.select({ id: notificationTable.id }).from(notificationTable).limit(1);
  if (!notifications[0]) {
    await db.insert(notificationTable).values({
      title: "جاهز لتطبيق مطعمك؟",
      message: "شاركنا فكرتك، ونبني لك تجربة رقمية تحمل اسمك.",
      linkText: "ابدأ الآن",
      linkUrl: "#contact",
      active: true,
      sortOrder: 1,
    });
  }
  const counter = await db.select({ id: marketingOrderCounterTable.id }).from(marketingOrderCounterTable).limit(1);
  if (!counter[0]) {
    await db.insert(marketingOrderCounterTable).values({
      id: 1,
      currentValue: 12500,
      minDailyIncrease: 8,
      maxDailyIncrease: 24,
      dailyIncrease: 16,
      enabled: true,
    });
  }
  const logos = await db.select({ id: restaurantLogosTable.id }).from(restaurantLogosTable).limit(1);
  if (!logos[0]) {
    await db.insert(restaurantLogosTable).values([
      { name: "مطعم محلي", logoPath: "", appDownloadUrl: "", active: true, sortOrder: 1 },
      { name: "شريكنا القادم", logoPath: "", appDownloadUrl: "", active: true, sortOrder: 2 },
    ]).onConflictDoNothing({ target: restaurantLogosTable.name });
  }
  await db.update(siteContentTable).set({ updatedAt: new Date() }).where(eq(siteContentTable.id, content?.id ?? 1));
  seeded = true;
}

export async function ensureSeeded() {
  if (seeded) return;
  if (!seedPromise) {
    seedPromise = seedDefaults().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}