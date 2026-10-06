import { CertaintyLevel } from "@/components/ui/CertaintyChip";
import { ScopeType } from "@/components/ui/ScopeTag";
import { PriorityLevel } from "@/components/ui/VisitPriorityBadge";
import { PropertyImageManifestItem, getImagesForProperty } from "@/lib/images";

export interface PropertyFact {
  id: string;
  label: string;
  value: string;
  certainty: CertaintyLevel;
  scope: ScopeType;
  impactExplanation?: string;
  isConflictChoice?: boolean;
  alternativeValue?: string;
}

export interface PropertyItem {
  id: string;
  title: string;
  price: number;
  formattedPrice: string;
  areaM2: number;
  rooms: number;
  district: string;
  source: "link" | "screenshot" | "manual";
  sourceLabel: string;
  colorTone: "sandstone" | "cocoa" | "driftwood";
  images: PropertyImageManifestItem[];
  isOverBudget?: boolean;
  budgetDelta?: string;
  preRank: number;
  postRank: number;
  visitPriority: PriorityLevel;
  visitPriorityReason: string;
  keyAdvantage: string;
  keyTradeoff: string;
  fairPriceStatus: "available" | "insufficient";
  fairPriceRange?: string;
  travelTimeWorkMin: number;
  facts: PropertyFact[];
  whyReasons: {
    category: "الملاءمة" | "السعر" | "الحياة اليومية" | "المخاطر";
    title: string;
    description: string;
    certainty: CertaintyLevel;
  }[];
}

export interface InspectionQuestion {
  id: string;
  title: string;
  categoryTag: "معلومة غير معروفة" | "تعارض مصادر" | "مخاطرة محتملة";
  whyItMatters: string;
  howToCheck: string;
  defaultStatus: "good" | "problem" | "unchecked";
  note?: string;
}

export interface UserNeed {
  hardConstraint: {
    id: string;
    title: string;
    value: string;
    numericBudget: number;
    description: string;
    isPinned: boolean;
  };
  preferences: {
    id: string;
    title: string;
    value: string;
    priority: "high" | "medium" | "low";
    priorityLabel: string;
  }[];
}

export const INITIAL_USER_NEED: UserNeed = {
  hardConstraint: {
    id: "budget",
    title: "الميزانية القصوى",
    value: "لا تتجاوز 900,000 ر.س",
    numericBudget: 900000,
    description: "شرط قاطع: أي خيار يتجاوز هذا السعر يعتبر غير مطابق.",
    isPinned: true,
  },
  preferences: [
    {
      id: "proximity",
      title: "القرب من مقر العمل",
      value: "حتى 20 دقيقة بالسيارة",
      priority: "high",
      priorityLabel: "أولوية مرتفعة",
    },
    {
      id: "bedrooms",
      title: "عدد غرف النوم",
      value: "3 غرف نوم على الأقل",
      priority: "medium",
      priorityLabel: "أولوية متوسطة",
    },
  ],
};

export const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: "p1",
    title: "شقة في حي الياسمين",
    price: 870000,
    formattedPrice: "870,000 ر.س",
    areaM2: 148,
    rooms: 3,
    district: "الياسمين، شمال الرياض",
    source: "link",
    sourceLabel: "رابط معلن",
    colorTone: "sandstone",
    images: getImagesForProperty("p1"),
    isOverBudget: false,
    preRank: 1,
    postRank: 2,
    visitPriority: "high",
    visitPriorityReason: "تطابق ممتاز مع الميزانية وقرب العمل، يتطلب التأكد الميداني من المساحة الدقيقة وحالة السقف.",
    keyAdvantage: "15 دقيقة فقط من العمل ومطابقة تماماً لسقف الميزانية",
    keyTradeoff: "تعارض في المساحة بين الصك والإعلان، ومبنى ذو تشطيب متوسط",
    fairPriceStatus: "available",
    fairPriceRange: "5,800 - 6,100 ر.س / م²",
    travelTimeWorkMin: 15,
    facts: [
      {
        id: "p1-price",
        label: "سعر العقار",
        value: "870,000 ر.س (ضمن الميزانية بفرق 30 ألف)",
        certainty: "confirmed",
        scope: "property",
      },
      {
        id: "p1-area",
        label: "المساحة الإجمالية",
        value: "148 م² (وفق الصك) مقابل 160 م² (في الإعلان)",
        certainty: "conflicting",
        scope: "property",
        impactExplanation: "يؤثر فرق 12 م² على سعر المتر الفعلي بنسبة تقارب 7.5%.",
        isConflictChoice: true,
        alternativeValue: "160 م²",
      },
      {
        id: "p1-commute",
        label: "وقت الوصول للعمل",
        value: "15 دقيقة في أوقات الذروة",
        certainty: "derived",
        scope: "micro_location",
      },
      {
        id: "p1-neighborhood",
        label: "طبيعة الحي السكني",
        value: "مكتمل الخدمات، متوسط حركة السير معتدل",
        certainty: "reported",
        scope: "neighborhood",
      },
      {
        id: "p1-age",
        label: "عمر العقار",
        value: "4 سنوات (مبنى حديث)",
        certainty: "confirmed",
        scope: "property",
      },
    ],
    whyReasons: [
      {
        category: "الملاءمة",
        title: "تطابق شبه تام مع معيار التنقل",
        description: "توفير ما يزيد عن 40 دقيقة يومياً مقارنة بمتوسط رحلات العمل لحي النرجس.",
        certainty: "derived",
      },
      {
        category: "السعر",
        title: "سعر المتر العادل متطابق مع صفقات الحي",
        description: "قيمة الصفقة تقع ضمن النطاق السعري الطبيعي لحي الياسمين للفترة الأخيرة.",
        certainty: "confirmed",
      },
      {
        category: "الحياة اليومية",
        title: "شارع سكني هادئ ونافذ",
        description: "موقع العقار يبعد 400 متر عن الشريان التجاري مما يقلل الضوضاء.",
        certainty: "reported",
      },
      {
        category: "المخاطر",
        title: "تعارض قياسات المساحة",
        description: "ضرورة مراجعة الكروكي الهندسي لتفادي دفع قيمة مساحة خدمات مشتركة.",
        certainty: "conflicting",
      },
    ],
  },
  {
    id: "p2",
    title: "شقة في حي الملقا",
    price: 910000,
    formattedPrice: "910,000 ر.س",
    areaM2: 155,
    rooms: 3,
    district: "الملقا، شمال الرياض",
    source: "screenshot",
    sourceLabel: "لقطة شاشة",
    colorTone: "cocoa",
    images: getImagesForProperty("p2"),
    isOverBudget: true,
    budgetDelta: "+10,000 ر.س فوق الحد الأقصى",
    preRank: 3,
    postRank: 3,
    visitPriority: "low",
    visitPriorityReason: "تتجاوز الميزانية الصارمة، مع شح الصفقات المماثلة لتقدير القيمة العادلة بدقة.",
    keyAdvantage: "موقع راقٍ ومساحة رحبة وتشطيبات حديثة ممتازة",
    keyTradeoff: "تجاوز شرط الميزانية الصارم وصعوبة التثمين الإحصائي لقلة المعروض المماثل",
    fairPriceStatus: "insufficient",
    travelTimeWorkMin: 18,
    facts: [
      {
        id: "p2-price",
        label: "سعر العقار",
        value: "910,000 ر.س (تجاوز الميزانية بمقدار 10,000 ر.س)",
        certainty: "confirmed",
        scope: "property",
        impactExplanation: "يخل بشرط الميزانية الصارم ما لم يكن هناك مجال تفاوض مؤكد.",
      },
      {
        id: "p2-area",
        label: "المساحة الإجمالية",
        value: "155 م² صافي مساحة",
        certainty: "reported",
        scope: "property",
      },
      {
        id: "p2-fair-price",
        label: "التقييم المقارن",
        value: "غير كافٍ للتقدير (بيانات صفقات الملقا المماثلة شحيحة)",
        certainty: "unknown",
        scope: "market",
      },
      {
        id: "p2-commute",
        label: "وقت الوصول للعمل",
        value: "18 دقيقة عبر طريق أنس بن مالك",
        certainty: "derived",
        scope: "micro_location",
      },
    ],
    whyReasons: [
      {
        category: "الملاءمة",
        title: "جودة بنائية متفوقة مع إخلال بالميزانية",
        description: "رغم مميزات العقار، إلا أن تجاوزه سقف الميزانية المحددة يخفض ترتيبه المنهجي.",
        certainty: "confirmed",
      },
      {
        category: "السعر",
        title: "عدم توفر معيار مقارن دقيق",
        description: "قلة المبيعات المنفذة مؤخراً في هذا المربع العقاري تجعل التقييم غير حاسم.",
        certainty: "unknown",
      },
    ],
  },
  {
    id: "p3",
    title: "شقة في حي النرجس",
    price: 820000,
    formattedPrice: "820,000 ر.س",
    areaM2: 152,
    rooms: 3,
    district: "النرجس، شمال الرياض",
    source: "manual",
    sourceLabel: "إدخال يدوي",
    colorTone: "driftwood",
    images: getImagesForProperty("p3"),
    isOverBudget: false,
    preRank: 2,
    postRank: 1, // Becomes #1 after P1 reassessment issue!
    visitPriority: "medium",
    visitPriorityReason: "سعر منافس جداً يوفر 80 ألف ر.س عن الميزانية، مع زيادة طفيفة في زمن التنقل.",
    keyAdvantage: "أقل سعر إجمالي وفارق وفر مالي 80,000 ر.س عن الميزانية",
    keyTradeoff: "21 دقيقة لمقر العمل (أعلى بدقيقة واحدة من التفضيل المثالي)",
    fairPriceStatus: "available",
    fairPriceRange: "5,300 - 5,600 ر.س / م²",
    travelTimeWorkMin: 21,
    facts: [
      {
        id: "p3-price",
        label: "سعر العقار",
        value: "820,000 ر.س (يوفر 80,000 ر.س عن الميزانية)",
        certainty: "confirmed",
        scope: "property",
      },
      {
        id: "p3-area",
        label: "المساحة الإجمالية",
        value: "152 م² موثقة",
        certainty: "confirmed",
        scope: "property",
      },
      {
        id: "p3-age",
        label: "عمر المبنى",
        value: "غير محدد في البيانات الأولية (يتطلب إدخال)",
        certainty: "unknown",
        scope: "property",
      },
      {
        id: "p3-commute",
        label: "وقت الوصول للعمل",
        value: "21 دقيقة (تجاوز طفيف للتفضيل المستهدف 20 د)",
        certainty: "derived",
        scope: "micro_location",
      },
    ],
    whyReasons: [
      {
        category: "السعر",
        title: "وفر مالي ممتاز يمنح مرونة",
        description: "الفارق السعري البالغ 80,000 ر.س يغطي تكاليف التأثيث والصيانة التقديرية.",
        certainty: "confirmed",
      },
      {
        category: "الملاءمة",
        title: "مساحة رحبة ومخطط مقسم بذكاء",
        description: "3 غرف نوم بمساحات رحبة تتوافق مع نمو الأسرة الصغيرة.",
        certainty: "confirmed",
      },
      {
        category: "الحياة اليومية",
        title: "قرب محور أبو بكر الصديق",
        description: "سهولة الحركة والربط مع المطار ومراكز الأعمال الرئيسية.",
        certainty: "reported",
      },
    ],
  },
];

export const INITIAL_INSPECTION_ITEMS: InspectionQuestion[] = [
  {
    id: "insp-1",
    title: "رطوبة الجدران والأسقف وعوازل الحمامات والمطابخ",
    categoryTag: "مخاطرة محتملة",
    whyItMatters: "تسربات المياه والأسقف غير المعزولة قد تكلف أكثر من 35,000 ر.س في الإصلاحات الجذرية.",
    howToCheck: "تفقد أركان الأسقف المجاورة للحمامات والمطابخ، وتحسس رطوبة الطلاء ووجود أي انتفاخات أو روائح عفن.",
    defaultStatus: "problem", // Pre-filled "مشكلة" for demo!
    note: "لوحظت آثار رطوبة وتقشر طلاء في سقف الممر قرب حمام الضيوف.",
  },
  {
    id: "insp-2",
    title: "مطابقة المساحة الفعلية للغرف مع المخطط المرفق",
    categoryTag: "تعارض مصادر",
    whyItMatters: "لوجود تعارض في الصك، يجب التأكد من أن مساحة الصالة والغرف مطابقة للواقع وليس مجرد بلكونات محتسبة.",
    howToCheck: "قم بقياس الغرفة الرئيسية والصالة بشريط القياس أو تطبيق الهاتف ومقارنة الأبعاد بالكروكي.",
    defaultStatus: "good",
    note: "تم التأكد من أبعاد الصالة والغرفة الرئيسية وتبدو متطابقة مع 148 م² الصافية.",
  },
  {
    id: "insp-3",
    title: "مستوى العزل الصوتي للنوافذ الخارجية ومصادر الإزعاج",
    categoryTag: "معلومة غير معروفة",
    whyItMatters: "جودة الزجاج (دبل جلاس) تحدد هدوء المنزل خاصة في الشقق القريبة من التقاطعات الحيوية.",
    howToCheck: "أغلق جميع النوافذ واستمع بدقة لأصوات مكيفات الجيران أو أصوات السيارات بالشارع أثناء أوقات الذروة.",
    defaultStatus: "good",
  },
  {
    id: "insp-4",
    title: "ضغط وتدفق المياه في ساعات الاستخدام المعتادة",
    categoryTag: "معلومة غير معروفة",
    whyItMatters: "ضعف شبكة المياه العلوية أو المضخات يستلزم استبدال دينمو أو تركيب خزانات تقوية إضافية.",
    howToCheck: "افتح أكثر من صنبور ومحبس دش في وقت واحد ولاحظ ثبات التدفق وقوة الضغط.",
    defaultStatus: "good",
  },
  {
    id: "insp-5",
    title: "حالة المصعد المشترك ونظافة المداخل والممرات العامة",
    categoryTag: "معلومة غير معروفة",
    whyItMatters: "يعكس مدى التزام اتحاد الملاك بالصيانة الدورية وسداد الاشتراكات الشهرية.",
    howToCheck: "تفقد تاريخ آخر ملصق صيانة داخل كابينة المصعد وافحص نظافة الممر المؤدي للباب الرئيسي.",
    defaultStatus: "good",
  },
  {
    id: "insp-6",
    title: "مواقف السيارات المخصصة وسهولة المناورة والدخول",
    categoryTag: "مخاطرة محتملة",
    whyItMatters: "ضيق مواقف القبو أو صعوبة خروج السيارة يمثل إرهاقاً يومياً متكرراً.",
    howToCheck: "جرب الدخول بسيارتك إلى الموقف المخصص للشقة وتأكد من عدم وجود عوائق أو أعمدة تعيق فتح الأبواب.",
    defaultStatus: "unchecked",
  },
  {
    id: "insp-7",
    title: "جاهزية شبكة الألياف البصرية والتغطية اللاسلكية",
    categoryTag: "معلومة غير معروفة",
    whyItMatters: "أساسي لمن يعملون عن بعد ولضمان استقرار الاتصال وسرعة الإنترنت المنزلية.",
    howToCheck: "تحقق من وجود بوكسية الألياف (STC / موبايلي) عند مدخل الشقة وافحص إشارة شبكة الجوال.",
    defaultStatus: "unchecked",
  },
  {
    id: "insp-8",
    title: "نفاذ الضوء الطبيعي والتهوية في الغرف الداخلية",
    categoryTag: "معلومة غير معروفة",
    whyItMatters: "الشقق ذات المناور الضيقة تفتقر للإضاءة الطبيعية وتزيد من استهلاك الكهرباء والرطوبة.",
    howToCheck: "أطفئ الإضاءة الكهربائية في وضح النهار وافحص وصول الشمس إلى غرف النوم والمطبخ.",
    defaultStatus: "unchecked",
  },
];

export const INITIAL_SAVED_CASES = [
  {
    id: "demo",
    title: "شقة لعائلة صغيرة قرب العمل",
    city: "الرياض",
    budget: "900,000 ر.س",
    propertiesCount: 3,
    status: "جاهز للمعاينة",
    lastUpdated: "منذ 15 دقيقة",
    thumbnailTone: "sandstone",
  },
  {
    id: "case-2",
    title: "فيلا تاون هاوس شمال الرياض",
    city: "الرياض (العارض)",
    budget: "1,450,000 ر.س",
    propertiesCount: 2,
    status: "بعد المعاينة",
    lastUpdated: "أمس",
    thumbnailTone: "cocoa",
  },
];

export const INITIAL_INSPECTION_QUESTIONS = INITIAL_INSPECTION_ITEMS;
