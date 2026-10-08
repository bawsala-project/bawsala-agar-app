/**
 * Centralized Arabic Copy for Bawsala (بوصلة)
 * Warm, plain, short Arabic. No stiff or formal jargon.
 */

import { isolateLtr } from "./format";

export const COPY = {
  brand: {
    name: "بوصلة",
    enName: "BAWSALA",
    tagline: "قرارك العقاري، بوضوح",
    subtitle: "دليلك الموثوق لاختيار العقار الأنسب لك، بدون تحيز أو حيرة.",
  },

  journeySteps: [
    { id: "needs", label: "طلبك" },
    { id: "properties", label: "العقارات" },
    { id: "preflight", label: "التأكد" },
    { id: "results", label: "الأنسب لك" },
    { id: "inspection", label: "المعاينة" },
  ],

  start: {
    title: "اختر مدينتك وصف طلبك",
    subtitle: "اكتب ما تبحث عنه ببساطة، وسنستخرج التفاصيل والميزانية فوراً.",
    conversationalTab: "وصف حر",
    formTab: "خيارات سريعة",
    textareaPlaceholder: "مثال: شقة لعائلة صغيرة قرب العمل شمال الرياض، ميزانيتي في حدود 900 ألف ر.س.",
    quickChipsLabel: "طريقة الشراء المخططة:",
    quickChips: [
      { id: "cash", label: "شراء نقدي" },
      { id: "mortgage", label: "تمويل بنكي" },
      { id: "undecided", label: "لم أحدد بعد" },
    ],
    liveExtractionTitle: "فهمنا من كلامك",
    liveExtractionSubtitle: "المحددات التي استخرجناها:",
    cta: "متابعة الطلب",
  },

  needs: {
    title: "ما فهمناه من طلبك",
    subtitle: "راجع هذه النقاط للتأكد من مطابقتها لما ترغب به بدقة.",
    hardConstraintHeader: "شرط أساسي",
    hardConstraintTip: "أي عقار يتجاوز هذا السعر سيُستبعد فوراً.",
    preferencesHeader: "تفضيلاتك",
    preferencesTip: "نستخدمها للمفاضلة وترتيب الأنسب لك.",
    editButton: "تعديل",
    footerNotice: "يمكنك التعديل في أي وقت خلال رحلة القرار.",
    cta: "إضافة العقارات",
    sheetTitle: "تعديل الطلب",
    sheetSubtitle: "حدّد أولوياتك بدقة لتحصل على أفضل مقارنة.",
  },

  properties: {
    title: "أضف العقارات التي تقارن بينها",
    subtitle: "أدخل حتى 5 عقارات من أي منصة أو صورة أو إدخال يدوي.",
    slotsCounter: (count: number) => `${count} من 5 عقارات`,
    entryTiles: [
      { id: "link", title: "رابط عقار", desc: "من تطبيق عقار أو غيره" },
      { id: "screenshot", title: "صورة أو لقطة", desc: "قراءة آلية للمواصفات" },
      { id: "manual", title: "إدخال يدوي", desc: "اكتب البيانات بنفسك" },
    ],
    emptySlot: "أضف عقاراً آخر للمقارنة",
    statusReading: "جارٍ قراءة البيانات...",
    statusIdentified: "تمت القراءة بنجاح",
    cta: "فحص الجاهزية",
    sheetAddTitle: "إضافة عقار جديد",
    sheetAddSubtitle: "اختر الطريقة الأنسب لإدخال تفاصيل العقار.",
  },

  preflight: {
    title: "قبل أن نقارن",
    subtitle: "نتأكد من اكتمال الصورة حتى تكون المقارنة عادلة ومفيدة لك.",
    readinessTitle: "جاهزية البيانات",
    readinessLabel: "جاهزية البيانات",
    readyText: "جاهز للمقارنة والترتيب",
    incompleteText: "باقي تفاصيل بسيطة",
    sectionUnderstood: "معلومات واضحة ومؤكدة",
    sectionMissing: "نقاط تحتاج تأكيدك",
    conflictTitle: "تعارض في المساحة",
    conflictDesc: "وجدنا فرقاً بين الصك والإعلان (148 م² مقابل 160 م²).",
    unknownAgeTitle: "عمر المبنى غير معروف",
    unknownAgeDesc: "معرفة عمر المبنى تساعدنا في تقدير تكاليف الصيانة المستقبلية بدقة.",
    dontKnowOption: "لا أعرف بالضبط",
    cta: "عرض الأنسب لك",
    ctaReady: "عرض الأنسب لك",
  },

  checkout: {
    title: "استشارة كاملة بـ 10 ر.س",
    subtitle: "تحليل محايد ومستقل يجنبك قرارات الشراء المكلفة.",
    summaryTitle: "ماذا نقدم لك في هذه الاستشارة:",
    features: [
      "فحص تطابق الشروط والميزانية بدون أي مجاملة",
      "مقارنة مباشرة توضح المقايضات ومزايا كل خيار",
      "قائمة أسئلة مخصصة تفحصها بنفسك في الميدان",
      "تحديث فوري للترتيب بناءً على معاينتك الميدانية",
    ],
    priceLabel: "قيمة الاستشارة",
    priceValue: isolateLtr("10 ر.س"),
    paymentNote: "وضع تجريبي معتمد (Demo) • لا يتم خصم مبالغ حقيقية",
    trustNote: "بياناتك مشفرة ومحمية بالكامل.",
    guarantee: "تحليل موضوعي يضع مصلحتك أولاً.",
    cta: "بدء التحليل الآن",
    successMsg: "تم الدفع بنجاح، جاري إعداد الترتيب...",
    failedMsg: "تعذر إتمام الدفع التجريبي. اضغط للمحاولة مجدداً.",
  },

  analyzing: {
    title: "نرتّب لك الخيارات الآن",
    subtitle: "نفحص كل عقار وفق شروطك وميزانيتك المحددة",
    steps: [
      "قراءة وفصل مواصفات كل عقار",
      "مقارنة الخيارات وفق شروطك وتفضيلاتك",
      "ترتيب الأنسب لك وتوضيح أسباب المقايضة",
    ],
    settled: "اكتمل الترتيب بنجاح",
  },

  results: {
    title: "الأنسب لك",
    subtitle: "رتبنا خياراتك بناءً على السعر العادل، القرب، ومطابقة طلبك.",
    statusRanked: "خيارك الأنسب واضح",
    statusProvisional: "ترتيب مبدئي",
    statusInsufficient: "نحتاج بيانات أكثر للمقارنة",
    closeOptionsNotice: "الخياران الأول والثاني متقاربان جداً",
    closeOptionsDesc: "المفاضلة النهائية بينهما تعتمد على ما ستراه في المعاينة الميدانية.",
    keyAdvantage: "أهم ميزة:",
    keyTradeoff: "أبرز مقايضة:",
    visitPriorityLabel: "أولوية الزيارة:",
    nonBindingNote: "تحليل إرشادي لمساعدتك في اتخاذ قرارك بثقة وراحة بال.",
    compareCta: "مقارنة العقارات",
    viewDetails: "التفاصيل",
  },

  propertyDetail: {
    tabs: {
      fit: "الملاءمة",
      price: "السعر",
      lifestyle: "الحياة اليومية",
      risks: "المخاطر والمجهولات",
    },
    fairPriceTitle: "السعر العادل التقديري للمتر",
    fairPriceInsufficient: "الصفقات المماثلة قليلة في هذا الحي حالياً",
    fairPriceBand: "النطاق السعري العادل",
    travelTimesTitle: "أوقات التنقل التقديرية",
    selectForVisit: "اختر هذا العقار للمعاينة الميدانية",
    selectForVisitCta: "اختر للمعاينة",
    selectedForVisitLabel: "مُحدد للمعاينة",
  },

  compare: {
    title: "مقارنة جنباً إلى جنب",
    subtitle: "جدول مباشر يسلط الضوء على الفروقات الجوهرية بدون تحيز.",
    filterDiffsOnly: "أهم الفروق فقط",
    showDiffOnly: "أهم الفروق فقط",
    pivotQuestion: "ما الذي قد يغيّر هذا الترتيب؟",
    whatCouldChangeRank: "ما الذي قد يغيّر هذا الترتيب؟",
    selectVisitCta: "بدء المعاينة",
  },

  inspection: {
    title: "قائمة المعاينة الميدانية",
    subtitle: "أسئلة ذكية تفحصها بنفسك داخل العقار للتأكد من سلامته ونقاطه الغامضة.",
    progressLabel: (done: number, total: number) => `${done} من ${total} محاور تم فحصها`,
    howToCheck: "كيف تتأكد بنفسك؟",
    statusOptions: {
      good: "سليم / جيد",
      problem: "مشكلة / عيب",
      unchecked: "لم أتحقق بعد",
    },
    notePlaceholder: "أضف ملاحظتك أو صورك من الموقع هنا...",
    reassessCta: "تحديث الترتيب",
    cta: "تحديث الترتيب",
  },

  reassess: {
    title: "ماذا تغيّر بعد زيارتك؟",
    subtitle: "أدخلنا ملاحظاتك الميدانية في التحليل، وهذا هو الأثر على الترتيب والاطمئنان.",
    analyzingMini: "جارٍ إعادة احتساب الترتيب وفق مدخلات الزيارة...",
    sectionFindings: "ما تغيّر في المعطيات الميدانية",
    sectionRankChange: "تغيّر الترتيب ومستوى الاطمئنان",
    confidenceDrop: "مستوى الاطمئنان للعقار الأول: تراجع لوجود ملاحظات سباكة",
    unaffectedNotice: "لم يتأثر التقييم",
    sectionWhy: "لماذا تغيّر هذا الترتيب؟",
    saveCaseCta: "حفظ في حسابي",
  },

  login: {
    sheetTitle: "حفظ الحالة / تسجيل الدخول",
    sheetSubtitle: "سجّل رقمك لحفظ تحليلاتك العقارية والرجوع إليها في أي وقت.",
    phoneLabel: "رقم الجوال",
    phonePlaceholder: "05xxxxxxxx",
    sendCode: "إرسال رمز التحقق",
    enterOtpTitle: "أدخل رمز التحقق",
    enterOtpSubtitle: "أرسلنا رمزاً مكوناً من 4 أرقام لهاتفك",
    resendTimer: (sec: number) => `إعادة الإرسال بعد ${sec} ثانية`,
    resendAction: "إعادة إرسال الرمز الآن",
    verifyAction: "تأكيد ومتابعة",
    toastSaved: "تم حفظ الحالة بنجاح في حسابك",
  },

  dashboard: {
    greeting: "أهلاً بك، مستشارك جاهز",
    remainingQuota: "الاستشارات المتبقية: 2",
    title: "دراساتك العقارية",
    emptyTitle: "لا توجد دراسات محفوظة بعد",
    emptySubtitle: "ابدأ دراسة جديدة لمقارنة خياراتك العقارية بكل ثقة وراحة بال.",
    startNewCase: "دراسة جديدة",
    openCase: "متابعة الدراسة",
    deleteCase: "حذف الدراسة",
    confirmDeleteTitle: "هل تريد حذف هذه الدراسة؟",
    confirmDeleteDesc: "سيتم حذف بيانات العقارات والملاحظات نهائياً.",
    cancel: "إلغاء",
    confirmDelete: "نعم، حذف",
  },
} as const;
