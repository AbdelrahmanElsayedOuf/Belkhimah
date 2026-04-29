// Belkhedma mock data — comprehensive seed covering every Step-3 filter permutation.
// Structure:
//   - Providers: EXCP/Belkhedma (id=0, isFirstParty) + 7 sub-providers.
//   - Catalogs: serviceGroups, serviceSubTypes, nationalities, serviceDetails (full value sets).
//   - Offers: 22 hand-crafted "featured" offers + ~350 generated variants so every
//     (subType × hours/contract/duration × shift × nationality) combo has at least one match.
// Every offer carries the Step-3 attributes (hours, shift, nationality, contractMonths,
// medicalDuration, maxWorkers) that the results-page filter panel reads.

(function buildMockData() {
    // ============================================================
    // Static catalogs
    // ============================================================
    const providers = [
        { id: 0, code: "EXCP", nameAr: "بلخدمة", nameEn: "Belkhedma", logo: "ب",
          logoColor: "linear-gradient(135deg, #8B1874 0%, #B50B68 50%, #E91E8C 100%)",
          tier: "A", rating: 4.9, reviews: 1248, availability: 92,
          isSponsored: false, isFirstParty: true, integrationMode: "Platform",
          supportsHourly: true, supportsMonthly: true, supportsMedical: true, supportsMediation: true,
          cityCoverage: ["riyadh", "jeddah", "dammam", "mecca", "medina", "khobar", "taif"],
          supportedNationalities: ["filipino", "indonesian", "srilankan", "indian", "nepali"],
          attributes: ["platformCurated", "priceGuarantee", "freeReplacement"] },
        { id: 1, code: "ENAYA", nameAr: "عناية", nameEn: "Enaya", logo: "E",
          logoColor: "linear-gradient(135deg, #8B1874, #B50B68)",
          tier: "A", rating: 4.8, reviews: 234, availability: 85,
          isSponsored: true, sponsoredTier: 1, isFirstParty: false, integrationMode: "Api",
          supportsHourly: false, supportsMonthly: true, supportsMedical: true, supportsMediation: false,
          cityCoverage: ["riyadh", "jeddah", "dammam", "khobar"],
          supportedNationalities: ["filipino", "indonesian", "srilankan"],
          attributes: ["serviceType", "contractDuration"] },
        { id: 2, code: "FAWRAN", nameAr: "فوران", nameEn: "Fawran", logo: "F",
          logoColor: "linear-gradient(135deg, #1E88E5, #42A5F5)",
          tier: "B", rating: 4.5, reviews: 156, availability: 72,
          isSponsored: false, isFirstParty: false, integrationMode: "Api",
          supportsHourly: true, supportsMonthly: false, supportsMedical: false, supportsMediation: true,
          cityCoverage: ["riyadh", "jeddah", "dammam", "mecca"],
          supportedNationalities: ["filipino", "indonesian"],
          attributes: ["shift", "equipment"] },
        { id: 3, code: "MUEEN", nameAr: "معين", nameEn: "Mueen", logo: "M",
          logoColor: "linear-gradient(135deg, #43A047, #66BB6A)",
          tier: "B", rating: 4.2, reviews: 89, availability: 65,
          isSponsored: true, sponsoredTier: 2, isFirstParty: false, integrationMode: "Api",
          supportsHourly: true, supportsMonthly: true, supportsMedical: false, supportsMediation: false,
          cityCoverage: ["riyadh", "jeddah"],
          supportedNationalities: ["srilankan", "indian", "nepali"],
          attributes: ["workersCount", "equipment"] },
        { id: 4, code: "TAMKEEN", nameAr: "تمكين", nameEn: "Tamkeen HR", logo: "T",
          logoColor: "linear-gradient(135deg, #FB8C00, #FFA726)",
          tier: "A", rating: 4.9, reviews: 312, availability: 90,
          isSponsored: false, isFirstParty: false, integrationMode: "Api",
          supportsHourly: false, supportsMonthly: true, supportsMedical: true, supportsMediation: false,
          cityCoverage: ["riyadh", "jeddah", "dammam", "khobar", "taif"],
          supportedNationalities: ["filipino", "indonesian", "srilankan", "indian"],
          attributes: ["serviceType", "contractDuration"] },
        { id: 5, code: "ALMUTAHIDAH", nameAr: "المتحدة", nameEn: "Almutahidah", logo: "A",
          logoColor: "linear-gradient(135deg, #E53935, #EF5350)",
          tier: "A", rating: 4.7, reviews: 198, availability: 78,
          isSponsored: false, isFirstParty: false, integrationMode: "Scraper",
          supportsHourly: false, supportsMonthly: true, supportsMedical: false, supportsMediation: false,
          cityCoverage: ["riyadh", "jeddah", "mecca", "medina"],
          supportedNationalities: ["filipino", "indonesian", "indian"],
          attributes: ["serviceType"] },
        { id: 6, code: "ESAD", nameAr: "إسناد", nameEn: "Esad HADER", logo: "H",
          logoColor: "linear-gradient(135deg, #7B1FA2, #AB47BC)",
          tier: "B", rating: 4.3, reviews: 124, availability: 55,
          isSponsored: false, isFirstParty: false, integrationMode: "Scraper",
          supportsHourly: true, supportsMonthly: false, supportsMedical: true, supportsMediation: false,
          cityCoverage: ["riyadh", "dammam", "khobar"],
          supportedNationalities: ["filipino", "srilankan", "nepali"],
          attributes: ["serviceType", "nationality"] },
        { id: 7, code: "RAWABY", nameAr: "روابي", nameEn: "Rawaby HR", logo: "R",
          logoColor: "linear-gradient(135deg, #5C6BC0, #7986CB)",
          tier: "B", rating: 4.1, reviews: 76, availability: 45,
          isSponsored: false, isFirstParty: false, integrationMode: "Api",
          supportsHourly: false, supportsMonthly: true, supportsMedical: false, supportsMediation: true,
          cityCoverage: ["riyadh", "jeddah", "taif"],
          supportedNationalities: ["indonesian", "indian", "nepali"],
          attributes: ["contractDuration", "nationality"] }
    ];

    const serviceGroups = [
        { id: 1, nameAr: "ساعات", nameEn: "Hourly", icon: "clock", sortOrder: 1 },
        { id: 2, nameAr: "أفراد", nameEn: "Monthly/Resident", icon: "users", sortOrder: 2 },
        { id: 3, nameAr: "خدمات طبية", nameEn: "Medical Services", icon: "medical", sortOrder: 3 },
        { id: 4, nameAr: "وساطة", nameEn: "Mediation", icon: "handshake", sortOrder: 4 }
    ];

    const serviceSubTypes = [
        { id: 1, groupId: 1, nameAr: "تنظيف منزلي",        nameEn: "Home Cleaning",           icon: "spray"     },
        { id: 2, groupId: 1, nameAr: "طبخ",                 nameEn: "Cooking",                 icon: "pot"       },
        { id: 3, groupId: 1, nameAr: "رعاية مسنين",         nameEn: "Elderly Care",            icon: "cane"      },
        { id: 4, groupId: 2, nameAr: "عاملة منزلية مقيمة", nameEn: "Live-in Maid",            icon: "house"     },
        { id: 5, groupId: 2, nameAr: "مربية أطفال",         nameEn: "Nanny",                   icon: "baby"      },
        { id: 6, groupId: 3, nameAr: "تمريض منزلي",         nameEn: "Home Nursing",            icon: "stethoscope" },
        { id: 7, groupId: 3, nameAr: "رفقة مريض",           nameEn: "Patient Care",            icon: "heartbeat" },
        { id: 8, groupId: 4, nameAr: "توظيف بالوساطة",      nameEn: "Mediation Recruitment",   icon: "handshake" }
    ];

    const nationalities = [
        { id: "filipino",   nameAr: "فلبينية",   nameEn: "Filipino"   },
        { id: "indonesian", nameAr: "إندونيسية", nameEn: "Indonesian" },
        { id: "srilankan",  nameAr: "سريلانكية", nameEn: "Sri Lankan" },
        { id: "indian",     nameAr: "هندية",     nameEn: "Indian"     },
        { id: "nepali",     nameAr: "نيبالية",    nameEn: "Nepali"     }
    ];

    const serviceDetails = {
        hourlyHours: [2, 4, 6, 8],
        shifts: [
            { id: "morning", nameAr: "صباحاً", nameEn: "Morning" },
            { id: "evening", nameAr: "مساءً", nameEn: "Evening" }
        ],
        contractDurations: [
            { months: 1,  nameAr: "شهر واحد",  nameEn: "1 Month"  },
            { months: 3,  nameAr: "3 أشهر",    nameEn: "3 Months" },
            { months: 6,  nameAr: "6 أشهر",    nameEn: "6 Months" },
            { months: 12, nameAr: "سنة كاملة", nameEn: "1 Year"   }
        ],
        medicalDurations: [
            { id: "hourly",  nameAr: "بالساعة", nameEn: "Hourly"  },
            { id: "daily",   nameAr: "يومي",    nameEn: "Daily"   },
            { id: "weekly",  nameAr: "أسبوعي",  nameEn: "Weekly"  },
            { id: "monthly", nameAr: "شهري",    nameEn: "Monthly" }
        ]
    };

    const cities = [
        { id: "riyadh", nameAr: "الرياض",         nameEn: "Riyadh" },
        { id: "jeddah", nameAr: "جدة",             nameEn: "Jeddah" },
        { id: "dammam", nameAr: "الدمام",         nameEn: "Dammam" },
        { id: "mecca",  nameAr: "مكة المكرمة",    nameEn: "Mecca"  },
        { id: "medina", nameAr: "المدينة المنورة", nameEn: "Medina" },
        { id: "khobar", nameAr: "الخبر",           nameEn: "Khobar" },
        { id: "taif",   nameAr: "الطائف",         nameEn: "Taif"   }
    ];

    const savedLocations = [
        { id: 1, label: "المنزل",  city: "الرياض", district: "حي النرجس", address: "شارع الأمير سلطان، حي النرجس، الرياض",           isDefault: true  },
        { id: 2, label: "المكتب",  city: "الرياض", district: "حي العليا", address: "برج المملكة، طريق الملك فهد، حي العليا، الرياض", isDefault: false }
    ];

    const reviews = [
        { id: 1,  providerId: 0, customerNameAr: "أم عبدالله",   rating: 5, commentAr: "تجربة ممتازة، السعر واضح والاستبدال تم بسلاسة.", date: "2026-04-10" },
        { id: 2,  providerId: 0, customerNameAr: "سعود الحربي",   rating: 5, commentAr: "الفريق محترف والعاملة وصلت في موعدها بالضبط.", date: "2026-04-09" },
        { id: 3,  providerId: 0, customerNameAr: "نورة",          rating: 4, commentAr: "خدمة جيدة عموماً، تحتاج تحسين بسيط في التواصل.", date: "2026-04-05" },
        { id: 4,  providerId: 1, customerNameAr: "فهد الشمري",    rating: 5, commentAr: "عناية دائماً موثوقة، هذه ثالث مرة أحجز معهم.", date: "2026-04-08" },
        { id: 5,  providerId: 1, customerNameAr: "أم سارة",       rating: 4, commentAr: "العقد واضح والتنفيذ مرتب.", date: "2026-04-02" },
        { id: 6,  providerId: 2, customerNameAr: "خالد",          rating: 5, commentAr: "استجابة سريعة جداً للحجز الفوري.", date: "2026-04-11" },
        { id: 7,  providerId: 2, customerNameAr: "ريم",           rating: 4, commentAr: "أسعار معقولة والخدمة مناسبة.", date: "2026-04-07" },
        { id: 8,  providerId: 3, customerNameAr: "عبدالرحمن",     rating: 4, commentAr: "التنظيف جيد، المعدات مقبولة.", date: "2026-04-06" },
        { id: 9,  providerId: 4, customerNameAr: "منى",           rating: 5, commentAr: "تمكين أعطوني عقد ممتاز مع خدمة VIP.", date: "2026-04-03" },
        { id: 10, providerId: 5, customerNameAr: "بدر",           rating: 5, commentAr: "المتحدة دائماً تلتزم بالموعد.", date: "2026-04-04" },
        { id: 11, providerId: 6, customerNameAr: "هند",           rating: 4, commentAr: "إسناد جيد للخدمة المسائية.", date: "2026-04-01" },
        { id: 12, providerId: 7, customerNameAr: "ماجد",          rating: 4, commentAr: "روابي قدّموا عقد شامل بسعر مناسب.", date: "2026-03-30" }
    ];

    const banners = [
        { id: 1, titleAr: "عيدكم مبارك", titleEn: "Eid Mubarak",
          descriptionAr: "عروض حصرية بمناسبة العيد على جميع الخدمات",
          descriptionEn: "Exclusive Eid offers on all services",
          iconKey: "crescent",
          backgroundColor: "linear-gradient(135deg, #8B1874 0%, #B50B68 50%, #E91E8C 100%)",
          ctaTextAr: "اكتشف العروض", ctaTextEn: "Discover Offers",
          ctaAction: "showAllOffers", isActive: true },
        { id: 2, titleAr: "خصم 15% على أول حجز", titleEn: "15% Off First Booking",
          descriptionAr: "فعّل الخصم عند اختيار عرض بلخدمة الأول لك",
          descriptionEn: "Applied automatically on your first Belkhedma offer",
          iconKey: "gift",
          backgroundColor: "linear-gradient(135deg, #5E0E4F 0%, #8B1874 50%, #C03683 100%)",
          ctaTextAr: "ابدأ الآن", ctaTextEn: "Start Now",
          ctaAction: "startSearch:1", isActive: true },
        { id: 3, titleAr: "ممرضات مرخصات لمنزلك", titleEn: "Licensed Home Nurses",
          descriptionAr: "تمريض منزلي من هيئة التخصصات الصحية السعودية",
          descriptionEn: "Nursing from Saudi Commission for Health Specialties",
          iconKey: "medical",
          backgroundColor: "linear-gradient(135deg, #3E185E 0%, #6B2A8E 50%, #9B3ABE 100%)",
          ctaTextAr: "استعرض الخدمات", ctaTextEn: "Browse Services",
          ctaAction: "startSearch:3", isActive: true }
    ];

    const notifications = [
        { id: 1, icon: "check",   titleAr: "تم تأكيد حجزك",          bodyAr: "فريق بلخدمة سيتواصل معكِ قبل موعد الخدمة بـ 24 ساعة", timeAr: "قبل 12 دقيقة", unread: true  },
        { id: 2, icon: "tag",     titleAr: "خصم 15% على أول حجز",     bodyAr: "خصم محدود متاح لك حتى نهاية الأسبوع — فعّله عند الحجز",    timeAr: "قبل ساعتين",  unread: true  },
        { id: 3, icon: "star",    titleAr: "قيّم تجربتك الأخيرة",     bodyAr: "رأيك يساعد العائلات الأخرى على اختيار أفضل عرض",         timeAr: "أمس",         unread: true  },
        { id: 4, icon: "heart",   titleAr: "العرض المفضل يقترب من الانتهاء", bodyAr: "تبقى 8 ساعات على انتهاء عرض تمريض منزلي أضفتِه للمفضلة", timeAr: "أمس",         unread: false },
        { id: 5, icon: "message", titleAr: "ردّ فريق الوساطة على طلبك", bodyAr: "جهّزنا 3 خيارات عاملات مقيمات تناسب مواصفاتك",          timeAr: "قبل يومين",   unread: false }
    ];

    // ============================================================
    // Offer factory
    // ============================================================

    // Pricing tables — base SAR per unit before VAT / markup.
    // Lower per-hour rate as the block grows (volume discount, realistic market behavior).
    const HOURLY_BASE_PER_HOUR = { 2: 55, 4: 50, 6: 46, 8: 42 };
    const MONTHLY_BASE_PER_MONTH = { 1: 3100, 3: 2850, 6: 2550, 12: 2250 };
    // Per-worker pricing for medical services.
    const MEDICAL_BASE = { hourly: 85, daily: 620, weekly: 2900, monthly: 7100 };

    // Provider pricing bias — EXCP undercuts, premium providers charge more.
    const PROVIDER_FACTOR = { 0: 0.90, 1: 1.05, 2: 0.98, 3: 0.94, 4: 1.12, 5: 1.02, 6: 0.92, 7: 1.00 };
    const SHIFT_UPLIFT = { morning: 0, evening: 0.08 };
    const NAT_UPLIFT   = { filipino: 0.10, indonesian: 0.06, srilankan: 0.02, indian: 0.01, nepali: 0 };
    // Nanny commands a ~15 % premium over live-in maid.
    const SUBTYPE_UPLIFT = { 1: 0, 2: 0.05, 3: 0.08, 4: 0, 5: 0.15, 6: 0, 7: -0.15 };

    const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

    function calcPricing(base, providerId, shift, natId, subTypeId, isExcpOffer) {
        const f = PROVIDER_FACTOR[providerId] ?? 1;
        const shiftUp = SHIFT_UPLIFT[shift] ?? 0;
        const natUp   = NAT_UPLIFT[natId] ?? 0;
        const subUp   = SUBTYPE_UPLIFT[subTypeId] ?? 0;
        const providerPrice = round5(base * f * (1 + shiftUp + natUp + subUp));
        // EXCP undercuts the direct provider price by ~8 %.
        const excPrice = isExcpOffer ? round5(providerPrice * 0.92) : providerPrice;
        const VAT = 0.15;
        const finalExcPrice      = round5(excPrice * (1 + VAT));
        const finalProviderPrice = round5(providerPrice * (1 + VAT));
        const vat = finalExcPrice - excPrice;
        return { excPrice, providerPrice, vat, finalExcPrice, finalProviderPrice };
    }

    // Deterministic pseudo-random based on offer id — keeps data stable across reloads.
    const seed = (n) => ((n * 2654435761) >>> 0) / 4294967296;
    const pick = (arr, n) => arr[Math.floor(seed(n) * arr.length) % arr.length];

    const hourlyBadges = [
        { ar: "ضمان الاستبدال",  en: "Replacement Guarantee" },
        { ar: "خصم أول حجز",     en: "First-time Discount" },
        { ar: "معدات شاملة",     en: "All Supplies Included" },
        { ar: "استجابة سريعة",   en: "Quick Response" },
        { ar: "جديد - متاح",     en: "New - Available" },
        { ar: "تقييم عالي",      en: "Top Rated" },
        { ar: "خدمة VIP",        en: "VIP Service" },
        { ar: "إتاحة فورية",     en: "Instant Availability" }
    ];
    const monthlyBadges = [
        { ar: "شهر إضافي مجاني",   en: "1 Month Free" },
        { ar: "أفضل سعر سنوي",     en: "Best Yearly Rate" },
        { ar: "تأهيل معتمد",       en: "Certified Training" },
        { ar: "استبدال مجاني",     en: "Free Replacement" },
        { ar: "باقة شاملة",        en: "All-Inclusive Package" },
        { ar: "عقد ممتد",          en: "Extended Contract" },
        { ar: "خصم 10%",           en: "10% Off" },
        { ar: "خبرة عالية",        en: "High Experience" }
    ];
    const medicalBadges = [
        { ar: "مرخصة هيئة التخصصات", en: "Saudi Commission Licensed" },
        { ar: "فريق كامل",            en: "Full Team" },
        { ar: "باقة شهرية",           en: "Monthly Package" },
        { ar: "مرونة بالساعة",        en: "Flexible Hourly" },
        { ar: "تغطية أسبوعية",        en: "Weekly Coverage" },
        { ar: "خبرة +5 سنوات",        en: "+5 Years Experience" },
        { ar: "سعر تنافسي",           en: "Competitive Price" }
    ];

    const shiftAr = { morning: "صباحاً", evening: "مساءً" };
    const natAr   = Object.fromEntries(nationalities.map(n => [n.id, n.nameAr]));
    const natEn   = Object.fromEntries(nationalities.map(n => [n.id, n.nameEn]));
    const subAr   = Object.fromEntries(serviceSubTypes.map(s => [s.id, s.nameAr]));
    const subEn   = Object.fromEntries(serviceSubTypes.map(s => [s.id, s.nameEn]));
    const contractLabelAr = Object.fromEntries(serviceDetails.contractDurations.map(d => [d.months, d.nameAr]));
    const medDurAr = Object.fromEntries(serviceDetails.medicalDurations.map(d => [d.id, d.nameAr]));
    const medDurEn = Object.fromEntries(serviceDetails.medicalDurations.map(d => [d.id, d.nameEn]));

    const offers = [];
    let nextId = 1000;
    const pushOffer = (o) => offers.push({ id: ++nextId, isActive: true, ...o });

    // ----- Group 1: Hourly (subType × hours × shift × nationality) -----
    const hourlyProviders = providers.filter(p => p.supportsHourly);
    serviceSubTypes.filter(s => s.groupId === 1).forEach(sub => {
        serviceDetails.hourlyHours.forEach(hours => {
            serviceDetails.shifts.forEach(shiftDef => {
                nationalities.forEach(nat => {
                    hourlyProviders.forEach(p => {
                        // Only offer nationalities the provider actually supplies
                        if (!p.isFirstParty && !p.supportedNationalities.includes(nat.id)) return;
                        // Skip ~half of non-EXCP combos so the list stays digestible
                        // (EXCP always covers every combo — that's the "platform guarantee").
                        if (!p.isFirstParty) {
                            const k = seed(p.id * 1000 + sub.id * 100 + hours * 10 + (shiftDef.id === "morning" ? 0 : 1) + nat.id.length);
                            if (k < 0.55) return;
                        }
                        const base = HOURLY_BASE_PER_HOUR[hours] * hours;
                        const pr = calcPricing(base, p.id, shiftDef.id, nat.id, sub.id, p.isFirstParty);
                        const badge = pick(hourlyBadges, nextId + 1);
                        const tag = p.isFirstParty ? "بلخدمة" : p.nameAr;
                        pushOffer({
                            providerId: p.id, subTypeId: sub.id, groupId: 1,
                            hours, shift: shiftDef.id, nationality: nat.id,
                            titleAr: `${subAr[sub.id]} ${hours} ساعات ${shiftAr[shiftDef.id]} - ${natAr[nat.id]} (${tag})`,
                            titleEn: `${subEn[sub.id]} ${hours}h ${shiftDef.id} - ${natEn[nat.id]} (${p.nameEn})`,
                            badgeAr: badge.ar, badgeEn: badge.en,
                            ...pr,
                            views: 40 + Math.floor(seed(nextId + 2) * 900),
                            favorites: 2 + Math.floor(seed(nextId + 3) * 50),
                            hoursAgo: 1 + Math.floor(seed(nextId + 4) * 23),
                            expiresInHours: [8, 12, 24, 48, 72][Math.floor(seed(nextId + 5) * 5)]
                        });
                    });
                });
            });
        });
    });

    // ----- Group 2: Monthly (subType × contract × nationality) -----
    const monthlyProviders = providers.filter(p => p.supportsMonthly);
    serviceSubTypes.filter(s => s.groupId === 2).forEach(sub => {
        serviceDetails.contractDurations.forEach(dur => {
            nationalities.forEach(nat => {
                monthlyProviders.forEach(p => {
                    if (!p.isFirstParty && !p.supportedNationalities.includes(nat.id)) return;
                    if (!p.isFirstParty) {
                        const k = seed(p.id * 1000 + sub.id * 100 + dur.months * 10 + nat.id.length);
                        if (k < 0.50) return;
                    }
                    const base = MONTHLY_BASE_PER_MONTH[dur.months] * dur.months;
                    const pr = calcPricing(base, p.id, "morning", nat.id, sub.id, p.isFirstParty);
                    const badge = pick(monthlyBadges, nextId + 1);
                    const tag = p.isFirstParty ? "بلخدمة" : p.nameAr;
                    pushOffer({
                        providerId: p.id, subTypeId: sub.id, groupId: 2,
                        contractMonths: dur.months, nationality: nat.id,
                        titleAr: `${subAr[sub.id]} ${contractLabelAr[dur.months]} - ${natAr[nat.id]} (${tag})`,
                        titleEn: `${subEn[sub.id]} ${dur.nameEn} - ${natEn[nat.id]} (${p.nameEn})`,
                        badgeAr: badge.ar, badgeEn: badge.en,
                        ...pr,
                        views: 80 + Math.floor(seed(nextId + 2) * 1100),
                        favorites: 4 + Math.floor(seed(nextId + 3) * 80),
                        hoursAgo: 1 + Math.floor(seed(nextId + 4) * 24),
                        expiresInHours: [24, 48, 72][Math.floor(seed(nextId + 5) * 3)]
                    });
                });
            });
        });
    });

    // ----- Group 3: Medical (subType × duration × maxWorkers × nationality) -----
    const medicalProviders = providers.filter(p => p.supportsMedical);
    // maxWorkers semantics = "up to N"; buckets spread across the 1–10 counter range
    // so a filter value of 1..8 always has at least one matching offer.
    const WORKER_BUCKETS = [1, 3, 5, 8];
    serviceSubTypes.filter(s => s.groupId === 3).forEach(sub => {
        serviceDetails.medicalDurations.forEach(dur => {
            WORKER_BUCKETS.forEach(maxW => {
                nationalities.forEach(nat => {
                    medicalProviders.forEach(p => {
                        if (!p.isFirstParty && !p.supportedNationalities.includes(nat.id)) return;
                        if (!p.isFirstParty) {
                            const k = seed(p.id * 10000 + sub.id * 1000 + maxW * 100 + dur.id.length * 10 + nat.id.length);
                            if (k < 0.55) return;
                        }
                        const base = MEDICAL_BASE[dur.id] * maxW;
                        const pr = calcPricing(base, p.id, "morning", nat.id, sub.id, p.isFirstParty);
                        const badge = pick(medicalBadges, nextId + 1);
                        const tag = p.isFirstParty ? "بلخدمة" : p.nameAr;
                        pushOffer({
                            providerId: p.id, subTypeId: sub.id, groupId: 3,
                            medicalDuration: dur.id, maxWorkers: maxW, nationality: nat.id,
                            titleAr: `${subAr[sub.id]} ${medDurAr[dur.id]} - حتى ${maxW} ${maxW === 1 ? "عامل" : "عمال"} - ${natAr[nat.id]} (${tag})`,
                            titleEn: `${subEn[sub.id]} ${medDurEn[dur.id]} - up to ${maxW} worker${maxW === 1 ? "" : "s"} - ${natEn[nat.id]} (${p.nameEn})`,
                            badgeAr: badge.ar, badgeEn: badge.en,
                            ...pr,
                            views: 50 + Math.floor(seed(nextId + 2) * 600),
                            favorites: 2 + Math.floor(seed(nextId + 3) * 40),
                            hoursAgo: 1 + Math.floor(seed(nextId + 4) * 20),
                            expiresInHours: [12, 24, 48][Math.floor(seed(nextId + 5) * 3)]
                        });
                    });
                });
            });
        });
    });

    // ----- Group 4: Mediation (one hero lead offer — flow renders a lead form anyway) -----
    nationalities.forEach(nat => {
        pushOffer({
            providerId: 0, subTypeId: 8, groupId: 4,
            nationality: nat.id,
            titleAr: `وساطة توظيف مباشر - ${natAr[nat.id]} - فريق بلخدمة`,
            titleEn: `Direct recruitment mediation - ${natEn[nat.id]} - Belkhedma team`,
            badgeAr: "يتواصل الفريق خلال 24 ساعة",
            badgeEn: "Team contacts you in 24h",
            excPrice: 8261, providerPrice: 9000, vat: 1239,
            finalExcPrice: 9500, finalProviderPrice: 10350,
            views: 120 + Math.floor(seed(nextId + 1) * 400),
            favorites: 6 + Math.floor(seed(nextId + 2) * 30),
            hoursAgo: 3 + Math.floor(seed(nextId + 3) * 20),
            expiresInHours: 72
        });
    });

    // ============================================================
    // Hand-crafted "featured" offers — kept because their titles and
    // badges read better than the generator's templates. They live at
    // low ids (101–401) so `renderOffers()` (slice(0, 5)) surfaces them
    // on the home page. They intentionally overlap the generated set —
    // duplicates are fine for demo purposes.
    // ============================================================
    const featured = [
        { id: 101, providerId: 0, subTypeId: 1, groupId: 1, hours: 4, shift: "morning",  nationality: "filipino",
          titleAr: "تنظيف منزلي 4 ساعات صباحاً - فلبينية - ضمان بلخدمة",
          titleEn: "4h morning home cleaning - Filipino - Belkhedma Guarantee",
          badgeAr: "ضمان الاستبدال + سعر موحد", badgeEn: "Replacement Guarantee + Flat Price",
          excPrice: 174, providerPrice: 190, vat: 26, finalExcPrice: 200, finalProviderPrice: 218,
          views: 980, favorites: 54, hoursAgo: 1, isActive: true, expiresInHours: 24 },
        { id: 102, providerId: 0, subTypeId: 1, groupId: 1, hours: 8, shift: "morning",  nationality: "indonesian",
          titleAr: "تنظيف عميق 8 ساعات - عاملة إندونيسية مدربة",
          titleEn: "Deep cleaning 8h - Trained Indonesian worker",
          badgeAr: "أفضل قيمة - وفّر 18%", badgeEn: "Best Value - Save 18%",
          excPrice: 330, providerPrice: 402, vat: 50, finalExcPrice: 380, finalProviderPrice: 462,
          views: 654, favorites: 38, hoursAgo: 3, isActive: true, expiresInHours: 12 },
        { id: 103, providerId: 0, subTypeId: 2, groupId: 1, hours: 4, shift: "evening",  nationality: "filipino",
          titleAr: "طباخة فلبينية مساءً - 4 ساعات - تحضير وجبة كاملة",
          titleEn: "Filipino cook - Evening 4h - Full meal prep",
          badgeAr: "جديد - تقييم 4.9", badgeEn: "New - 4.9 Rated",
          excPrice: 191, providerPrice: 210, vat: 29, finalExcPrice: 220, finalProviderPrice: 241,
          views: 312, favorites: 22, hoursAgo: 5, isActive: true, expiresInHours: 48 },
        { id: 104, providerId: 2, subTypeId: 1, groupId: 1, hours: 2, shift: "morning",  nationality: "filipino",
          titleAr: "ساعتين تنظيف سريع صباحاً - فلبينية",
          titleEn: "Quick 2h morning cleaning - Filipino",
          badgeAr: "خصم 15% أول حجز", badgeEn: "15% Off First Booking",
          excPrice: 96, providerPrice: 87, vat: 14, finalExcPrice: 110, finalProviderPrice: 100,
          views: 420, favorites: 18, hoursAgo: 2, isActive: true, expiresInHours: 8 },
        { id: 201, providerId: 0, subTypeId: 4, groupId: 2, contractMonths: 3, nationality: "filipino",
          titleAr: "عاملة مقيمة 3 أشهر - فلبينية - سعر بلخدمة",
          titleEn: "Live-in maid 3 months - Filipino - Belkhedma price",
          badgeAr: "شهر إضافي مجاني", badgeEn: "1 Month Free",
          excPrice: 6782, providerPrice: 7300, vat: 1018, finalExcPrice: 7800, finalProviderPrice: 8395,
          views: 842, favorites: 61, hoursAgo: 1, isActive: true, expiresInHours: 72 },
        { id: 202, providerId: 0, subTypeId: 4, groupId: 2, contractMonths: 12, nationality: "indonesian",
          titleAr: "عاملة مقيمة سنة كاملة - إندونيسية",
          titleEn: "Live-in maid 12 months - Indonesian",
          badgeAr: "أفضل سعر سنوي", badgeEn: "Best Yearly Rate",
          excPrice: 21739, providerPrice: 24000, vat: 3261, finalExcPrice: 25000, finalProviderPrice: 27600,
          views: 1210, favorites: 89, hoursAgo: 2, isActive: true, expiresInHours: 72 },
        { id: 301, providerId: 0, subTypeId: 6, groupId: 3, medicalDuration: "daily",   maxWorkers: 3, nationality: "filipino",
          titleAr: "تمريض منزلي يومي - ممرضة فلبينية مرخصة",
          titleEn: "Home nursing daily - Licensed Filipino nurse",
          badgeAr: "مرخصة هيئة التخصصات", badgeEn: "Saudi Commission Licensed",
          excPrice: 565, providerPrice: 626, vat: 85, finalExcPrice: 650, finalProviderPrice: 720,
          views: 374, favorites: 28, hoursAgo: 2, isActive: true, expiresInHours: 24 },
        { id: 302, providerId: 0, subTypeId: 7, groupId: 3, medicalDuration: "hourly",  maxWorkers: 2, nationality: "indonesian",
          titleAr: "رفقة مريض بالساعة - إندونيسية - بلخدمة",
          titleEn: "Hourly patient care - Indonesian - Belkhedma",
          badgeAr: "مرونة بالساعة", badgeEn: "Flexible Hourly",
          excPrice: 74, providerPrice: 83, vat: 11, finalExcPrice: 85, finalProviderPrice: 95,
          views: 219, favorites: 15, hoursAgo: 5, isActive: true, expiresInHours: 12 }
    ];

    // Prepend featured offers so they show up at the top of the home "latest offers" list.
    const allOffers = [...featured, ...offers];

    // ============================================================
    // Expose
    // ============================================================
    window.mockData = {
        providers,
        serviceGroups,
        serviceSubTypes,
        nationalities,
        serviceDetails,
        offers: allOffers,
        banners,
        notifications,
        reviews,
        savedLocations,
        cities,
        searchHistory: []
    };
})();
