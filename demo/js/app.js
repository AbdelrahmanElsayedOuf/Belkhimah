// Belkhedma demo — interactive clickable prototype
// One-pass refinement rewrite: proper view router, persisted orders/locations/notifications,
// unified formatters, no inline styles in generated markup.

// ============================================================
// 1. DATA
// ============================================================
let appData = window.mockData;

// ============================================================
// 2. PERSISTENCE (localStorage)
// ============================================================
const LS = {
    favorites:      'belkhedma_favorites',
    searchHistory:  'belkhedma_search_history',
    orders:         'belkhedma_orders',
    locations:      'belkhedma_locations',
    notifications:  'belkhedma_notifications',
    mediationLeads: 'belkhedma_mediation_leads'
};

const storeGet = (k, fallback) => {
    try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : fallback; }
    catch { return fallback; }
};
const storeSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Favorites
const getFavorites = () => storeGet(LS.favorites, []);
const saveFavorite = (id) => { const f = getFavorites(); if (!f.includes(id)) { f.push(id); storeSet(LS.favorites, f); } };
const removeFavorite = (id) => storeSet(LS.favorites, getFavorites().filter(x => x !== id));
const isFavorite = (id) => getFavorites().includes(id);

// Search history
const getSearchHistory = () => storeGet(LS.searchHistory, []);
const addToSearchHistory = (entry) => {
    const hist = getSearchHistory().filter(h => h.id !== entry.id);
    hist.unshift(entry);
    storeSet(LS.searchHistory, hist.slice(0, 10));
};

// Orders
const getOrders = () => storeGet(LS.orders, []);
const createOrder = (offer, ctx) => {
    const provider = getProviderById(offer.providerId);
    const subType = appData.serviceSubTypes.find(s => s.id === offer.subTypeId);
    const group = appData.serviceGroups.find(g => g.id === offer.groupId);
    const location = getAllSavedLocations().find(l => l.id === (ctx && ctx.locationId)) || null;
    const order = {
        id: Date.now(),
        orderNumber: `BK-${String(Date.now()).slice(-8)}`,
        offerId: offer.id,
        providerId: offer.providerId,
        providerNameAr: provider?.nameAr || 'بلخدمة',
        providerLogo: provider?.logo || 'ب',
        providerLogoColor: provider?.logoColor || 'linear-gradient(135deg,#8B1874,#B50B68)',
        groupId: offer.groupId,
        groupNameAr: group?.nameAr || '',
        subTypeId: offer.subTypeId,
        subTypeNameAr: subType?.nameAr || '',
        serviceTitle: offer.titleAr,
        finalPrice: offer.finalExcPrice,
        nationality: offer.nationality || null,
        hours: offer.hours || null,
        shift: offer.shift || null,
        contractMonths: offer.contractMonths || null,
        medicalDuration: offer.medicalDuration || null,
        maxWorkers: offer.maxWorkers || null,
        locationLabel: location ? `${location.label} — ${location.city}` : null,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    const orders = getOrders();
    orders.unshift(order);
    storeSet(LS.orders, orders);
    return order;
};
const cancelOrder = (id) => {
    const orders = getOrders().map(o => o.id === id ? { ...o, status: 'cancelled' } : o);
    storeSet(LS.orders, orders);
};
const completeOrder = (id) => {
    const orders = getOrders().map(o => o.id === id ? { ...o, status: 'completed' } : o);
    storeSet(LS.orders, orders);
};

// Saved locations (seeded + user-added)
const getSavedLocationsPersisted = () => storeGet(LS.locations, []);
const saveLocationPersisted = (loc) => {
    const locs = getSavedLocationsPersisted();
    locs.push(loc);
    storeSet(LS.locations, locs);
};
const getAllSavedLocations = () => [ ...(appData.savedLocations || []), ...getSavedLocationsPersisted() ];

// Notifications
const getNotifications = () => {
    const stored = storeGet(LS.notifications, null);
    if (stored) return stored;
    storeSet(LS.notifications, appData.notifications || []);
    return appData.notifications || [];
};
const markNotificationRead = (id) => {
    const list = getNotifications().map(n => n.id === id ? { ...n, unread: false } : n);
    storeSet(LS.notifications, list);
};
const markAllNotificationsRead = () => {
    const list = getNotifications().map(n => ({ ...n, unread: false }));
    storeSet(LS.notifications, list);
};
const unreadNotificationCount = () => getNotifications().filter(n => n.unread).length;

// Mediation leads
const getMediationLeads = () => storeGet(LS.mediationLeads, []);
const createMediationLead = (ctx) => {
    const nat = ctx.nationality
        ? (appData.nationalities.find(n => n.id === ctx.nationality)?.nameAr || 'أي جنسية')
        : 'غير محددة';
    const location = getAllSavedLocations().find(l => l.id === ctx.locationId);
    const lead = {
        id: Date.now(),
        leadNumber: `MED-${String(Date.now()).slice(-6)}`,
        subTypeId: ctx.subTypeId,
        nationality: ctx.nationality,
        nationalityAr: nat,
        locationLabel: location ? `${location.label} — ${location.city}` : 'غير محدد',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    const leads = getMediationLeads();
    leads.unshift(lead);
    storeSet(LS.mediationLeads, leads);
    return lead;
};

// ============================================================
// 3. FORMATTERS & ICON LIBRARY
// ============================================================
const formatSAR = (n) => {
    if (n == null || isNaN(n)) return '—';
    return `${Math.round(n).toLocaleString('en-US')} ر.س`;
};

const formatHoursAgo = (hours) => {
    const h = Number(hours) || 0;
    if (h <= 0) return 'الآن';
    if (h === 1) return 'منذ ساعة';
    if (h === 2) return 'منذ ساعتين';
    if (h <= 10) return `منذ ${h} ساعات`;
    return `منذ ${h} ساعة`;
};

const renderStars = (rating) => {
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const hasHalf = (r - full) >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);
    let html = '';
    for (let i = 0; i < full; i++) html += ICONS.starFull;
    if (hasHalf) html += ICONS.starHalf;
    for (let i = 0; i < empty; i++) html += ICONS.starEmpty;
    return html;
};

// Icon library — SVG strings, single source, reused everywhere
const ICONS = {
    starFull:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starHalf:  '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="halfStar" x1="100%" x2="0%"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path fill="url(#halfStar)" stroke="currentColor" stroke-width="1" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    starEmpty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    check:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    heartOutline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    close:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    // Service group icons
    clock:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
    users:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
    medical:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.5 11 9 11s9-5.75 9-11c0-4.97-4.03-9-9-9zm1.5 12h-3v-2h-2v-3h2V6h3v3h2v3h-2v2z"/></svg>',
    handshake:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.5 3.5L18 2l-3.5 3.5-1-1L12 6l1.5 1.5L11 10 9.5 8.5 8 10l1.5 1.5-1.5 1.5L6.5 11.5 5 13l3.5 3.5 1 1L11 16l-1.5-1.5L12 12l1.5 1.5L15 12l-1.5-1.5L15 9l1.5 1.5L18 9l-1.5-1.5L18 6l1.5 1.5L21 6z"/></svg>',
    // Sub-service icons
    spray:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 2v2h2V2h6v4h-6v1h3a3 3 0 0 1 3 3v11H5V10a3 3 0 0 1 3-3h1V2zm2 10h-2v2h2zm0 4h-2v2h2zm4 0h-2v-2h2zm0-4h-2v2h2z"/></svg>',
    pot:        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 9V7h-2V5h-2v2H8V5H6v2H4v2h2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9h2zm-4 10H8V9h8v10z"/></svg>',
    cane:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 3a3 3 0 0 1 6 0h-2a1 1 0 1 0-2 0h6v2h-4v15h-2V5h-4V3z"/></svg>',
    house:      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    baby:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a5 5 0 0 0-5 5c0 2.39 1.68 4.38 3.92 4.88L10 14h4l-.92-2.12A5.01 5.01 0 0 0 17 7a5 5 0 0 0-5-5zm-2 13a5 5 0 0 0-5 5h14a5 5 0 0 0-5-5h-4z"/></svg>',
    stethoscope:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 8a3 3 0 1 0-3 3h-2v4a4 4 0 0 1-8 0V11a5 5 0 0 1-4-5V3h2v3a3 3 0 0 0 6 0V3h2v3a5 5 0 0 1-4 5v4a2 2 0 1 0 4 0v-4h2a5 5 0 0 0 4-5V8h1z"/></svg>',
    heartbeat:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 12h3l2-5 4 10 2-5h7v2h-6l-3 7-4-10-1 3H3z"/></svg>',
    // Navigation / UI
    chevronLeft:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>',
    edit:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    search:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    pin:        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    clockSmall: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/></svg>',
    tag:        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4a2 2 0 0 0-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>',
    message:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>',
    gift:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-5-2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM9 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/></svg>',
    crescent:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 3a9 9 0 1 0 7.5 14 9 9 0 0 1-7.5-14z"/></svg>',
    orders:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
    bell:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
    sparkle:    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5zM19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6zM6 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></svg>',
    shield:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>',
    filter:     '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>',
    star:       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>',
    emptyHeart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
};

const SERVICE_GROUP_ICON = { clock: 'clock', users: 'users', medical: 'medical', handshake: 'handshake' };
const SUB_SERVICE_ICON   = { spray: 'spray', pot: 'pot', cane: 'cane', house: 'house', baby: 'baby', stethoscope: 'stethoscope', heartbeat: 'heartbeat', handshake: 'handshake' };

const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ============================================================
// 4. SHARED LOOKUPS
// ============================================================
const getProviderById  = (id) => appData.providers.find(p => p.id === id);
const getOfferById     = (id) => appData.offers.find(o => o.id === id);
const getSubTypeById   = (id) => appData.serviceSubTypes.find(s => s.id === id);
const getGroupById     = (id) => appData.serviceGroups.find(g => g.id === id);
const getNationalityAr = (id) => appData.nationalities.find(n => n.id === id)?.nameAr || '';

// ============================================================
// 5. STATE
// ============================================================
let searchState = {
    groupId: null, subTypeId: null,
    hours: null, shift: null,
    contractMonths: null,
    nationality: null,
    medicalDuration: null, workerCount: 1,
    locationId: null,
    maxPrice: null,
    selectedProviders: []
};
const resetSearchState = (partial = {}) => {
    searchState = {
        groupId: null, subTypeId: null,
        hours: null, shift: null,
        contractMonths: null,
        nationality: null,
        medicalDuration: null, workerCount: 1,
        locationId: (getAllSavedLocations().find(l => l.isDefault) || getAllSavedLocations()[0])?.id || null,
        maxPrice: null,
        selectedProviders: [],
        ...partial
    };
};

let wizardCurrentStep = 1;
const WIZARD_TOTAL_STEPS = 4;
let lastResults = [];
let resultsFiltersOpen = true;
let currentViewId = 'view-home';
let bannerIndex = 0;
let bannerTimer = null;
let allOffersGroupFilter = null;

// ============================================================
// 6. VIEW ROUTER
// ============================================================
function showView(viewId, ctx) {
    switch (viewId) {
        case 'view-home':            renderHome(); break;
        case 'view-search':          renderSearchOverlay(); break;
        case 'view-results':         renderResults(); break;
        case 'view-favorites':       renderFavorites(); break;
        case 'view-orders':          renderOrders(); break;
        case 'view-order-detail':    renderOrderDetail(ctx); break;
        case 'view-all-offers':      renderAllOffers(); break;
        case 'view-providers-list':  renderProvidersList(); break;
        case 'view-provider-detail': renderProviderDetail(ctx); break;
        case 'view-location-picker': renderLocationPicker(); break;
        case 'view-notifications':   renderNotifications(); break;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');
    currentViewId = viewId;
    window.scrollTo(0, 0);
    updateBottomNavActive();
}

function showTab(tab) {
    const map = { home: 'view-home', offers: 'view-all-offers', orders: 'view-orders', favorites: 'view-favorites', settings: 'view-home' };
    showView(map[tab] || 'view-home');
}

function updateBottomNavActive() {
    const tabByView = {
        'view-home': 'home',
        'view-all-offers': 'offers',
        'view-orders': 'orders',
        'view-order-detail': 'orders',
        'view-favorites': 'favorites'
    };
    const currentTab = tabByView[currentViewId] || null;
    document.querySelectorAll('#bottomNav .nav-item, #bottomNav .nav-home').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === currentTab);
    });
}

function closeBottomSheet() {
    const sheet = document.getElementById('offerSheet');
    const backdrop = document.getElementById('sheetBackdrop');
    if (sheet) { sheet.hidden = true; sheet.innerHTML = ''; }
    if (backdrop) backdrop.remove();
    document.body.classList.remove('sheet-open');
}

// ============================================================
// 7. HOME
// ============================================================
function renderHome() {
    renderBanner();
    renderQuickActions();
    renderCompaniesStrip();
    renderLatestOffers();
    updateNotificationBadge();
}

function renderQuickActions() {
    const wrap = document.getElementById('quickActions');
    if (!wrap) return;
    wrap.innerHTML = appData.serviceGroups.map(g => `
        <button class="quick-action-btn" onclick="startSearch(${g.id})" type="button">
            ${ICONS[SERVICE_GROUP_ICON[g.icon] || 'clock']}
            <span>${escapeHtml(g.nameAr)}</span>
        </button>
    `).join('');
}

function renderCompaniesStrip() {
    const c = document.getElementById('companiesScroll');
    if (!c) return;
    c.innerHTML = appData.providers.map(p => `
        <button class="company-item" onclick="showView('view-provider-detail', { providerId: ${p.id} })" type="button">
            <span class="company-logo">
                <span class="company-logo-inner" style="background: ${p.logoColor}">${escapeHtml(p.logo)}</span>
            </span>
            <span class="company-name">${escapeHtml(p.nameAr)}</span>
            <span class="company-subtitle">${escapeHtml(p.nameEn)}</span>
            <span class="company-rating">${renderStars(p.rating)}</span>
        </button>
    `).join('');
}

function renderLatestOffers() {
    const container = document.getElementById('offersList');
    if (!container) return;
    const featured = appData.offers.filter(o => o.id >= 100 && o.id < 1000).slice(0, 5);
    container.innerHTML = featured.map(renderTicketCard).join('');
}

function renderTicketCard(offer) {
    const provider = getProviderById(offer.providerId);
    const fav = isFavorite(offer.id);
    const providerAccent = provider?.isFirstParty
        ? `<span class="ticket-provider">${escapeHtml(provider.nameAr)}<span class="excp-badge" style="margin:0;">مباشر</span></span>`
        : `<span class="ticket-provider">${escapeHtml(provider?.nameAr || '')}<span class="ticket-provider-rating">${ICONS.starFull}${(provider?.rating ?? 0).toFixed(1)}</span></span>`;

    return `
        <article class="ticket-card" onclick="openOfferSheet(${offer.id})">
            <span class="notch notch-top" style="right: 30%;"></span>
            <span class="notch notch-bottom" style="right: 30%;"></span>
            <div class="ticket-logo-section">
                <div class="ticket-logo-circle">
                    <div class="ticket-logo-inner" style="background: ${provider?.logoColor || 'var(--primary)'}">${escapeHtml(provider?.logo || 'ب')}</div>
                </div>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-content ticket-content-v2" style="position:relative;">
                ${providerAccent}
                <div class="ticket-title">${escapeHtml(offer.titleAr)}</div>
                <div class="ticket-badge">${escapeHtml(offer.badgeAr)}</div>
                <div class="ticket-price-row">
                    <div>
                        <span class="ticket-price-prefix">من</span>
                        <span class="ticket-price">${formatSAR(offer.finalExcPrice)}</span>
                    </div>
                    <span class="ticket-time">${ICONS.clockSmall}${formatHoursAgo(offer.hoursAgo)}</span>
                </div>
                <button class="ticket-heart ${fav ? 'liked' : ''}"
                        data-heart-offer="${offer.id}"
                        style="position:absolute;top:6px;left:6px;"
                        onclick="event.stopPropagation(); toggleFavorite(${offer.id})"
                        aria-label="${fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}"
                        type="button">
                    ${fav ? ICONS.heartFilled : ICONS.heartOutline}
                </button>
            </div>
        </article>
    `;
}

// ============================================================
// 8. BANNER CAROUSEL
// ============================================================
function renderBanner() {
    const carousel = document.getElementById('bannerCarousel');
    const dots = document.getElementById('bannerDots');
    if (!carousel || !dots) return;
    const banners = (appData.banners || []).filter(b => b.isActive);
    if (!banners.length) return;

    carousel.innerHTML = banners.map((b, i) => `
        <div class="banner-slide ${i === 0 ? 'active' : ''}" data-banner-idx="${i}"
             style="background:${b.backgroundColor};${i === 0 ? '' : 'display:none;'}">
            <div class="banner-text">
                <h3>${escapeHtml(b.titleAr)}</h3>
                <p>${escapeHtml(b.descriptionAr)}</p>
                <button class="banner-btn" onclick="triggerBannerCta('${b.ctaAction}')" type="button">${escapeHtml(b.ctaTextAr)}</button>
            </div>
            <div class="banner-deco"></div>
            <div class="banner-icon-box">${ICONS[b.iconKey] || ICONS.sparkle}</div>
        </div>
    `).join('');

    dots.innerHTML = banners.map((_, i) => `
        <button class="dot ${i === 0 ? 'active' : ''}" data-dot-idx="${i}" onclick="gotoBanner(${i})" aria-label="بنر ${i+1}" type="button"></button>
    `).join('');

    bannerIndex = 0;
    startBannerTimer();
}

function gotoBanner(i) {
    const banners = (appData.banners || []).filter(b => b.isActive);
    if (!banners.length) return;
    bannerIndex = ((i % banners.length) + banners.length) % banners.length;
    document.querySelectorAll('#bannerCarousel .banner-slide').forEach((slide, idx) => {
        slide.classList.toggle('active', idx === bannerIndex);
        slide.style.display = idx === bannerIndex ? 'flex' : 'none';
    });
    document.querySelectorAll('#bannerDots .dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === bannerIndex);
    });
}

function startBannerTimer() {
    clearInterval(bannerTimer);
    const banners = (appData.banners || []).filter(b => b.isActive);
    if (banners.length < 2) return;
    bannerTimer = setInterval(() => { gotoBanner(bannerIndex + 1); }, 5000);
}

function triggerBannerCta(action) {
    if (!action) return;
    if (action === 'showAllOffers') { showView('view-all-offers'); return; }
    if (action.startsWith('startSearch:')) { startSearch(Number(action.split(':')[1])); return; }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    const n = unreadNotificationCount();
    if (n <= 0) { badge.hidden = true; badge.textContent = ''; return; }
    badge.hidden = false;
    badge.textContent = n > 9 ? '9+' : String(n);
}

// ============================================================
// 9. WIZARD
// ============================================================
function startSearch(groupId) {
    resetSearchState({ groupId: groupId || null });
    wizardCurrentStep = groupId ? 2 : 1;
    showView('view-search-wizard');
    updateWizardUI();
}

function renderWizardStep1() {
    const list = document.getElementById('serviceGroupList');
    if (!list) return;
    list.innerHTML = appData.serviceGroups.map(g => `
        <button type="button"
                class="service-card ${searchState.groupId === g.id ? 'selected' : ''}"
                onclick="selectServiceGroup(${g.id})"
                aria-pressed="${searchState.groupId === g.id}">
            <span class="service-card-icon">${ICONS[SERVICE_GROUP_ICON[g.icon] || 'clock']}</span>
            <span class="service-card-text">
                <span class="service-card-name">${escapeHtml(g.nameAr)}</span>
                <span class="service-card-subtitle">${escapeHtml(g.nameEn)}</span>
            </span>
            <span class="service-card-chevron">${ICONS.chevronRight}</span>
        </button>
    `).join('');
}

function selectServiceGroup(groupId) {
    searchState.groupId = groupId;
    searchState.subTypeId = null;
    searchState.hours = null; searchState.shift = null;
    searchState.contractMonths = null; searchState.medicalDuration = null;
    wizardCurrentStep = 2;
    updateWizardUI();
}

function renderWizardStep2() {
    const list = document.getElementById('subServiceList');
    const hint = document.getElementById('subServiceHint');
    if (!list) return;
    const group = getGroupById(searchState.groupId);
    if (!group) { list.innerHTML = ''; return; }
    if (hint) hint.textContent = `الخدمات المتاحة ضمن "${group.nameAr}"`;

    const subs = appData.serviceSubTypes.filter(s => s.groupId === searchState.groupId);
    list.innerHTML = subs.map(s => `
        <button type="button"
                class="service-card ${searchState.subTypeId === s.id ? 'selected' : ''}"
                onclick="selectSubService(${s.id})"
                aria-pressed="${searchState.subTypeId === s.id}">
            <span class="service-card-icon">${ICONS[SUB_SERVICE_ICON[s.icon] || SERVICE_GROUP_ICON[group.icon]]}</span>
            <span class="service-card-text">
                <span class="service-card-name">${escapeHtml(s.nameAr)}</span>
                <span class="service-card-subtitle">${escapeHtml(s.nameEn)}</span>
            </span>
            <span class="service-card-chevron">${ICONS.chevronRight}</span>
        </button>
    `).join('');
}

function selectSubService(subTypeId) {
    searchState.subTypeId = subTypeId;
    wizardCurrentStep = 3;
    updateWizardUI();
}

function renderWizardStep3() {
    const c = document.getElementById('dynamicDetails');
    const hint = document.getElementById('detailsHint');
    if (!c) return;
    const group = getGroupById(searchState.groupId);
    if (!group) { c.innerHTML = ''; return; }

    const details = appData.serviceDetails || {};
    const nats = appData.nationalities || [];

    const chipGroup = (label, field, options) => `
        <div class="detail-section" data-section="${field}">
            <div class="results-filter-header">
                <span class="detail-label" style="margin:0;">${escapeHtml(label)}</span>
            </div>
            <div class="chip-group">
                ${options.map(opt => {
                    const sel = String(searchState[field]) === String(opt.value);
                    const arg = typeof opt.value === 'number' ? opt.value : `'${opt.value}'`;
                    return `<button type="button"
                            class="chip ${sel ? 'selected' : ''}"
                            data-field="${field}" data-value="${escapeHtml(String(opt.value))}"
                            onclick="setWizardChip('${field}', ${arg})">${escapeHtml(opt.label)}</button>`;
                }).join('')}
                <button type="button"
                        class="chip chip-all ${searchState[field] === 'any' ? 'selected' : ''}"
                        data-field="${field}" data-value="any"
                        onclick="setWizardChip('${field}', 'any')">الكل</button>
            </div>
        </div>
    `;

    const counter = (label, field, min, max) => `
        <div class="detail-section" data-section="${field}">
            <span class="detail-label">${escapeHtml(label)}</span>
            <div class="counter-row">
                <button type="button" class="counter-btn" onclick="adjustWorkerCount(-1)" aria-label="تقليل"
                    ${searchState[field] <= min ? 'disabled' : ''}>−</button>
                <span class="counter-value" id="workerCountValue">${searchState[field] || min}</span>
                <button type="button" class="counter-btn" onclick="adjustWorkerCount(1)" aria-label="زيادة"
                    ${searchState[field] >= max ? 'disabled' : ''}>+</button>
            </div>
        </div>
    `;

    let html = '';
    if (group.id === 1) {
        hint && (hint.textContent = 'اختر عدد الساعات والوردية والجنسية المفضلة');
        html += chipGroup('عدد الساعات', 'hours', (details.hourlyHours || []).map(h => ({ value: h, label: `${h} ساعات` })));
        html += chipGroup('الوردية', 'shift', (details.shifts || []).map(s => ({ value: s.id, label: s.nameAr })));
        html += chipGroup('الجنسية المفضلة', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    } else if (group.id === 2) {
        hint && (hint.textContent = 'اختر مدة العقد والجنسية المفضلة');
        html += chipGroup('مدة العقد', 'contractMonths', (details.contractDurations || []).map(d => ({ value: d.months, label: d.nameAr })));
        html += chipGroup('الجنسية المفضلة', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    } else if (group.id === 3) {
        hint && (hint.textContent = 'اختر نوع المدة وعدد العمال المطلوبين');
        html += chipGroup('نوع المدة', 'medicalDuration', (details.medicalDurations || []).map(d => ({ value: d.id, label: d.nameAr })));
        html += counter('عدد العمال', 'workerCount', 1, 8);
        html += chipGroup('الجنسية المفضلة', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    } else if (group.id === 4) {
        hint && (hint.textContent = 'يتواصل فريقنا معكِ لتأكيد التفاصيل وعرض الخيارات');
        html += chipGroup('الجنسية المفضلة (اختياري)', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
        html += `<div class="detail-section" style="background:var(--primary-surface);border-color:rgba(139,24,116,0.15)"><p style="font-size:12.5px;color:var(--text-secondary);line-height:1.7;margin:0;">خدمة الوساطة تتيح لك الاستعانة بفريقنا للعثور على العاملة المناسبة بعد التواصل المباشر معك. يرجى المتابعة لتحديد موقع الخدمة.</p></div>`;
    }
    c.innerHTML = html;
}

function setWizardChip(field, value) {
    searchState[field] = value;
    const section = document.querySelector(`.detail-section[data-section="${field}"]`);
    if (section) {
        section.querySelectorAll('.chip').forEach(c => c.classList.toggle('selected', String(c.dataset.value) === String(value)));
        const clearBtn = section.querySelector('.results-filter-clear');
        if (clearBtn) clearBtn.hidden = false;
    }
    updateWizardChips();
    updateWizardNextButton();
}

function clearWizardField(field) {
    searchState[field] = null;
    const section = document.querySelector(`.detail-section[data-section="${field}"]`);
    if (section) {
        section.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        const clearBtn = section.querySelector('.results-filter-clear');
        if (clearBtn) clearBtn.hidden = true;
    }
    updateWizardChips();
    updateWizardNextButton();
}

function adjustWorkerCount(delta) {
    const next = (searchState.workerCount || 1) + delta;
    if (next < 1 || next > 8) return;
    searchState.workerCount = next;
    const el = document.getElementById('workerCountValue');
    if (el) el.textContent = next;
    const section = document.querySelector('.detail-section[data-section="workerCount"]');
    if (section) {
        const btns = section.querySelectorAll('.counter-btn');
        if (btns[0]) btns[0].disabled = next <= 1;
        if (btns[1]) btns[1].disabled = next >= 8;
    }
    updateWizardNextButton();
}

function renderWizardStep4() {
    const list = document.getElementById('savedLocationsList');
    if (!list) return;
    const locs = getAllSavedLocations();
    if (!locs.length) {
        list.innerHTML = `<div class="empty-state" style="padding:24px 12px;"><p class="empty-state-body">لا توجد مواقع محفوظة بعد</p><button class="empty-state-cta" onclick="showAddLocationForm()">+ إضافة موقع</button></div>`;
    } else {
        list.innerHTML = locs.map(l => `
            <button type="button" class="location-card ${searchState.locationId === l.id ? 'selected' : ''}"
                    onclick="selectLocation(${l.id})" aria-pressed="${searchState.locationId === l.id}">
                <span class="location-card-icon">${ICONS.pin}</span>
                <span class="location-card-body">
                    <span class="location-card-label">
                        ${escapeHtml(l.label)}
                        ${l.isDefault ? '<span class="location-card-default">افتراضي</span>' : ''}
                    </span>
                    <span class="location-card-address">${escapeHtml(l.address)}</span>
                </span>
            </button>
        `).join('');
    }

    const citySelect = document.getElementById('newLocCity');
    if (citySelect && !citySelect.dataset.populated) {
        citySelect.innerHTML = (appData.cities || []).map(c => `<option value="${c.id}">${escapeHtml(c.nameAr)}</option>`).join('');
        citySelect.dataset.populated = '1';
    }

    const mapLabel = document.getElementById('mapLabel');
    const selected = locs.find(l => l.id === searchState.locationId);
    if (mapLabel) mapLabel.textContent = selected ? `${selected.city} — ${selected.district}` : 'اسحب الدبوس لتحديد الموقع';
}

function selectLocation(id) {
    searchState.locationId = id;
    renderWizardStep4();
    updateWizardNextButton();
}

function showAddLocationForm() {
    const form = document.getElementById('locationAddForm');
    if (!form) return;
    form.hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('newLocLabel')?.focus();
}

function cancelAddLocation() {
    const form = document.getElementById('locationAddForm');
    if (form) form.hidden = true;
    ['newLocLabel', 'newLocDistrict', 'newLocAddress'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
}

function saveNewLocation() {
    const label = document.getElementById('newLocLabel').value.trim();
    const citySelect = document.getElementById('newLocCity');
    const district = document.getElementById('newLocDistrict').value.trim();
    const address = document.getElementById('newLocAddress').value.trim();
    if (!label || !district || !address) { alert('يرجى إكمال جميع الحقول'); return; }
    const cityObj = (appData.cities || []).find(c => c.id === citySelect.value);
    const newLoc = {
        id: Date.now(),
        label, city: cityObj ? cityObj.nameAr : citySelect.value,
        district,
        address: `${address}، ${district}، ${cityObj ? cityObj.nameAr : ''}`,
        isDefault: false
    };
    saveLocationPersisted(newLoc);
    searchState.locationId = newLoc.id;
    cancelAddLocation();
    renderWizardStep4();
    updateWizardNextButton();
}

function wizardBack() {
    if (wizardCurrentStep > 1) { wizardCurrentStep--; updateWizardUI(); }
    else showView('view-home');
}

function wizardNext() {
    if (!isCurrentStepValid()) return;
    if (wizardCurrentStep < WIZARD_TOTAL_STEPS) { wizardCurrentStep++; updateWizardUI(); }
    else performSearch();
}

function isCurrentStepValid() {
    switch (wizardCurrentStep) {
        case 1: return searchState.groupId != null;
        case 2: return searchState.subTypeId != null;
        case 3: return isStep3Valid();
        case 4: return searchState.locationId != null;
        default: return false;
    }
}

function isStep3Valid() {
    const g = getGroupById(searchState.groupId);
    if (!g) return false;
    if (g.id === 1) return !!(searchState.hours && searchState.shift && searchState.nationality);
    if (g.id === 2) return !!(searchState.contractMonths && searchState.nationality);
    if (g.id === 3) return !!(searchState.medicalDuration && searchState.workerCount >= 1);
    if (g.id === 4) return true;
    return false;
}

function updateWizardUI() {
    document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`wizard-panel-${wizardCurrentStep}`)?.classList.add('active');

    document.querySelectorAll('.step-dot').forEach((dot, idx) => {
        const n = idx + 1;
        dot.classList.remove('active', 'completed');
        if (n < wizardCurrentStep) dot.classList.add('completed');
        else if (n === wizardCurrentStep) dot.classList.add('active');
    });
    document.querySelectorAll('.step-connector').forEach((c, idx) => {
        c.classList.toggle('filled', idx < wizardCurrentStep - 1);
    });

    if (wizardCurrentStep === 1) renderWizardStep1();
    if (wizardCurrentStep === 2) renderWizardStep2();
    if (wizardCurrentStep === 3) renderWizardStep3();
    if (wizardCurrentStep === 4) renderWizardStep4();

    updateWizardChips();
    updateWizardNextButton();

    const title = document.getElementById('wizardTitle');
    if (title) title.textContent = ['نوع الخدمة','الخدمة الفرعية','تفاصيل الطلب','موقع الخدمة'][wizardCurrentStep - 1] || 'البحث عن خدمة';
}

function updateWizardNextButton() {
    const btn = document.getElementById('wizardNextBtn');
    const label = document.getElementById('wizardNextLabel');
    if (!btn || !label) return;
    const last = wizardCurrentStep === WIZARD_TOTAL_STEPS;
    label.textContent = last ? (searchState.groupId === 4 ? 'إرسال الطلب' : 'عرض النتائج') : 'التالي';
    btn.disabled = !isCurrentStepValid();
}

function updateWizardChips() {
    const c = document.getElementById('wizardChips');
    if (!c) return;
    const g = getGroupById(searchState.groupId);
    const sub = getSubTypeById(searchState.subTypeId);
    const chips = [];
    if (g && wizardCurrentStep > 1) chips.push({ text: g.nameAr, primary: true });
    if (sub && wizardCurrentStep > 2) chips.push({ text: sub.nameAr });
    if (wizardCurrentStep > 3) {
        if (searchState.hours) chips.push({ text: searchState.hours === 'any' ? 'أي ساعات' : `${searchState.hours} ساعات` });
        if (searchState.shift) chips.push({ text: searchState.shift === 'any' ? 'أي وردية' : (searchState.shift === 'morning' ? 'صباحاً' : 'مساءً') });
        if (searchState.contractMonths) {
            if (searchState.contractMonths === 'any') chips.push({ text: 'أي مدة' });
            else {
                const d = (appData.serviceDetails?.contractDurations || []).find(x => x.months === searchState.contractMonths);
                if (d) chips.push({ text: d.nameAr });
            }
        }
        if (searchState.medicalDuration) {
            if (searchState.medicalDuration === 'any') chips.push({ text: 'أي مدة' });
            else {
                const d = (appData.serviceDetails?.medicalDurations || []).find(x => x.id === searchState.medicalDuration);
                if (d) chips.push({ text: d.nameAr });
            }
        }
        if (g && g.id === 3 && searchState.workerCount > 1) chips.push({ text: `${searchState.workerCount} عمال` });
        if (searchState.nationality) chips.push({ text: searchState.nationality === 'any' ? 'أي جنسية' : getNationalityAr(searchState.nationality) });
    }
    c.innerHTML = chips.map(x => `<span class="wizard-chip" style="${x.primary ? '' : 'background:var(--bg);color:var(--primary);border:1px solid var(--primary-bg-strong);'}">${escapeHtml(x.text)}</span>`).join('');
}

// ============================================================
// 10. SEARCH (offers → results)
// ============================================================
function performSearch() {
    if (searchState.groupId === 4) { submitMediationLead(); return; }
    addToSearchHistory({
        id: Date.now(),
        groupId: searchState.groupId,
        subTypeId: searchState.subTypeId,
        timestamp: new Date().toISOString()
    });
    showView('view-results');
}

function searchOffers() {
    const g = getGroupById(searchState.groupId);
    if (!g) return [];
    // 'any' sentinel = explicit "all" selection = skip the filter for this field
    const hasFilter = (v) => v && v !== 'any';
    const matching = appData.offers.filter(o => {
        if (!o.isActive) return false;
        if (o.groupId !== searchState.groupId) return false;
        if (searchState.subTypeId && o.subTypeId !== searchState.subTypeId) return false;

        if (g.id === 1) {
            if (hasFilter(searchState.hours) && o.hours !== searchState.hours) return false;
            if (hasFilter(searchState.shift) && o.shift && o.shift !== searchState.shift) return false;
        }
        if (g.id === 2) {
            if (hasFilter(searchState.contractMonths) && o.contractMonths !== searchState.contractMonths) return false;
        }
        if (g.id === 3) {
            if (hasFilter(searchState.medicalDuration) && o.medicalDuration !== searchState.medicalDuration) return false;
            if (searchState.workerCount && o.maxWorkers && o.maxWorkers < searchState.workerCount) return false;
        }
        if (hasFilter(searchState.nationality) && o.nationality && o.nationality !== searchState.nationality) return false;
        if (searchState.maxPrice && o.finalExcPrice > searchState.maxPrice) return false;
        if (searchState.selectedProviders.length && !searchState.selectedProviders.includes(o.providerId)) return false;
        return true;
    });

    matching.sort((a, b) => {
        const pa = getProviderById(a.providerId), pb = getProviderById(b.providerId);
        const aFP = pa?.isFirstParty ? 0 : 1, bFP = pb?.isFirstParty ? 0 : 1;
        if (aFP !== bFP) return aFP - bFP;
        const aSp = pa?.isSponsored ? pa.sponsoredTier : 999, bSp = pb?.isSponsored ? pb.sponsoredTier : 999;
        if (aSp !== bSp) return aSp - bSp;
        const aAv = pa?.availability || 0, bAv = pb?.availability || 0;
        if (aAv !== bAv) return bAv - aAv;
        return (pb?.rating || 0) - (pa?.rating || 0);
    });
    return matching;
}

// ============================================================
// 11. RESULTS VIEW
// ============================================================
function renderResults() {
    const v = document.getElementById('view-results');
    if (!v) return;
    const results = searchOffers();
    lastResults = results;
    const group = getGroupById(searchState.groupId);
    const sub = getSubTypeById(searchState.subTypeId);

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="goBackToWizardStep(4)" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">نتائج البحث</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="results-context">
                <span class="results-context-title">الخدمة المختارة</span>
                <div class="results-context-row">
                    <span class="results-context-label">نوع الخدمة</span>
                    <span class="results-context-value">${escapeHtml(group?.nameAr || '—')}</span>
                    <button class="results-context-change-btn" onclick="goBackToWizardStep(1)">${ICONS.edit} تغيير</button>
                </div>
                <div class="results-context-row">
                    <span class="results-context-label">الخدمة الفرعية</span>
                    <span class="results-context-value">${escapeHtml(sub?.nameAr || '—')}</span>
                    <button class="results-context-change-btn" onclick="goBackToWizardStep(2)">${ICONS.edit} تغيير</button>
                </div>
            </div>

            <div class="results-filters-card ${resultsFiltersOpen ? 'open' : ''}" id="resultsFiltersCard">
                <button type="button" class="results-filters-toggle" onclick="toggleResultsFilters()"
                        aria-expanded="${resultsFiltersOpen}">
                    <span class="results-filters-toggle-label">${ICONS.filter} تخصيص النتائج</span>
                    <span class="results-filters-count" id="resultsFiltersCount">${results.length} نتيجة</span>
                    <span class="results-filters-toggle-icon">${ICONS.chevronRight}</span>
                </button>
                <div class="results-filters-body">
                    <div id="resultsFiltersBodyInner">${renderResultsFiltersBody()}</div>
                    <div class="results-filter-actions">
                        <button type="button" class="results-filter-reset-all" onclick="resetResultsFilters()">إعادة تعيين الفلاتر</button>
                    </div>
                </div>
            </div>

            <div id="resultsList">${renderResultsList(results)}</div>
        </div>
    `;
}

function renderResultsFiltersBody() {
    const g = getGroupById(searchState.groupId);
    if (!g) return '';
    const details = appData.serviceDetails || {};
    const nats = appData.nationalities || [];
    let html = '';
    if (g.id === 1) {
        html += renderFilterChipSection('عدد الساعات', 'hours', (details.hourlyHours || []).map(h => ({ value: h, label: `${h} ساعات` })));
        html += renderFilterChipSection('الوردية', 'shift', (details.shifts || []).map(s => ({ value: s.id, label: s.nameAr })));
        html += renderFilterChipSection('الجنسية', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    } else if (g.id === 2) {
        html += renderFilterChipSection('مدة العقد', 'contractMonths', (details.contractDurations || []).map(d => ({ value: d.months, label: d.nameAr })));
        html += renderFilterChipSection('الجنسية', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    } else if (g.id === 3) {
        html += renderFilterChipSection('نوع المدة', 'medicalDuration', (details.medicalDurations || []).map(d => ({ value: d.id, label: d.nameAr })));
        html += renderFilterWorkerCountSection();
        html += renderFilterChipSection('الجنسية', 'nationality', nats.map(n => ({ value: n.id, label: n.nameAr })));
    }
    return html;
}

function renderFilterChipSection(label, field, options) {
    const current = searchState[field];
    const isSet = current !== null && current !== undefined && current !== '';
    return `
        <div class="results-filter-section" data-filter-section="${field}">
            <div class="results-filter-header">
                <span class="results-filter-label">${escapeHtml(label)}</span>
                <button type="button" class="results-filter-clear" onclick="clearResultsFilter('${field}')" ${isSet ? '' : 'hidden'}>مسح</button>
            </div>
            <div class="chip-group">
                ${options.map(opt => {
                    const arg = typeof opt.value === 'number' ? opt.value : `'${opt.value}'`;
                    const sel = String(current) === String(opt.value);
                    return `<button type="button" class="chip ${sel ? 'selected' : ''}"
                            data-filter-field="${field}" data-filter-value="${escapeHtml(String(opt.value))}"
                            onclick="setResultsFilter('${field}', ${arg})">${escapeHtml(opt.label)}</button>`;
                }).join('')}
                <button type="button" class="chip chip-all ${current === 'any' ? 'selected' : ''}"
                        data-filter-field="${field}" data-filter-value="any"
                        onclick="setResultsFilter('${field}', 'any')">الكل</button>
            </div>
        </div>
    `;
}

function renderFilterWorkerCountSection() {
    const v = searchState.workerCount || 1;
    return `
        <div class="results-filter-section" data-filter-section="workerCount">
            <div class="results-filter-header"><span class="results-filter-label">عدد العمال</span></div>
            <div class="counter-row">
                <button type="button" class="counter-btn" onclick="adjustResultsWorkerCount(-1)" ${v <= 1 ? 'disabled' : ''}>−</button>
                <span class="counter-value" id="resultsWorkerCountValue">${v}</span>
                <button type="button" class="counter-btn" onclick="adjustResultsWorkerCount(1)" ${v >= 8 ? 'disabled' : ''}>+</button>
            </div>
        </div>
    `;
}

function setResultsFilter(field, value) {
    searchState[field] = value;
    const section = document.querySelector(`.results-filter-section[data-filter-section="${field}"]`);
    if (section) {
        section.querySelectorAll('.chip').forEach(c => c.classList.toggle('selected', String(c.dataset.filterValue) === String(value)));
        const clearBtn = section.querySelector('.results-filter-clear');
        if (clearBtn) clearBtn.hidden = false;
    }
    refreshResultsList();
}

function clearResultsFilter(field) {
    searchState[field] = (field === 'workerCount') ? 1 : null;
    const section = document.querySelector(`.results-filter-section[data-filter-section="${field}"]`);
    if (section) {
        section.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        const clearBtn = section.querySelector('.results-filter-clear');
        if (clearBtn) clearBtn.hidden = true;
    }
    refreshResultsList();
}

function resetResultsFilters() {
    const g = getGroupById(searchState.groupId);
    if (!g) return;
    if (g.id === 1) { searchState.hours = null; searchState.shift = null; searchState.nationality = null; }
    else if (g.id === 2) { searchState.contractMonths = null; searchState.nationality = null; }
    else if (g.id === 3) { searchState.medicalDuration = null; searchState.workerCount = 1; searchState.nationality = null; }
    const inner = document.getElementById('resultsFiltersBodyInner');
    if (inner) inner.innerHTML = renderResultsFiltersBody();
    refreshResultsList();
}

function adjustResultsWorkerCount(delta) {
    const next = (searchState.workerCount || 1) + delta;
    if (next < 1 || next > 8) return;
    searchState.workerCount = next;
    const el = document.getElementById('resultsWorkerCountValue');
    if (el) el.textContent = next;
    const section = document.querySelector('.results-filter-section[data-filter-section="workerCount"]');
    if (section) {
        const btns = section.querySelectorAll('.counter-btn');
        if (btns[0]) btns[0].disabled = next <= 1;
        if (btns[1]) btns[1].disabled = next >= 8;
    }
    refreshResultsList();
}

function toggleResultsFilters() {
    resultsFiltersOpen = !resultsFiltersOpen;
    const card = document.getElementById('resultsFiltersCard');
    if (card) card.classList.toggle('open', resultsFiltersOpen);
}

function refreshResultsList() {
    const results = searchOffers();
    lastResults = results;
    const list = document.getElementById('resultsList');
    if (list) list.innerHTML = renderResultsList(results);
    const count = document.getElementById('resultsFiltersCount');
    if (count) count.textContent = `${results.length} نتيجة`;
}

function goBackToWizardStep(step) {
    wizardCurrentStep = Math.max(1, Math.min(WIZARD_TOTAL_STEPS, step));
    showView('view-search-wizard');
    updateWizardUI();
}

function renderResultsList(offers) {
    if (!offers || !offers.length) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${ICONS.search}</div>
                <h3 class="empty-state-title">لا توجد نتائج مطابقة</h3>
                <p class="empty-state-body">جرّب تعديل الفلاتر أو تغيير نوع الخدمة</p>
                <button class="empty-state-cta" onclick="resetResultsFilters()">إعادة تعيين الفلاتر</button>
            </div>`;
    }
    return `<div class="results-list">${offers.map(renderOfferResultCard).join('')}</div>`;
}

function renderOfferResultCard(offer) {
    const p = getProviderById(offer.providerId);
    if (!p) return '';
    const isExcp = p.isFirstParty === true;
    const savings = Math.max(0, (offer.finalProviderPrice || 0) - (offer.finalExcPrice || 0));
    const savingsPct = offer.finalProviderPrice > 0 ? Math.round((savings / offer.finalProviderPrice) * 100) : 0;
    const availClass = p.availability >= 70 ? 'high' : p.availability >= 50 ? 'medium' : 'low';
    const availText = p.availability >= 70 ? 'متوفر بوفرة' : p.availability >= 50 ? 'متوفر' : 'محدود';

    const chips = [];
    if (offer.hours) chips.push(`${offer.hours} ساعات`);
    if (offer.shift) chips.push(offer.shift === 'morning' ? 'صباحاً' : 'مساءً');
    if (offer.contractMonths) {
        const d = appData.serviceDetails?.contractDurations?.find(x => x.months === offer.contractMonths);
        chips.push(d?.nameAr || `${offer.contractMonths} شهر`);
    }
    if (offer.medicalDuration) {
        const d = appData.serviceDetails?.medicalDurations?.find(x => x.id === offer.medicalDuration);
        chips.push(d?.nameAr || offer.medicalDuration);
    }
    if (offer.maxWorkers && offer.maxWorkers > 1) chips.push(`حتى ${offer.maxWorkers} عمال`);
    if (offer.nationality) chips.push(getNationalityAr(offer.nationality));

    return `
        <article class="result-card ${isExcp ? 'result-card-excp' : ''}" onclick="openOfferSheet(${offer.id})">
            <div class="result-header">
                <div class="result-provider-logo" style="background: ${p.logoColor}; color:#fff; font-weight:700; font-size:18px;">${escapeHtml(p.logo)}</div>
                <div class="result-provider-info">
                    <div class="result-provider-name">
                        ${isExcp ? `<span class="excp-badge">${ICONS.check}مباشر عبر بلخدمة</span>` : (p.isSponsored ? '<span class="sponsored-badge">إعلان ممول</span>' : '')}
                        ${escapeHtml(p.nameAr)}
                    </div>
                    <div class="result-provider-meta">
                        <div class="result-rating">
                            ${renderStars(p.rating)}
                            <span style="margin-inline-start:4px;">${p.rating}</span>
                            <span style="margin-inline-start:6px;color:var(--text-hint);">(${p.reviews})</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="result-offer-title">${escapeHtml(offer.titleAr)}</div>
            <div class="result-badge-row"><span class="result-offer-badge">${escapeHtml(offer.badgeAr)}</span></div>

            ${chips.length ? `<div class="result-attr-chips">${chips.map(c => `<span class="result-attr-chip">${escapeHtml(c)}</span>`).join('')}</div>` : ''}

            <div class="offer-detail-price-block" style="margin-top:0;">
                <div class="offer-detail-price-label">سعر بلخدمة</div>
                <div class="offer-detail-price-main">
                    <span class="offer-detail-price-value">${formatSAR(offer.finalExcPrice).replace(' ر.س','')}</span>
                    <span class="offer-detail-price-unit">ر.س · شامل الضريبة</span>
                </div>
                <div class="offer-detail-price-compare">
                    بدلاً من <del>${formatSAR(offer.finalProviderPrice)}</del> ${savings > 0 ? `<strong>وفّر ${savingsPct}% (${formatSAR(savings)})</strong>` : ''}
                </div>
            </div>

            <div class="result-card-footer">
                <span class="result-availability-foot ${availClass}">${p.availability}% · ${availText}</span>
                ${savings > 0 ? `<span class="savings-pill">${ICONS.shield}<strong>${savingsPct}%</strong></span>` : ''}
            </div>
        </article>
    `;
}

// ============================================================
// 12. OFFER DETAIL — BOTTOM SHEET
// ============================================================
function openOfferSheet(offerId) {
    const offer = getOfferById(offerId);
    if (!offer) return;
    const sheet = document.getElementById('offerSheet');
    if (!sheet) return;
    renderOfferSheet(offer);
    let backdrop = document.getElementById('sheetBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sheetBackdrop';
        backdrop.className = 'bottom-sheet-backdrop';
        backdrop.onclick = closeBottomSheet;
        document.body.appendChild(backdrop);
    }
    sheet.hidden = false;
    document.body.classList.add('sheet-open');
}

function renderOfferSheet(offer) {
    const sheet = document.getElementById('offerSheet');
    if (!sheet) return;
    const p = getProviderById(offer.providerId);
    const sub = getSubTypeById(offer.subTypeId);
    const group = getGroupById(offer.groupId);
    const fav = isFavorite(offer.id);
    const savings = Math.max(0, (offer.finalProviderPrice || 0) - (offer.finalExcPrice || 0));
    const savingsPct = offer.finalProviderPrice > 0 ? Math.round((savings / offer.finalProviderPrice) * 100) : 0;

    sheet.innerHTML = `
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-body">
            <div class="bottom-sheet-header">
                <h3 class="bottom-sheet-title">تفاصيل العرض</h3>
                <div class="bottom-sheet-actions">
                    <button class="sheet-icon-btn ${fav ? 'liked' : ''}" id="sheetHeartBtn" onclick="toggleFavoriteInSheet(${offer.id})" aria-label="مفضلة" type="button">
                        ${fav ? ICONS.heartFilled : ICONS.heartOutline}
                    </button>
                    <button class="sheet-icon-btn" onclick="closeBottomSheet()" aria-label="إغلاق" type="button">${ICONS.close}</button>
                </div>
            </div>

            <div class="offer-detail-hero">
                <div class="offer-detail-logo" style="background: ${p.logoColor}">${escapeHtml(p.logo)}</div>
                <h4 class="offer-detail-provider-name">${escapeHtml(p.nameAr)}</h4>
                <span class="offer-detail-provider-sub">${escapeHtml(p.nameEn)}</span>
                <span class="offer-detail-rating">
                    ${renderStars(p.rating)}
                    <span>${p.rating} (${p.reviews} تقييم)</span>
                </span>
                <span class="offer-detail-badge">${ICONS.sparkle}${escapeHtml(offer.badgeAr)}</span>
            </div>

            <div class="offer-detail-section">
                <div class="offer-detail-section-label">الخدمة</div>
                <div class="offer-detail-section-value">${escapeHtml(group?.nameAr || '')} · ${escapeHtml(sub?.nameAr || '')}</div>
            </div>
            <div class="offer-detail-section">
                <div class="offer-detail-section-label">تفاصيل العرض</div>
                <div class="offer-detail-section-value">${escapeHtml(offer.titleAr)}</div>
            </div>

            <div class="offer-detail-price-block">
                <div class="offer-detail-price-label">سعر بلخدمة · شامل الضريبة</div>
                <div class="offer-detail-price-main">
                    <span class="offer-detail-price-value">${formatSAR(offer.finalExcPrice).replace(' ر.س','')}</span>
                    <span class="offer-detail-price-unit">ر.س</span>
                </div>
                <div class="offer-detail-price-compare">
                    سعر المزود المباشر: <del>${formatSAR(offer.finalProviderPrice)}</del>
                    ${savings > 0 ? ` — <strong>وفّر ${savingsPct}% (${formatSAR(savings)})</strong>` : ''}
                </div>
            </div>

            <button class="offer-detail-cta" onclick="bookOffer(${offer.id})" type="button">
                ${ICONS.shield} احجز الآن
            </button>
        </div>
    `;
}

function toggleFavoriteInSheet(offerId) {
    const wasFav = isFavorite(offerId);
    if (wasFav) removeFavorite(offerId); else saveFavorite(offerId);
    const btn = document.getElementById('sheetHeartBtn');
    if (btn) {
        const nowFav = !wasFav;
        btn.classList.toggle('liked', nowFav);
        btn.innerHTML = nowFav ? ICONS.heartFilled : ICONS.heartOutline;
    }
    refreshHeartsInDom(offerId);
}

function refreshHeartsInDom(offerId) {
    const fav = isFavorite(offerId);
    document.querySelectorAll(`[data-heart-offer="${offerId}"]`).forEach(btn => {
        btn.classList.toggle('liked', fav);
        btn.innerHTML = fav ? ICONS.heartFilled : ICONS.heartOutline;
        btn.setAttribute('aria-label', fav ? 'إزالة من المفضلة' : 'إضافة للمفضلة');
    });
}

function toggleFavorite(offerId) {
    if (isFavorite(offerId)) removeFavorite(offerId); else saveFavorite(offerId);
    refreshHeartsInDom(offerId);
    if (currentViewId === 'view-favorites') renderFavorites();
}

// ============================================================
// 13. BOOKING → ORDER + BOOKING SUCCESS
// ============================================================
function bookOffer(offerId) {
    const offer = getOfferById(offerId);
    if (!offer) return;
    const order = createOrder(offer, { locationId: searchState.locationId });
    closeBottomSheet();
    showBookingSuccess(order);
}

function showBookingSuccess(order) {
    const v = document.getElementById('view-order-detail');
    if (!v) return;
    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-orders')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">تأكيد الحجز</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="mediation-confirm-card">
                <div class="mediation-confirm-icon">${ICONS.check}</div>
                <h3 class="mediation-confirm-title">تم تأكيد الحجز!</h3>
                <p class="mediation-confirm-subtitle">شكراً لاختيارك بلخدمة. سيتواصل فريقنا معك لتأكيد موعد الخدمة قريباً.</p>

                <div class="mediation-lead-summary">
                    <div class="mediation-lead-row"><span class="mediation-lead-label">رقم الطلب</span><span class="mediation-lead-value"><bdi class="bidi-num">#${escapeHtml(order.orderNumber)}</bdi></span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">المزود</span><span class="mediation-lead-value">${escapeHtml(order.providerNameAr)}</span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">الخدمة</span><span class="mediation-lead-value">${escapeHtml(order.groupNameAr)} · ${escapeHtml(order.subTypeNameAr)}</span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">السعر</span><span class="mediation-lead-value">${formatSAR(order.finalPrice)}</span></div>
                    ${order.locationLabel ? `<div class="mediation-lead-row"><span class="mediation-lead-label">الموقع</span><span class="mediation-lead-value">${escapeHtml(order.locationLabel)}</span></div>` : ''}
                </div>

                <button class="mediation-done-btn" onclick="showView('view-order-detail', { orderId: ${order.id} })" type="button">عرض تفاصيل العقد</button>
                <button class="confirm-secondary-link" onclick="showView('view-home')" type="button">العودة للرئيسية</button>
            </div>
        </div>
    `;
    document.querySelectorAll('.view').forEach(vw => vw.classList.remove('active'));
    v.classList.add('active');
    currentViewId = 'view-order-detail';
    updateBottomNavActive();
    window.scrollTo(0, 0);
}

// ============================================================
// 14. MEDIATION LEAD
// ============================================================
function submitMediationLead() {
    const lead = createMediationLead({
        subTypeId: searchState.subTypeId,
        nationality: searchState.nationality,
        locationId: searchState.locationId
    });
    addToSearchHistory({ id: Date.now(), groupId: 4, subTypeId: searchState.subTypeId, isMediationLead: true, leadNumber: lead.leadNumber, timestamp: new Date().toISOString() });

    const v = document.getElementById('view-order-detail');
    if (!v) return;
    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">طلب الوساطة</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="mediation-confirm-card">
                <div class="mediation-confirm-icon">${ICONS.check}</div>
                <h3 class="mediation-confirm-title">تم استلام طلبك</h3>
                <p class="mediation-confirm-subtitle">سيتواصل معك فريق بلخدمة خلال 24 ساعة لتأكيد التفاصيل وعرض الخيارات المتاحة.</p>
                <div class="mediation-lead-summary">
                    <div class="mediation-lead-row"><span class="mediation-lead-label">رقم الطلب</span><span class="mediation-lead-value"><bdi class="bidi-num">#${escapeHtml(lead.leadNumber)}</bdi></span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">الخدمة</span><span class="mediation-lead-value">وساطة توظيف مباشر</span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">الجنسية المفضلة</span><span class="mediation-lead-value">${escapeHtml(lead.nationalityAr)}</span></div>
                    <div class="mediation-lead-row"><span class="mediation-lead-label">الموقع</span><span class="mediation-lead-value">${escapeHtml(lead.locationLabel)}</span></div>
                </div>
                <button class="mediation-done-btn" onclick="showView('view-home')" type="button">العودة للرئيسية</button>
            </div>
        </div>
    `;
    document.querySelectorAll('.view').forEach(vw => vw.classList.remove('active'));
    v.classList.add('active');
    currentViewId = 'view-order-detail';
    updateBottomNavActive();
    window.scrollTo(0, 0);
}

// ============================================================
// 15. FAVORITES VIEW
// ============================================================
function renderFavorites() {
    const v = document.getElementById('view-favorites');
    if (!v) return;
    const fav = getFavorites();
    const offers = appData.offers.filter(o => fav.includes(o.id));
    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">المفضلة</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            ${offers.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">${ICONS.emptyHeart}</div>
                    <h3 class="empty-state-title">لا توجد عروض مفضلة</h3>
                    <p class="empty-state-body">احفظ العروض التي تهمك بضغطة واحدة للعودة إليها لاحقاً</p>
                    <button class="empty-state-cta" onclick="showView('view-all-offers')" type="button">استكشف العروض</button>
                </div>
            ` : `<div class="offers-list">${offers.map(renderTicketCard).join('')}</div>`}
        </div>
    `;
}

// ============================================================
// 16. ORDERS VIEW
// ============================================================
function renderOrders() {
    const v = document.getElementById('view-orders');
    if (!v) return;
    const orders = getOrders();
    const leads = getMediationLeads();
    const statusLabel = { pending: 'قيد الانتظار', active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي' };

    const ordersHtml = orders.length ? `
        <h3 class="screen-section-title">عقود الخدمة</h3>
        <div class="orders-list">
            ${orders.map(o => `
                <button class="order-card" onclick="showView('view-order-detail', { orderId: ${o.id} })" type="button">
                    <div class="order-card-top">
                        <div class="order-card-logo" style="background: ${o.providerLogoColor}">${escapeHtml(o.providerLogo)}</div>
                        <span class="order-card-provider">${escapeHtml(o.providerNameAr)} · ${escapeHtml(o.groupNameAr)}</span>
                        <span class="order-status-pill ${o.status}">${statusLabel[o.status] || o.status}</span>
                    </div>
                    <div class="order-card-title">${escapeHtml(o.serviceTitle)}</div>
                    <div class="order-card-foot">
                        <span class="order-card-foot-meta"><bdi class="bidi-num">#${escapeHtml(o.orderNumber)}</bdi></span>
                        <span class="order-card-foot-price">${formatSAR(o.finalPrice)}</span>
                    </div>
                </button>
            `).join('')}
        </div>
    ` : '';

    const leadsHtml = leads.length ? `
        <h3 class="screen-section-title">طلبات الوساطة</h3>
        <div class="orders-list">
            ${leads.map(l => `
                <div class="order-card" style="cursor:default;">
                    <div class="order-card-top">
                        <div class="order-card-logo" style="background: linear-gradient(135deg,var(--primary),var(--primary-light));">${ICONS.handshake}</div>
                        <span class="order-card-provider">فريق بلخدمة للوساطة</span>
                        <span class="order-status-pill pending">بانتظار التواصل</span>
                    </div>
                    <div class="order-card-title">وساطة توظيف مباشر · ${escapeHtml(l.nationalityAr)}</div>
                    <div class="order-card-foot">
                        <span class="order-card-foot-meta"><bdi class="bidi-num">#${escapeHtml(l.leadNumber)}</bdi></span>
                        <span class="order-card-foot-meta">${escapeHtml(l.locationLabel)}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';

    const empty = !orders.length && !leads.length ? `
        <div class="empty-state">
            <div class="empty-state-icon">${ICONS.orders}</div>
            <h3 class="empty-state-title">لا توجد عقود نشطة حالياً</h3>
            <p class="empty-state-body">عند حجزك لأول خدمة سيظهر العقد هنا مع حالته والإشعارات المرتبطة به</p>
            <button class="empty-state-cta" onclick="showView('view-home')" type="button">ابحث عن خدمة</button>
        </div>
    ` : '';

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">العقود</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            ${empty}${ordersHtml}${leadsHtml}
        </div>
    `;
}

// ============================================================
// 17. ORDER DETAIL
// ============================================================
function renderOrderDetail(ctx) {
    const v = document.getElementById('view-order-detail');
    if (!v) return;
    const orderId = ctx?.orderId;
    const order = getOrders().find(o => o.id === orderId);
    if (!order) { v.innerHTML = '<div class="screen-body"><div class="empty-state"><p class="empty-state-body">لم يتم العثور على العقد</p></div></div>'; return; }

    const statusLabel = { pending: 'قيد الانتظار', active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي' };
    const steps = [
        { title: 'تم استلام الحجز',   done: true,                         active: false },
        { title: 'تأكيد المزود',       done: order.status !== 'pending',   active: order.status === 'pending' },
        { title: 'تعيين العاملة',      done: order.status === 'completed', active: order.status === 'active' },
        { title: 'تم إنهاء الخدمة',    done: order.status === 'completed', active: false }
    ];

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-orders')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">تفاصيل العقد</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="order-detail-hero">
                <span class="order-status-pill ${order.status}">${statusLabel[order.status] || order.status}</span>
                <div class="order-detail-hero-number"><bdi class="bidi-num">#${escapeHtml(order.orderNumber)}</bdi> · ${escapeHtml(order.providerNameAr)}</div>
                <div class="order-detail-hero-price">${formatSAR(order.finalPrice).replace(' ر.س','')}<small>ر.س · شامل الضريبة</small></div>
            </div>

            <h3 class="screen-section-title">تفاصيل الخدمة</h3>
            <div class="order-detail-meta">
                <div class="order-detail-meta-row"><span class="order-detail-meta-label">نوع الخدمة</span><span class="order-detail-meta-value">${escapeHtml(order.groupNameAr)}</span></div>
                <div class="order-detail-meta-row"><span class="order-detail-meta-label">الخدمة الفرعية</span><span class="order-detail-meta-value">${escapeHtml(order.subTypeNameAr)}</span></div>
                ${order.nationality ? `<div class="order-detail-meta-row"><span class="order-detail-meta-label">الجنسية</span><span class="order-detail-meta-value">${escapeHtml(getNationalityAr(order.nationality))}</span></div>` : ''}
                ${order.contractMonths ? `<div class="order-detail-meta-row"><span class="order-detail-meta-label">مدة العقد</span><span class="order-detail-meta-value">${order.contractMonths} شهر</span></div>` : ''}
                ${order.hours ? `<div class="order-detail-meta-row"><span class="order-detail-meta-label">عدد الساعات</span><span class="order-detail-meta-value">${order.hours} ساعات</span></div>` : ''}
                ${order.shift ? `<div class="order-detail-meta-row"><span class="order-detail-meta-label">الوردية</span><span class="order-detail-meta-value">${order.shift === 'morning' ? 'صباحاً' : 'مساءً'}</span></div>` : ''}
                ${order.locationLabel ? `<div class="order-detail-meta-row"><span class="order-detail-meta-label">الموقع</span><span class="order-detail-meta-value">${escapeHtml(order.locationLabel)}</span></div>` : ''}
            </div>

            <h3 class="screen-section-title">حالة العقد</h3>
            <div class="order-detail-timeline">
                ${steps.map(s => `
                    <div class="order-timeline-step ${s.done ? 'done' : ''} ${s.active ? 'active' : ''}">
                        <span class="order-timeline-dot">${s.done ? ICONS.check : ICONS.clockSmall}</span>
                        <div class="order-timeline-body">
                            <div class="order-timeline-title">${escapeHtml(s.title)}</div>
                            <div class="order-timeline-time">${s.active ? 'جاري الآن' : s.done ? 'مكتمل' : 'بانتظار'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${order.status === 'active' || order.status === 'pending' ? `
                <div class="order-actions">
                    <button class="btn-secondary" onclick="handleCancelOrder(${order.id})" type="button">إلغاء الحجز</button>
                    <button class="btn-primary" onclick="handleCompleteOrder(${order.id})" type="button">وضع علامة مكتمل</button>
                </div>
            ` : ''}
        </div>
    `;
}

function handleCancelOrder(id) {
    if (!confirm('هل أنت متأكد من إلغاء هذا العقد؟')) return;
    cancelOrder(id);
    showView('view-orders');
}
function handleCompleteOrder(id) {
    completeOrder(id);
    renderOrderDetail({ orderId: id });
}

// ============================================================
// 18. ALL OFFERS
// ============================================================
function renderAllOffers() {
    const v = document.getElementById('view-all-offers');
    if (!v) return;
    const all = appData.offers.filter(o => o.isActive);
    const filtered = allOffersGroupFilter ? all.filter(o => o.groupId === allOffersGroupFilter) : all;
    filtered.sort((a, b) => {
        const pa = getProviderById(a.providerId), pb = getProviderById(b.providerId);
        const aFP = pa?.isFirstParty ? 0 : 1, bFP = pb?.isFirstParty ? 0 : 1;
        if (aFP !== bFP) return aFP - bFP;
        return (pb?.rating || 0) - (pa?.rating || 0);
    });

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">جميع العروض</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="all-offers-quick-filters">
                <button class="chip ${allOffersGroupFilter === null ? 'selected' : ''}" onclick="setAllOffersGroup(null)" type="button">الكل</button>
                ${appData.serviceGroups.map(g => `
                    <button class="chip ${allOffersGroupFilter === g.id ? 'selected' : ''}" onclick="setAllOffersGroup(${g.id})" type="button">${escapeHtml(g.nameAr)}</button>
                `).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-hint);margin-bottom:10px;">${filtered.length} عرض</div>
            <div class="offers-list">
                ${filtered.slice(0, 60).map(renderTicketCard).join('')}
            </div>
            ${filtered.length > 60 ? `<div style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-hint);">تم عرض أول 60 نتيجة — استخدم الفلاتر لتضييق النتائج</div>` : ''}
        </div>
    `;
}

function setAllOffersGroup(gid) { allOffersGroupFilter = gid; renderAllOffers(); }

// ============================================================
// 19. PROVIDERS LIST + DETAIL
// ============================================================
function renderProvidersList() {
    const v = document.getElementById('view-providers-list');
    if (!v) return;
    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">الشركات</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="providers-grid">
                ${appData.providers.map(p => `
                    <button class="provider-card" onclick="showView('view-provider-detail', { providerId: ${p.id} })" type="button">
                        <div class="provider-card-logo" style="background: ${p.logoColor}">${escapeHtml(p.logo)}</div>
                        <span class="provider-card-name">${escapeHtml(p.nameAr)}</span>
                        <span class="provider-card-sub">${escapeHtml(p.nameEn)}</span>
                        <span class="provider-card-rating">${ICONS.starFull}${p.rating} · (${p.reviews})</span>
                        ${p.isFirstParty ? '<span class="provider-card-excp-badge">مزود بلخدمة</span>' : ''}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderProviderDetail(ctx) {
    const v = document.getElementById('view-provider-detail');
    if (!v) return;
    const providerId = ctx?.providerId;
    const p = getProviderById(providerId);
    if (!p) { v.innerHTML = '<div class="screen-body"><div class="empty-state"><p class="empty-state-body">لم يتم العثور على الشركة</p></div></div>'; return; }

    const providerOffers = appData.offers.filter(o => o.providerId === p.id && o.isActive).slice(0, 12);
    const natLabels = (p.supportedNationalities || []).map(id => getNationalityAr(id)).filter(Boolean);
    const cityLabels = (p.cityCoverage || []).map(id => appData.cities?.find(c => c.id === id)?.nameAr).filter(Boolean);

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">${escapeHtml(p.nameAr)}</h2>
            <div class="screen-header-spacer"></div>
        </header>

        <div class="provider-detail-hero">
            <div class="provider-detail-hero-logo" style="background: ${p.logoColor}">${escapeHtml(p.logo)}</div>
            <h2 class="provider-detail-hero-name">${escapeHtml(p.nameAr)}</h2>
            <span class="provider-detail-hero-sub">${escapeHtml(p.nameEn)}</span>
            <span class="provider-detail-hero-rating">${ICONS.starFull} ${p.rating} (${p.reviews} تقييم)</span>
            ${p.isFirstParty ? '<span class="excp-badge" style="margin-top:6px;">مزود بلخدمة المباشر</span>' : (p.isSponsored ? '<span class="sponsored-badge">إعلان ممول</span>' : '')}
        </div>

        <div class="provider-detail-stats">
            <div class="provider-stat"><div class="provider-stat-k">التقييم</div><div class="provider-stat-v">${p.rating}</div></div>
            <div class="provider-stat"><div class="provider-stat-k">الإتاحة</div><div class="provider-stat-v">${p.availability}%</div></div>
            <div class="provider-stat"><div class="provider-stat-k">التقييمات</div><div class="provider-stat-v">${p.reviews.toLocaleString('en-US')}</div></div>
        </div>

        <div class="screen-body" style="padding-top:0;">
            ${cityLabels.length ? `
                <h3 class="screen-section-title">المدن المخدومة</h3>
                <div class="provider-chip-row">${cityLabels.map(c => `<span class="provider-chip">${escapeHtml(c)}</span>`).join('')}</div>
            ` : ''}
            ${natLabels.length ? `
                <h3 class="screen-section-title">الجنسيات المتوفرة</h3>
                <div class="provider-chip-row">${natLabels.map(n => `<span class="provider-chip">${escapeHtml(n)}</span>`).join('')}</div>
            ` : ''}
            <h3 class="screen-section-title">عروض ${escapeHtml(p.nameAr)}</h3>
            ${providerOffers.length ? `
                <div class="offers-list">${providerOffers.map(renderTicketCard).join('')}</div>
            ` : `<p style="font-size:12px;color:var(--text-hint);padding:14px;">لا توجد عروض متاحة حالياً</p>`}
        </div>
    `;
}

// ============================================================
// 20. SEARCH OVERLAY
// ============================================================
function renderSearchOverlay() {
    const v = document.getElementById('view-search');
    if (!v) return;
    const history = getSearchHistory();
    v.innerHTML = `
        <div class="search-overlay-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <input type="text" class="search-overlay-input" id="searchOverlayInput"
                   placeholder="ابحث عن خدمة، شركة، أو عاملة…" oninput="runSearchQuery(this.value)" autocomplete="off">
        </div>
        <div class="search-overlay-results" id="searchOverlayResults">
            ${history.length ? `
                <div class="search-recent-title">عمليات البحث الأخيرة</div>
                ${history.slice(0, 5).map(h => {
                    const g = getGroupById(h.groupId);
                    const s = getSubTypeById(h.subTypeId);
                    return `<button class="search-recent-item" onclick="replaySearchHistory(${h.id})" type="button">
                        ${ICONS.clockSmall}
                        <div class="search-result-body">
                            <div class="search-result-title">${escapeHtml(s?.nameAr || g?.nameAr || 'بحث سابق')}</div>
                            <div class="search-result-sub">${escapeHtml(g?.nameAr || '')}</div>
                        </div>
                    </button>`;
                }).join('')}
            ` : `<p class="search-empty-hint">ابدأ بكتابة اسم الخدمة أو الشركة التي تبحث عنها</p>`}
        </div>
    `;
    setTimeout(() => document.getElementById('searchOverlayInput')?.focus(), 50);
}

function runSearchQuery(query) {
    const c = document.getElementById('searchOverlayResults');
    if (!c) return;
    const q = (query || '').trim().toLowerCase();
    if (!q) { renderSearchOverlay(); return; }

    const offerMatches = appData.offers.filter(o =>
        (o.titleAr || '').toLowerCase().includes(q) || (o.badgeAr || '').toLowerCase().includes(q)
    ).slice(0, 8);
    const providerMatches = appData.providers.filter(p =>
        (p.nameAr || '').toLowerCase().includes(q) || (p.nameEn || '').toLowerCase().includes(q)
    );
    const subMatches = appData.serviceSubTypes.filter(s =>
        (s.nameAr || '').toLowerCase().includes(q) || (s.nameEn || '').toLowerCase().includes(q)
    );
    const total = offerMatches.length + providerMatches.length + subMatches.length;

    c.innerHTML = `
        ${total === 0 ? `<p class="search-empty-hint">لا توجد نتائج تطابق "${escapeHtml(query)}"</p>` : ''}
        ${providerMatches.length ? `<div class="search-recent-title">الشركات</div>
            ${providerMatches.map(p => `
                <button class="search-result-item" onclick="showView('view-provider-detail', { providerId: ${p.id} })" type="button">
                    <span style="width:36px;height:36px;border-radius:50%;background:${p.logoColor};color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(p.logo)}</span>
                    <div class="search-result-body">
                        <div class="search-result-title">${escapeHtml(p.nameAr)}</div>
                        <div class="search-result-sub">${escapeHtml(p.nameEn)} · ${p.rating}★</div>
                    </div>
                </button>
            `).join('')}` : ''}
        ${subMatches.length ? `<div class="search-recent-title">الخدمات</div>
            ${subMatches.map(s => {
                const g = getGroupById(s.groupId);
                return `<button class="search-result-item" onclick="startSearchFromSub(${s.groupId}, ${s.id})" type="button">
                    ${ICONS[SUB_SERVICE_ICON[s.icon] || 'clock']}
                    <div class="search-result-body">
                        <div class="search-result-title">${escapeHtml(s.nameAr)}</div>
                        <div class="search-result-sub">${escapeHtml(g?.nameAr || '')}</div>
                    </div>
                </button>`;
            }).join('')}` : ''}
        ${offerMatches.length ? `<div class="search-recent-title">العروض</div>
            ${offerMatches.map(o => {
                const p = getProviderById(o.providerId);
                return `<button class="search-result-item" onclick="openOfferSheet(${o.id})" type="button">
                    <span style="width:36px;height:36px;border-radius:50%;background:${p?.logoColor};color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(p?.logo || '')}</span>
                    <div class="search-result-body">
                        <div class="search-result-title">${escapeHtml(o.titleAr)}</div>
                        <div class="search-result-sub">${escapeHtml(p?.nameAr || '')}</div>
                    </div>
                    <span class="search-result-price">${formatSAR(o.finalExcPrice)}</span>
                </button>`;
            }).join('')}` : ''}
    `;
}

function startSearchFromSub(groupId, subId) {
    resetSearchState({ groupId, subTypeId: subId });
    wizardCurrentStep = 3;
    showView('view-search-wizard');
    updateWizardUI();
}

function replaySearchHistory(id) {
    const entry = getSearchHistory().find(h => h.id === id);
    if (!entry) return;
    if (entry.groupId && entry.subTypeId) startSearchFromSub(entry.groupId, entry.subTypeId);
    else if (entry.groupId) startSearch(entry.groupId);
}

// ============================================================
// 21. LOCATION PICKER
// ============================================================
function renderLocationPicker() {
    const v = document.getElementById('view-location-picker');
    if (!v) return;
    const locs = getAllSavedLocations();
    const currentCity = document.getElementById('headerLocationText')?.textContent || 'الرياض';

    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">اختر موقع الخدمة</h2>
            <div class="screen-header-spacer"></div>
        </header>
        <div class="screen-body">
            <div class="location-picker-map">
                <div class="map-grid-bg"></div>
                ${ICONS.pin.replace('<svg ', '<svg class="map-pin" ')}
                <div class="map-label">${escapeHtml(currentCity)}</div>
            </div>

            <h3 class="screen-section-title">اختر مدينتك</h3>
            <div class="provider-chip-row">
                ${(appData.cities || []).map(c => `
                    <button class="provider-chip" style="cursor:pointer;background:${c.nameAr === currentCity ? 'var(--primary)' : 'var(--primary-bg)'};color:${c.nameAr === currentCity ? '#fff' : 'var(--primary)'};border:none;font-family:inherit;" onclick="pickCity('${c.id}', '${escapeHtml(c.nameAr)}')">${escapeHtml(c.nameAr)}</button>
                `).join('')}
            </div>

            <h3 class="screen-section-title">المواقع المحفوظة</h3>
            <div class="saved-locations-list">
                ${locs.length ? locs.map(l => `
                    <button class="location-card" onclick="pickSavedLocation(${l.id})" type="button">
                        <span class="location-card-icon">${ICONS.pin}</span>
                        <span class="location-card-body">
                            <span class="location-card-label">${escapeHtml(l.label)}${l.isDefault ? '<span class="location-card-default">افتراضي</span>' : ''}</span>
                            <span class="location-card-address">${escapeHtml(l.address)}</span>
                        </span>
                    </button>
                `).join('') : `<p style="font-size:12px;color:var(--text-hint);padding:14px;">لا توجد مواقع محفوظة. أضف موقعاً جديداً من خلال البحث عن خدمة.</p>`}
            </div>
        </div>
    `;
}

function pickCity(cityId, cityNameAr) {
    const text = document.getElementById('headerLocationText');
    if (text) text.textContent = cityNameAr;
    showView('view-home');
}

function pickSavedLocation(id) {
    searchState.locationId = id;
    const loc = getAllSavedLocations().find(l => l.id === id);
    if (loc) {
        const text = document.getElementById('headerLocationText');
        if (text) text.textContent = loc.city;
    }
    showView('view-home');
}

// ============================================================
// 22. NOTIFICATIONS VIEW
// ============================================================
function renderNotifications() {
    const v = document.getElementById('view-notifications');
    if (!v) return;
    const list = getNotifications();
    v.innerHTML = `
        <header class="screen-header">
            <button class="screen-header-back" onclick="showView('view-home')" aria-label="رجوع">${ICONS.chevronLeft}</button>
            <h2 class="screen-header-title">الإشعارات</h2>
            ${list.some(n => n.unread) ? `<button class="screen-header-action" onclick="markAllReadAndRefresh()" aria-label="تحديد الكل كمقروء">${ICONS.check}</button>` : '<div class="screen-header-spacer"></div>'}
        </header>
        <div class="screen-body">
            ${list.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">${ICONS.bell}</div>
                    <h3 class="empty-state-title">لا توجد إشعارات</h3>
                    <p class="empty-state-body">سنُعلمك بأي تحديث يتعلق بعقودك وعروضك المفضلة</p>
                </div>
            ` : `
                <div class="notification-list">
                    ${list.map(n => `
                        <div class="notification-item ${n.unread ? 'unread' : ''}" onclick="markOneRead(${n.id})">
                            <div class="notification-icon">${ICONS[n.icon] || ICONS.bell}</div>
                            <div class="notification-body">
                                <div class="notification-title">${escapeHtml(n.titleAr)}</div>
                                <div class="notification-text">${escapeHtml(n.bodyAr)}</div>
                                <div class="notification-time">${escapeHtml(n.timeAr)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

function markOneRead(id) { markNotificationRead(id); renderNotifications(); updateNotificationBadge(); }
function markAllReadAndRefresh() { markAllNotificationsRead(); renderNotifications(); updateNotificationBadge(); }

// ============================================================
// 23. INIT + LISTENERS
// ============================================================
function init() {
    const splashStart = Date.now();
    renderHome();
    requestAnimationFrame(() => {
        const elapsed = Date.now() - splashStart;
        const wait = Math.max(0, 400 - elapsed);
        setTimeout(() => {
            document.getElementById('splash-screen')?.classList.add('hidden');
            const app = document.getElementById('main-app');
            app?.classList.remove('hidden');
            app?.classList.add('visible');
        }, wait);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const sheet = document.getElementById('offerSheet');
        if (sheet && !sheet.hidden) { closeBottomSheet(); return; }
        if (currentViewId === 'view-search-wizard') { wizardBack(); return; }
        if (currentViewId !== 'view-home') showView('view-home');
    });
}

document.addEventListener('DOMContentLoaded', init);
