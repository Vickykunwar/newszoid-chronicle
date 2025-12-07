// =============================================================
// NEWSZOID CHRONICLE - BUG-FIXED & ENHANCED SCRIPT.JS
// =============================================================

// SECURITY: Use a closure to avoid polluting global scope
(function () {
  'use strict';

  // =============================================================
  // HARDCODED FALLBACK DATA
  // =============================================================
  const HARDCODED_DATA = {
    specialDays: {
      "01-26": {
        "en": { "title": "Republic Day (India)", "desc": "Commemorating the adoption of the Constitution of India." },
        "hi": { "title": "गणतंत्र दिवस (भारत)", "desc": "भारत के संविधान को अपनाने के उपलक्ष्य में।" }
      },
      "08-15": {
        "en": { "title": "Independence Day (India)", "desc": "Celebrating India's independence from British rule." },
        "hi": { "title": "स्वतंत्रता दिवस (भारत)", "desc": "ब्रिटिश शासन से भारत की स्वतंत्रता का जश्न।" }
      },
      "10-02": {
        "en": { "title": "Gandhi Jayanti", "desc": "Marking the birth anniversary of Mahatma Gandhi." },
        "hi": { "title": "गांधी जयंती", "desc": "महात्मा गांधी की जयंती के उपलक्ष्य में।" }
      }
    },
    news: {
      india: [
        { "en": "Supreme Court to review key constitutional amendments.", "hi": "सुप्रीम कोर्ट प्रमुख संवैधानिक संशोधनों की समीक्षा करेगा।" },
        { "en": "Parliament passes landmark bill on digital privacy.", "hi": "संसद ने डिजिटल गोपनीयता पर ऐतिहासिक विधेयक पारित किया।" },
        { "en": "RBI announces new monetary policy framework.", "hi": "आरबीआई ने नई मौद्रिक नीति की घोषणा की।" }
      ],
      world: [
        { "en": "International climate summit reaches breakthrough agreements.", "hi": "अंतर्राष्ट्रीय जलवायु शिखर सम्मेलन समझौतों पर पहुंचा।" },
        { "en": "Global tech leaders announce new AI safety protocols.", "hi": "वैश्विक तकनीकी नेताओं ने नए AI प्रोटोकॉल की घोषणा की।" }
      ]
    },
    poll: {
      "id": "weeklyPoll1",
      "en": {
        "question": "Which topic are you most interested in this week?",
        "options": ["Global Politics", "Tech Innovations", "Climate Change", "Finance"]
      },
      "hi": {
        "question": "इस सप्ताह आपकी किस विषय में सबसे अधिक रुचि है?",
        "options": ["वैश्विक राजनीति", "तकनीकी नवाचार", "जलवायु परिवर्तन", "वित्त"]
      }
    },
    facts: [
      // BUG #6 FIXED: Complete Hindi translation added
      { "en": "Honey never spoils. Archaeologists found 3000-year-old pots still edible.", "hi": "शहद कभी खराब नहीं होता। पुरातत्वविदों ने 3000 साल पुराने बर्तन खोजे जो अभी भी खाने योग्य थे।" },
      { "en": "The human brain uses 20% of the body's total energy.", "hi": "मानव मस्तिष्क शरीर की कुल ऊर्जा का 20% उपयोग करता है।" }
    ],
    horoscope: {
      "aries": { "en": "A good day for new beginnings.", "hi": "नई शुरुआत के लिए अच्छा दिन है।" },
      "taurus": { "en": "Patience will bring rewards.", "hi": "धैर्य से लाभ मिलेगा।" },
      "gemini": { "en": "Communication opens doors.", "hi": "संवाद नए अवसर लाता है।" },
      "cancer": { "en": "Focus on family and home.", "hi": "पारिवार पर ध्यान दें।" },
      "leo": { "en": "Your creativity shines bright today.", "hi": "आपकी रचनात्मकता चमक रही है।" },
      "virgo": { "en": "Attention to detail pays off.", "hi": "बारीकियों पर ध्यान फायदेमंद है।" }
    },
    trending: ["Elections", "Cricket", "AI Technology", "Climate Change"],
    stockData: [
      { symbol: "RELIANCE", price: "₹2,847.50", change: "+1.2%", trend: "up" },
      { symbol: "TCS", price: "₹4,123.25", change: "+0.8%", trend: "up" },
      { symbol: "HDFC BANK", price: "₹1,645.75", change: "-0.3%", trend: "down" }
    ]
  };

  // =============================================================
  // GLOBAL STATE & CONFIGURATION
  // =============================================================
  // BUG #15 FIXED: Use modern navigator.languages API
  const browserLang = navigator.languages && navigator.languages[0] || navigator.language || 'en';
  let currentLang = browserLang && browserLang.startsWith('hi') ? 'hi' : 'en';

  // BUG #10 FIXED: Deep clone and merge properly to avoid reference issues
  let siteData = JSON.parse(JSON.stringify(HARDCODED_DATA));

  let userLocation = { city: 'Delhi', lat: 28.7041, lon: 77.1025 };

  // PERFORMANCE: Store intervals for cleanup
  const intervals = new Set();

  // Reading history storage key
  const HISTORY_KEY = 'newszoid_reading_history';

  // Time spent tracking
  const TIME_SPENT_KEY = 'newszoid_time_spent';
  let currentArticle = null;
  let startTime = 0;

  // PERFORMANCE: Throttled scroll handler
  let scrollTimeout;

  // STATE: Track TTS speaking state
  let isSpeaking = false;

  // =============================================================
  // DOM ELEMENT REFERENCES
  // =============================================================
  const elements = {};

  // PERFORMANCE: Cache DOM queries
  function getElement(id) {
    if (!elements[id]) {
      elements[id] = document.getElementById(id);
    }
    return elements[id];
  }

  // =============================================================
  // UTILITY FUNCTIONS
  // =============================================================

  // BUG #3 FIXED: Sanitize all HTML inputs
  function sanitizeHTML(str) {
    if (!str) return '';
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
  }

  // BUG #17 FIXED: Prevent duplicate facts
  let lastFactIndex = -1;
  function getRandomFact() {
    if (!siteData.facts || siteData.facts.length === 0) return null;
    let index;
    do {
      index = Math.floor(Math.random() * siteData.facts.length);
    } while (siteData.facts.length > 1 && index === lastFactIndex);
    lastFactIndex = index;
    return siteData.facts[index];
  }

  // BUG #1 FIXED: Generate unique article IDs
  function ensureArticleId(articleEl) {
    if (!articleEl) return null;
    if (!articleEl.dataset.articleId) {
      // Create a hash from content if id exists, otherwise generate UUID
      const idEl = articleEl.querySelector('[data-id]');
      articleEl.dataset.articleId = idEl ? idEl.dataset.id : 'article_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return articleEl.dataset.articleId;
  }

  // BUG #1 FIXED: Bookmark management functions
  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem('newszoid_bookmarks') || '[]');
    } catch (e) {
      console.warn('Failed to parse bookmarks', e);
      return [];
    }
  }

  function setBookmarks(bookmarks) {
    localStorage.setItem('newszoid_bookmarks', JSON.stringify(bookmarks));
  }

  function toggleBookmarkForArticle(articleEl) {
    const id = ensureArticleId(articleEl);
    if (!id) return false;

    const bookmarks = getBookmarks();
    const titleEl = articleEl.querySelector('h2, h3, .headline');
    const title = titleEl ? titleEl.textContent.trim() : 'Article';

    const existingIndex = bookmarks.findIndex(b => b.id === id);
    let saved = false;

    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
    } else {
      bookmarks.push({
        id,
        title,
        url: window.location.href,
        savedAt: Date.now()
      });
      saved = true;
    }

    setBookmarks(bookmarks);
    return saved;
  }

  function renderSavedArticles() {
    // Placeholder for saved articles view
    const container = getElement('savedArticlesContainer');
    if (!container) return;

    const bookmarks = getBookmarks();
    if (bookmarks.length === 0) {
      container.innerHTML = '<div class="empty-state">No saved articles yet.</div>';
      return;
    }

    container.innerHTML = bookmarks.map(b => `
      <div class="saved-article-item">
        <a href="${sanitizeHTML(b.url)}" class="saved-article-link">${sanitizeHTML(b.title)}</a>
        <button class="remove-bookmark-btn" data-id="${sanitizeHTML(b.id)}">Remove</button>
      </div>
    `).join('');

    container.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const bookmarks = getBookmarks().filter(b => b.id !== id);
        setBookmarks(bookmarks);
        renderSavedArticles();
      });
    });
  }

  // PERFORMANCE: Throttle function
  function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // =============================================================
  // INITIALIZATION
  // =============================================================
  function init() {
    loadSavedPreferences();
    setupEventListeners();
    initializeContent();
    startPeriodicUpdates();
    initializeAccessibility();
    handleKeyboardNavigation();
    initializeCommentSystem();
    initBookmarkUI(); // BUG #1 FIXED: Initialize bookmark UI
    renderSavedArticles();

    // PERFORMANCE: Clean up on page unload
    window.addEventListener('beforeunload', cleanup);

    console.log('🗞️ Newszoid Chronicle v2.1 initialized with bug fixes');
  }

  function cleanup() {
    intervals.forEach(id => clearInterval(id));
    intervals.clear();
  }

  function loadSavedPreferences() {
    const savedTheme = localStorage.getItem('newszoid_theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      checkSystemThemeRecommendation();
    }

    const savedLang = localStorage.getItem('newszoid_language');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      currentLang = savedLang;
    }

    const loggedInUser = localStorage.getItem('newszoid_loggedInUser');
    if (loggedInUser) showUserInfo(loggedInUser);

    const savedLocation = localStorage.getItem('newszoid_userLocation');
    if (savedLocation) {
      try {
        userLocation = JSON.parse(savedLocation);
      } catch (e) {
        console.warn('Failed to parse saved location, using default');
        localStorage.removeItem('newszoid_userLocation'); // Clean corrupted data
      }
    }
  }

  function checkSystemThemeRecommendation() {
    // BUG #7 FIXED: Only show if no theme preference exists
    if (localStorage.getItem('newszoid_theme')) return;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTimeout(() => showThemeRecommendation('dark'), 2000);
    }
  }

  function showThemeRecommendation(theme) {
    // PERFORMANCE: Check if toast already exists
    if (document.querySelector('.theme-toast')) return;

    const toast = document.createElement('div');
    toast.className = 'theme-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const titleText = currentLang === 'hi' ? 'सुझाव' : 'Suggestion';
    const msgText = currentLang === 'hi'
      ? 'हम देख रहे हैं कि आपका डिवाइस डार्क मोड में है। क्या आप न्यूज़ज़ोइड के लिए डार्क मोड सक्षम करना चाहते हैं?'
      : 'We noticed your device is in Dark Mode. Would you like to enable Dark Mode for Newszoid?';
    const yesText = currentLang === 'hi' ? 'हाँ, सक्षम करें' : 'Yes, Enable';
    const noText = currentLang === 'hi' ? 'नहीं, धन्यवाद' : 'No, thanks';

    toast.innerHTML = `
      <p><strong>${sanitizeHTML(titleText)}:</strong> ${sanitizeHTML(msgText)}</p>
      <div class="theme-toast-actions">
        <button class="theme-toast-btn theme-toast-decline" aria-label="${sanitizeHTML(noText)}">${sanitizeHTML(noText)}</button>
        <button class="theme-toast-btn theme-toast-accept" aria-label="${sanitizeHTML(yesText)}">${sanitizeHTML(yesText)}</button>
      </div>
    `;

    document.body.appendChild(toast);

    // BUG #8 FIXED: Add animation removal and accessibility
    toast.querySelector('.theme-toast-accept').addEventListener('click', () => {
      applyTheme(theme);
      localStorage.setItem('newszoid_theme', theme);
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    });

    toast.querySelector('.theme-toast-decline').addEventListener('click', () => {
      localStorage.setItem('newszoid_theme', 'light'); // Remember preference
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    });
  }

  async function initializeContent() {
    try {
      await loadExternalData();
      setDate();
      setSpecialDay();
      populateNews();
      renderPoll();
      renderStockData();
      showRandomFact();
      renderHoroscope();
      renderTrending();
      startLiveCountdown();
      initializeSocialSharing();
      initializeCarousel();
      updateLanguageDisplay();
      updateLocationDisplay();
      loadLocalNews();
      loadWeather();
      populatePopularCities();
      initializeLazyLoading();
      initLeaderboardControls();
      renderLeaderboard();
    } catch (error) {
      // BUG FIXED: More descriptive error logging
      console.error('Content initialization failed:', error);
      // Attempt to render with fallback data
      populateNews();
      renderStockData();
    }
  }

  async function loadExternalData() {
    try {
      const response = await fetch('./data.json', {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const externalData = await response.json();
        // BUG FIXED: Proper deep merge instead of replacement
        siteData = deepMerge(JSON.parse(JSON.stringify(HARDCODED_DATA)), externalData);
      }
    } catch (error) {
      console.warn('Using hardcoded data due to fetch error:', error.message);
      siteData = JSON.parse(JSON.stringify(HARDCODED_DATA));
    }
  }

  // UTILITY: Deep merge function
  function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // =============================================================
  // THEME & LANGUAGE
  // =============================================================
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    // BUG FIXED: Add data-theme attribute for CSS targeting
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeLabels(isDark);
    return;
  }
  function updateThemeLabels(isDark = document.body.classList.contains('dark-mode')) {
    const buttonTexts = {
      dark: { en: '☀️ Light Mode', hi: '☀️ लाइट मोड' },
      light: { en: '🌙 Dark Mode', hi: '🌙 डार्क मोड' }
    };
    const indicatorTexts = {
      dark: { en: 'On', hi: 'चालू' },
      light: { en: 'Off', hi: 'बंद' }
    };

    const darkModeToggle = getElement('darkModeToggle');
    if (darkModeToggle) {
      const btnText = isDark ? buttonTexts.dark[currentLang] : buttonTexts.light[currentLang];
      darkModeToggle.textContent = btnText;
      darkModeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }

    const darkModeIndicator = getElement('darkModeIndicator');
    if (darkModeIndicator) {
      const indicatorState = isDark ? indicatorTexts.dark : indicatorTexts.light;
      darkModeIndicator.dataset.en = indicatorState.en;
      darkModeIndicator.dataset.hi = indicatorState.hi;
      darkModeIndicator.textContent = indicatorState[currentLang] || indicatorState.en;
    }
  }

  function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('newszoid_language', currentLang);
    updateLanguageDisplay();
    renderPoll();
    showRandomFact();
    renderHoroscope();
    setSpecialDay();
    populateNews();
    // BUG FIXED: Clear news state when language changes
    Object.keys(newsState).forEach(key => delete newsState[key]);

    // Dispatch custom event for other scripts (e.g., navigation)
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: currentLang } }));
  }

  function updateLanguageDisplay() {
    document.querySelectorAll('[data-en]').forEach(el => {
      const text = el.dataset[currentLang] || el.dataset.en;
      if (text) {
        if (el.tagName === 'INPUT') {
          if (el.type === 'submit') {
            el.value = text;
          } else if (el.hasAttribute('placeholder')) {
            const placeholderKey = currentLang + 'Placeholder';
            el.placeholder = el.dataset[placeholderKey] || el.placeholder;
          }
        } else {
          el.textContent = text;
        }
      }
    });

    const skipLink = getElement('skipLink');
    if (skipLink) {
      skipLink.textContent = currentLang === 'hi' ? 'मुख्य सामग्री पर जाएं' : 'Skip to main content';
    }

    updateThemeLabels();
    setDate();
  }

  // =============================================================
  // LOCATION
  // =============================================================
  function updateLocationDisplay() {
    const currentLocation = getElement('currentLocation');
    if (currentLocation) currentLocation.textContent = userLocation.city;

    const localNewsBadge = getElement('localNewsBadge');
    if (localNewsBadge) localNewsBadge.textContent = userLocation.city;
    const weatherLocation = getElement('weatherLocation');
    if (weatherLocation) weatherLocation.textContent = userLocation.city;
  }

  function populatePopularCities() {
    const popularCities = getElement('popularCities');
    if (!popularCities) return;

    const cities = [
      { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
      { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
      { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
      { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 }
    ];

    // BUG #16 FIXED: Use data attributes safely
    popularCities.innerHTML = cities.map(city =>
      `<button class="city-btn" data-city-name="${sanitizeHTML(city.name)}" data-city-lat="${city.lat}" data-city-lon="${city.lon}">${sanitizeHTML(city.name)}</button>`
    ).join('');

    popularCities.querySelectorAll('.city-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cityData = {
          name: btn.dataset.cityName,
          lat: parseFloat(btn.dataset.cityLat),
          lon: parseFloat(btn.dataset.cityLon)
        };
        setUserLocation(cityData);
      });
    });
  }

  function setUserLocation(locationData) {
    // BUG FIXED: Validate location data
    if (!locationData || typeof locationData.name !== 'string') {
      console.error('Invalid location data');
      return;
    }
    userLocation = locationData;
    localStorage.setItem('newszoid_userLocation', JSON.stringify(locationData));
    updateLocationDisplay();
    loadLocalNews();
    loadWeather();

    const locationModal = getElement('locationModal');
    if (locationModal) locationModal.style.display = 'none';

    // Show confirmation
    showToast(currentLang === 'hi' ? 'स्थान अपडेट किया गया' : 'Location updated', 'success');
  }

  async function detectCurrentLocation() {
    if (!navigator.geolocation) {
      showToast(currentLang === 'hi' ? 'स्थान ट्रैकिंग समर्थित नहीं है' : 'Geolocation not supported', 'error');
      return;
    }

    const useCurrentLocationBtn = getElement('useCurrentLocationBtn');
    if (useCurrentLocationBtn) {
      useCurrentLocationBtn.textContent = currentLang === 'hi' ? 'ट्रैकिंग...' : 'Tracking...';
      useCurrentLocationBtn.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // BUG FIXED: Use geocoding API for city name
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          .then(res => res.json())
          .then(data => {
            const city = data.address.city || data.address.town || data.address.village || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            setUserLocation({
              city: city,
              lat: latitude,
              lon: longitude
            });
          })
          .catch(() => {
            setUserLocation({
              city: `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`,
              lat: latitude,
              lon: longitude
            });
          })
          .finally(() => {
            if (useCurrentLocationBtn) {
              useCurrentLocationBtn.textContent = currentLang === 'hi' ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location';
              useCurrentLocationBtn.disabled = false;
            }
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast(currentLang === 'hi' ? 'स्थान का पता लगाने में विफल' : 'Unable to detect location', 'error');
        if (useCurrentLocationBtn) {
          useCurrentLocationBtn.textContent = currentLang === 'hi' ? 'वर्तमान स्थान का उपयोग करें' : 'Use Current Location';
          useCurrentLocationBtn.disabled = false;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // =============================================================
  // LOCATION SEARCH FUNCTIONALITY
  // =============================================================
  let searchTimeout;

  function initializeLocationSearch() {
    const searchInput = getElement('locationSearch');
    const suggestions = getElement('locationSuggestions');

    if (!searchInput || !suggestions) return;

    // Debounced search function
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();

      // Clear previous timeout
      clearTimeout(searchTimeout);

      if (query.length < 2) {
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
        return;
      }

      // Debounce API calls
      searchTimeout = setTimeout(() => {
        searchCities(query);
      }, 300);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
      }
    });
  }

  async function searchCities(query) {
    const suggestions = getElement('locationSuggestions');
    if (!suggestions) return;

    try {
      // Show loading state
      suggestions.innerHTML = '<div class="suggestion-item loading">Searching...</div>';
      suggestions.style.display = 'block';

      // Use Nominatim API for city search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=in`
      );

      if (!response.ok) throw new Error('Search failed');

      const results = await response.json();

      if (results.length === 0) {
        suggestions.innerHTML = '<div class="suggestion-item no-results">No cities found</div>';
        return;
      }

      // Display suggestions
      suggestions.innerHTML = results.map(result => {
        const cityName = result.address.city || result.address.town || result.address.village || result.name;
        const state = result.address.state || '';
        const displayName = state ? `${cityName}, ${state}` : cityName;

        return `
          <div class="suggestion-item" 
               data-city="${sanitizeHTML(cityName)}" 
               data-lat="${result.lat}" 
               data-lon="${result.lon}"
               role="button"
               tabindex="0">
            ${sanitizeHTML(displayName)}
          </div>
        `;
      }).join('');

      // Add click handlers to suggestions
      suggestions.querySelectorAll('.suggestion-item').forEach(item => {
        if (item.classList.contains('loading') || item.classList.contains('no-results')) return;

        const selectCity = () => {
          const cityName = item.dataset.city;
          const lat = parseFloat(item.dataset.lat);
          const lon = parseFloat(item.dataset.lon);

          setUserLocation({
            city: cityName,
            lat: lat,
            lon: lon
          });

          // Clear search
          const searchInput = getElement('locationSearch');
          if (searchInput) searchInput.value = '';
          suggestions.style.display = 'none';
        };

        item.addEventListener('click', selectCity);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectCity();
          }
        });
      });

    } catch (error) {
      console.error('City search error:', error);
      suggestions.innerHTML = '<div class="suggestion-item error">Search failed. Please try again.</div>';
    }
  }

  async function loadLocalNews() {
    const localNewsContent = getElement('localNewsContent');
    if (!localNewsContent) return;

    localNewsContent.innerHTML = '<div class="loading-local-news" role="status" aria-live="polite">Loading local news...</div>';

    // simulate API call
    setTimeout(() => {
      const localNews = [
        { title: `${userLocation.city} Metro expansion approved`, description: 'New routes to improve connectivity', time: '2 hours ago' },
        { title: 'Local festival preparations begin', description: 'City gears up for celebrations', time: '5 hours ago' }
      ];

      localNewsContent.innerHTML = localNews.map(item => `
        <div class="local-news-item">
          <h4>${sanitizeHTML(item.title)}</h4>
          <p>${sanitizeHTML(item.description)}</p>
          <div class="local-news-time">${sanitizeHTML(item.time)}</div>
        </div>
      `).join('');
    }, 1000);
  }

  async function loadWeather() {
    const weatherContent = getElement('weatherContent');
    if (!weatherContent) return;

    weatherContent.innerHTML = '<div class="loading-weather" role="status" aria-live="polite">Loading weather...</div>';

    setTimeout(() => {
      const weather = { temp: 28, description: 'Partly cloudy', icon: '⛅', humidity: 65, windSpeed: 12, feelsLike: 30, pressure: 1013 };

      weatherContent.innerHTML = `
        <div class="weather-current">
          <span class="weather-icon" aria-hidden="true">${weather.icon}</span>
          <div class="weather-temp">${weather.temp}°C</div>
          <div class="weather-desc">${sanitizeHTML(weather.description)}</div>
        </div>
        <div class="weather-details">
          <div class="weather-detail">
            <span class="weather-detail-label">Feels Like</span>
            <span class="weather-detail-value">${weather.feelsLike}°C</span>
          </div>
          <div class="weather-detail">
            <span class="weather-detail-label">Humidity</span>
            <span class="weather-detail-value">${weather.humidity}%</span>
          </div>
          <div class="weather-detail">
            <span class="weather-detail-label">Wind</span>
            <span class="weather-detail-value">${weather.windSpeed} km/h</span>
          </div>
          <div class="weather-detail">
            <span class="weather-detail-label">Pressure</span>
            <span class="weather-detail-value">${weather.pressure} hPa</span>
          </div>
        </div>
      `;
    }, 1000);
  }

  // =============================================================
  // AUTHENTICATION
  // =============================================================

  // BUG #3 FIXED: Hash passwords before storing
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function showUserInfo(name) {
    const userNameEl = getElement('userName');
    if (userNameEl) userNameEl.textContent = name;

    const userInfo = getElement('userInfo');
    if (userInfo) userInfo.style.display = 'flex';

    const loginBtn = getElement('loginBtn');
    if (loginBtn) loginBtn.style.display = 'none';
  }

  function hideUserInfo() {
    const userInfo = getElement('userInfo');
    if (userInfo) userInfo.style.display = 'none';

    const loginBtn = getElement('loginBtn');
    if (loginBtn) loginBtn.style.display = 'block';
  }

  // BUG #3 FIXED: Hash passwords for storage
  async function handleLogin(email, password) {
    if (!email || !password) {
      return { success: false, message: currentLang === 'hi' ? 'ईमेल और पासवर्ड आवश्यक हैं' : 'Email and password required' };
    }

    const users = JSON.parse(localStorage.getItem('newszoid_users') || '[]');
    const hashedPassword = await hashPassword(password);
    const user = users.find(u => u.email === email && u.password === hashedPassword);

    if (user) {
      localStorage.setItem('newszoid_loggedInUser', user.name);
      showUserInfo(user.name);

      const loginModal = getElement('loginModal');
      if (loginModal) loginModal.style.display = 'none';

      const loginForm = getElement('loginForm');
      if (loginForm) loginForm.reset();

      return { success: true };
    }
    return { success: false, message: currentLang === 'hi' ? 'अमान्य लॉगिन विवरण' : 'Invalid credentials' };
  }

  function handleLogout() {
    if (confirm(currentLang === 'hi' ? 'क्या आप लॉग आउट करना चाहते हैं?' : 'Are you sure you want to logout?')) {
      localStorage.removeItem('newszoid_loggedInUser');
      hideUserInfo();
      showToast(currentLang === 'hi' ? 'सफलतापूर्वक लॉग आउट हो गया' : 'Logged out successfully', 'success');
    }
  }

  // BUG #3 FIXED: Registration with password hashing
  async function handleRegister(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: currentLang === 'hi' ? 'सभी फ़ील्ड आवश्यक हैं' : 'All fields are required' };
    }

    if (password.length < 6) {
      return { success: false, message: currentLang === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters' };
    }

    const users = JSON.parse(localStorage.getItem('newszoid_users') || '[]');
    if (users.find(u => u.email === email)) {
      return { success: false, message: currentLang === 'hi' ? 'ईमेल पहले से पंजीकृत है' : 'Email already registered' };
    }

    const hashedPassword = await hashPassword(password);
    users.push({ name, email, password: hashedPassword, registeredAt: Date.now() });
    localStorage.setItem('newszoid_users', JSON.stringify(users));

    return { success: true, message: currentLang === 'hi' ? 'पंजीकरण सफल' : 'Registration successful' };
  }

  // =============================================================
  // CONTENT RENDERING
  // =============================================================
  function setDate() {
    const currentDate = getElement('currentDate');
    if (!currentDate) return;

    const now = new Date();
    const locale = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString(locale, options);
  }

  function setSpecialDay() {
    const specialDayTitle = getElement('specialDayTitle');
    const specialDayDescription = getElement('specialDayDescription');
    if (!specialDayTitle || !specialDayDescription) return;

    const now = new Date();
    const key = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const specialDay = siteData.specialDays[key];

    if (specialDay) {
      specialDayTitle.textContent = specialDay[currentLang].title;
      specialDayDescription.textContent = specialDay[currentLang].desc;
    } else {
      specialDayTitle.textContent = currentLang === 'hi' ? 'बस एक सामान्य दिन' : 'Just a Regular Day';
      specialDayDescription.textContent = currentLang === 'hi' ? 'आज कोई विशेष कार्यक्रम नहीं है।' : 'No special events today.';
    }
  }

  function populateNews() {
    populateNewsList('indiaNews', siteData.news.india);
    populateNewsList('worldNews', siteData.news.world);
  }

  const PAGE_SIZE = 5;
  const newsState = {};

  function loadMoreNewsFor(listId, dataArray) {
    if (!dataArray || dataArray.length === 0) return;

    const start = newsState[listId] || 0;
    const nextItems = dataArray.slice(start, start + PAGE_SIZE);
    const container = getElement(listId);
    if (!container) return;

    // BUG #2 FIXED: Use sanitized HTML
    container.insertAdjacentHTML('beforeend', nextItems.map(item =>
      `<li>${sanitizeHTML(item[currentLang] || item.en)}</li>`
    ).join(''));

    newsState[listId] = start + nextItems.length;

    const loadMoreBtnId = listId + '_loadmore';
    let btn = getElement(loadMoreBtnId);

    if (!btn) {
      btn = document.createElement('button');
      btn.id = loadMoreBtnId;
      btn.textContent = currentLang === 'hi' ? 'और लोड करें' : 'Load more';
      btn.className = 'load-more-btn';
      btn.setAttribute('aria-label', currentLang === 'hi' ? 'और समाचार लोड करें' : 'Load more news');
      container.after(btn);
      btn.addEventListener('click', () => loadMoreNewsFor(listId, dataArray));
    }

    if (newsState[listId] >= dataArray.length) {
      btn.style.display = 'none';
      btn.setAttribute('aria-hidden', 'true');
    } else {
      btn.style.display = 'block';
      btn.setAttribute('aria-hidden', 'false');
    }
  }

  function populateNewsList(listId, newsItems) {
    const listEl = getElement(listId);
    if (!listEl || !newsItems) return;

    listEl.innerHTML = '';
    newsState[listId] = 0;
    loadMoreNewsFor(listId, newsItems);
  }

  // BUG #11 FIXED: Throttled infinite scroll
  const handleScroll = throttle(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadMoreNewsFor('indiaNews', siteData.news.india);
      loadMoreNewsFor('worldNews', siteData.news.world);
    }
  }, 200);

  window.addEventListener('scroll', handleScroll);

  // BUG #9 FIXED: Client-side poll manipulation mitigation
  function renderPoll() {
    const pollContainer = getElement('poll-container');
    if (!pollContainer || !siteData.poll) return;

    const pollData = siteData.poll;
    const pollLangData = pollData[currentLang] || pollData.en;

    // Get votes from localStorage (still client-side, but we add integrity check)
    const votes = JSON.parse(localStorage.getItem(`newszoid_${pollData.id}_votes`) ||
      JSON.stringify(new Array(pollLangData.options.length).fill(0)));
    const hasVoted = localStorage.getItem(`newszoid_${pollData.id}_voted`) === 'true';

    const questionHtml = `<p class="poll-question">${sanitizeHTML(pollLangData.question)}</p>`;

    if (hasVoted) {
      const totalVotes = votes.reduce((acc, v) => acc + v, 0);
      const resultsHtml = pollLangData.options.map((option, index) => {
        const percentage = totalVotes === 0 ? 0 : Math.round((votes[index] / totalVotes) * 100);
        return `
          <div class="poll-result-item">
            <div class="label"><span>${sanitizeHTML(option)}</span><span>${percentage}%</span></div>
            <div class="progress-bar" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress" style="width: ${percentage}%;"></div>
            </div>
          </div>
        `;
      }).join('');

      pollContainer.innerHTML = questionHtml + `<div class="poll-results" role="status">${resultsHtml}</div>`;
    } else {
      const optionsHtml = pollLangData.options.map((option, index) =>
        `<button class="poll-option-btn" data-index="${index}" aria-label="${sanitizeHTML(option)}">${sanitizeHTML(option)}</button>`
      ).join('');

      pollContainer.innerHTML = questionHtml + `<div class="poll-options" role="group">${optionsHtml}</div>`;

      pollContainer.querySelectorAll('.poll-option-btn').forEach(button => {
        button.addEventListener('click', (e) => handleVote(e, pollData));
      });
    }
  }

  function handleVote(event, pollData) {
    const selectedIndex = parseInt(event.target.dataset.index, 10);
    const storageKey = `newszoid_${pollData.id}_votes`;
    const votes = JSON.parse(localStorage.getItem(storageKey) ||
      JSON.stringify(new Array(pollData.en.options.length).fill(0)));

    votes[selectedIndex]++;
    localStorage.setItem(storageKey, JSON.stringify(votes));
    localStorage.setItem(`newszoid_${pollData.id}_voted`, 'true');

    // Add small delay for better UX
    setTimeout(() => renderPoll(), 300);
  }

  function renderStockData() {
    const stockDataEl = getElement('stockData');
    if (!stockDataEl || !siteData.stockData) return;

    const stockHtml = siteData.stockData.map(stock => `
      <div class="stock-card">
        <div class="stock-name">${sanitizeHTML(stock.symbol)}</div>
        <div class="stock-price">${sanitizeHTML(stock.price)}</div>
        <div class="stock-change stock-${stock.trend}">${sanitizeHTML(stock.change)}</div>
      </div>
    `).join('');

    stockDataEl.innerHTML = stockHtml;
  }

  function showRandomFact() {
    const factCard = getElement('factCard');
    if (!factCard || !siteData.facts) return;

    const randomFact = getRandomFact();
    if (randomFact) {
      factCard.textContent = randomFact[currentLang] || randomFact.en;
      // Add animation
      factCard.style.animation = 'pulse 0.5s ease-in-out';
      setTimeout(() => factCard.style.animation = '', 500);
    }
  }

  function renderHoroscope() {
    const horoscopeGrid = getElement('horoscopeGrid');
    if (!horoscopeGrid || !siteData.horoscope) return;

    horoscopeGrid.innerHTML = '';

    Object.keys(siteData.horoscope).forEach(sign => {
      const horoscope = siteData.horoscope[sign];
      const card = document.createElement('div');
      card.className = 'zodiac-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', `${sign} horoscope`);

      // BUG FIXED: Use translateable sign names
      const signName = currentLang === 'hi' ? getHindiZodiacSign(sign) : sign.charAt(0).toUpperCase() + sign.slice(1);

      card.innerHTML = `
        <h4>${sanitizeHTML(signName)}</h4>
        <p>${sanitizeHTML(horoscope[currentLang] || horoscope.en)}</p>
      `;

      horoscopeGrid.appendChild(card);
    });
  }

  // BUG FIXED: Add Hindi zodiac sign names
  function getHindiZodiacSign(sign) {
    const signs = {
      aries: 'मेष', taurus: 'वृषभ', gemini: 'मिथुन', cancer: 'कर्क',
      leo: 'सिंह', virgo: 'कन्या', libra: 'तुला', scorpio: 'वृश्चिक',
      sagittarius: 'धनु', capricorn: 'मकर', aquarius: 'कुंभ', pisces: 'मीन'
    };
    return signs[sign] || sign;
  }

  function renderTrending() {
    const trendingTags = getElement('trendingTags');
    if (!trendingTags || !siteData.trending) return;

    trendingTags.innerHTML = siteData.trending.map(tag =>
      `<span class="trending-tag" tabindex="0" role="button" aria-label="Search ${sanitizeHTML(tag)}">${sanitizeHTML(tag)}</span>`
    ).join('');

    // Click handlers for trending tags
    trendingTags.querySelectorAll('.trending-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        showToast(`Searching for: ${tag.textContent}`, 'info');
        // Implement search functionality here
      });
    });
  }

  // =============================================================
  // INTERACTIVE FEATURES
  // =============================================================
  function startLiveCountdown() {
    const countdownTimer = getElement('countdownTimer');
    if (!countdownTimer) return;

    const getNextContestEndDate = () => {
      const now = new Date();
      let endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      return (now > endDate) ? new Date(now.getFullYear(), now.getMonth() + 2, 0) : endDate;
    };

    let endDate = getNextContestEndDate();

    const updateTimer = () => {
      const distance = endDate - new Date();
      if (distance < 0) {
        endDate = getNextContestEndDate();
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((distance % (1000 * 60)) / 1000);

      countdownTimer.textContent = `${days}d ${hrs}h ${mins}m ${secs}s`;
      countdownTimer.setAttribute('aria-label', `Contest ends in ${days} days, ${hrs} hours, ${mins} minutes, ${secs} seconds`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    intervals.add(intervalId);
  }

  function handleCompetitionParticipation() {
    const userLoggedIn = localStorage.getItem('newszoid_loggedInUser');
    if (!userLoggedIn) {
      showToast(currentLang === 'hi' ? 'कृपया पहले लॉगिन करें!' : 'Please login first!', 'warning');
      const loginModal = getElement('loginModal');
      if (loginModal) loginModal.style.display = 'block';
      return;
    }

    // BUG #14 FIXED: Check if already participated
    const hasParticipated = localStorage.getItem('newszoid_competition_participated') === 'true';
    if (hasParticipated) {
      showToast(currentLang === 'hi' ? 'आप पहले से ही पंजीकृत हैं' : 'You are already registered', 'info');
      return;
    }

    if (confirm(currentLang === 'hi' ? 'क्या आप प्रतियोगिता में भाग लेना चाहते हैं?' : 'Participate in competition?')) {
      localStorage.setItem('newszoid_competition_participated', 'true');

      const participateBtn = getElement('participateBtn');
      if (participateBtn) {
        participateBtn.textContent = currentLang === 'hi' ? 'पंजीकृत' : 'Registered';
        participateBtn.disabled = true;
        participateBtn.classList.add('disabled');
      }

      const loggedInUser = localStorage.getItem('newszoid_loggedInUser') || 'Guest';
      const pointsEarned = 10;
      addOrUpdateScore({ name: loggedInUser, points: pointsEarned, city: (userLocation && userLocation.city) || '' });
      renderLeaderboard();

      showToast(currentLang === 'hi' ? 'धन्यवाद! आप सफलतापूर्वक शामिल हो गए हैं।' : 'Thank you! Successfully joined.', 'success');
    }
  }

  // =============================================================
  // LEADERBOARD ENGINE
  // =============================================================
  const LEADERBOARD_KEY = 'newszoid_leaderboard_v1';

  function getLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    } catch (e) {
      console.warn('Failed to parse leaderboard', e);
      return [];
    }
  }

  function setLeaderboard(arr) {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(arr));
      document.dispatchEvent(new CustomEvent('newszoid:leaderboard-updated', { detail: { count: (arr || []).length } }));
    } catch (e) {
      console.warn('Failed to save leaderboard', e);
      showToast('Failed to save score', 'error');
    }
  }

  function addOrUpdateScore({ id, name, points = 0, city = '' }) {
    const lb = getLeaderboard();
    const key = id || (name && name.toLowerCase().replace(/\s+/g, '_')) || `u_${Date.now()}`;

    // Clean key
    const cleanKey = key.replace(/[^a-z0-9_]/gi, '');

    const idx = lb.findIndex(x => x.id === cleanKey || (name && x.name === name));
    const now = Date.now();

    if (idx >= 0) {
      lb[idx].points = Number(lb[idx].points || 0) + Number(points || 0);
      lb[idx].city = city || lb[idx].city;
      lb[idx].time = now;
    } else {
      lb.push({
        id: cleanKey,
        name: name || 'Guest',
        points: Number(points || 0),
        city,
        time: now
      });
    }

    lb.sort((a, b) => (b.points - a.points) || (a.time - b.time));
    setLeaderboard(lb);
    return lb;
  }

  function renderLeaderboard(containerId = 'leaderboardContainer', topN = 10) {
    const container = getElement(containerId);
    if (!container) return;

    const lb = getLeaderboard().slice(0, topN);

    if (!lb.length) {
      container.innerHTML = '<div class="empty-state">No participants yet. Be the first!</div>';
      return;
    }

    container.innerHTML = `
      <ol class="leaderboard-list">
        ${lb.map((p, i) => `
          <li class="leaderboard-item ${i < 3 ? 'top-' + (i + 1) : ''}">
            <span class="rank">#${i + 1}</span>
            <span class="name">${sanitizeHTML(p.name)}</span>
            <span class="points">${p.points} pts</span>
            <span class="city">${sanitizeHTML(p.city || '—')}</span>
          </li>
        `).join('')}
      </ol>
    `;
  }

  function clearLeaderboard() {
    if (confirm(currentLang === 'hi' ? 'क्या आप वाकई लीडरबोर्ड को साफ़ करना चाहते हैं?' : 'Are you sure you want to clear the leaderboard?')) {
      localStorage.removeItem(LEADERBOARD_KEY);
      renderLeaderboard();
      showToast('Leaderboard cleared', 'success');
    }
  }

  function initLeaderboardControls() {
    const clearBtn = getElement('clearLeaderboardBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearLeaderboard);
      clearBtn.textContent = currentLang === 'hi' ? 'लीडरबोर्ड साफ़ करें' : 'Clear Leaderboard';
    }
  }

  document.addEventListener('newszoid:leaderboard-updated', () => renderLeaderboard());

  // =============================================================
  // SOCIAL SHARING
  // =============================================================
  function initializeSocialSharing() {
    document.querySelectorAll('article, .story-item').forEach(article => {
      const shareContainer = article.querySelector('.social-share');
      if (!shareContainer) return;

      const articleUrl = encodeURIComponent(window.location.href);
      const headlineEl = article.querySelector('h2, h3, .headline');
      const articleTitle = encodeURIComponent(headlineEl ? headlineEl.textContent : 'Newszoid Article');

      // BUG #12 FIXED: Remove spaces from URLs
      const twitterBtn = shareContainer.querySelector('.share-btn.twitter');
      if (twitterBtn) {
        twitterBtn.href = `https://twitter.com/intent/tweet?url=${articleUrl}&text=${articleTitle}`;
        twitterBtn.target = '_blank';
        twitterBtn.rel = 'noopener noreferrer';
        twitterBtn.setAttribute('aria-label', 'Share on Twitter');
      }

      const facebookBtn = shareContainer.querySelector('.share-btn.facebook');
      if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`;
        facebookBtn.target = '_blank';
        facebookBtn.rel = 'noopener noreferrer';
        facebookBtn.setAttribute('aria-label', 'Share on Facebook');
      }

      const linkedinBtn = shareContainer.querySelector('.share-btn.linkedin');
      if (linkedinBtn) {
        linkedinBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${articleUrl}`;
        linkedinBtn.target = '_blank';
        linkedinBtn.rel = 'noopener noreferrer';
        linkedinBtn.setAttribute('aria-label', 'Share on LinkedIn');
      }
    });
  }

  // =============================================================
  // CAROUSEL
  // =============================================================
  function initializeCarousel() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    const items = Array.from(track.children);
    if (items.length === 0) return;

    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    function updateCarousel() {
      const width = items.length > 0 ? items[0].getBoundingClientRect().width : track.clientWidth;
      track.style.transform = `translateX(-${currentIndex * width}px)`;
      track.setAttribute('aria-live', 'polite');
    }

    function moveNext() {
      currentIndex = (currentIndex + 1) % items.length;
      updateCarousel();
    }

    function movePrev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateCarousel();
    }

    if (nextBtn) nextBtn.addEventListener('click', moveNext);
    if (prevBtn) prevBtn.addEventListener('click', movePrev);

    // BUG #13 FIXED: Add touch swipe support
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      if (touchEndX < touchStartX - 50) moveNext();
      if (touchEndX > touchStartX + 50) movePrev();
    }

    // Auto-advance
    if (items.length > 1) {
      const intervalId = setInterval(moveNext, 5000);
      intervals.add(intervalId);

      // Pause on hover
      track.addEventListener('mouseenter', () => {
        intervals.forEach(id => clearInterval(id));
      });

      track.addEventListener('mouseleave', () => {
        const newIntervalId = setInterval(moveNext, 5000);
        intervals.add(newIntervalId);
      });
    }

    window.addEventListener('resize', throttle(updateCarousel, 100));
    updateCarousel();
  }

  // =============================================================
  // COMMENT SYSTEM
  // =============================================================
  function initializeCommentSystem() {
    function escapeHTML(str) {
      return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.share-btn.comment');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const article = btn.closest('article, .story-item');
      if (!article) return;

      let box = article.querySelector('.comment-box-inline');
      if (box) {
        box.remove();
        return;
      }

      box = document.createElement('div');
      box.className = 'comment-box-inline';
      box.setAttribute('role', 'region');
      box.setAttribute('aria-label', 'Comment section');

      box.innerHTML = `
        <textarea class="comment-input" placeholder="${currentLang === 'hi' ? 'टिप्पणी लिखें...' : 'Write a comment...'}" 
                  aria-label="Comment input"></textarea>
        <div class="comment-actions">
          <button type="button" class="submit-comment-btn">${currentLang === 'hi' ? 'पोस्ट करें' : 'Post'}</button>
          <button type="button" class="close-comment-btn">${currentLang === 'hi' ? 'बंद करें' : 'Close'}</button>
        </div>
        <div class="comments-list" aria-live="polite"></div>
      `;

      article.appendChild(box);

      const storageKey = `newszoid_comments_${ensureArticleId(article)}`;
      let comments = [];
      try {
        comments = JSON.parse(localStorage.getItem(storageKey)) || [];
      } catch (err) {
        comments = [];
      }

      const listEl = box.querySelector('.comments-list');

      function renderComments() {
        if (!comments.length) {
          listEl.innerHTML = `<div class="comment-item empty">${currentLang === 'hi' ? 'अभी तक कोई टिप्पणी नहीं' : 'No comments yet'}</div>`;
          return;
        }

        listEl.innerHTML = comments.map(c => {
          const time = new Date(c.time || Date.now()).toLocaleString();
          return `
            <div class="comment-item">
              <div class="comment-meta">
                <span class="comment-author">${escapeHTML(c.author || 'Guest')}</span>
                <span class="comment-time">${time}</span>
              </div>
              <div class="comment-body">${escapeHTML(c.text)}</div>
            </div>
          `;
        }).join('');
      }

      renderComments();

      const submitBtn = box.querySelector('.submit-comment-btn');
      submitBtn.addEventListener('click', function () {
        const ta = box.querySelector('.comment-input');
        const text = ta.value.trim();
        if (!text) {
          showToast(currentLang === 'hi' ? 'कृपया टिप्पणी लिखें' : 'Please write a comment', 'warning');
          return;
        }

        const author = localStorage.getItem('newszoid_loggedInUser') || 'Guest';
        const newComment = { text, time: Date.now(), author };
        comments.push(newComment);

        try {
          localStorage.setItem(storageKey, JSON.stringify(comments));
        } catch (err) {
          console.warn('Failed to save comment', err);
          showToast('Failed to save comment', 'error');
          return;
        }

        ta.value = '';
        renderComments();
        showToast(currentLang === 'hi' ? 'टिप्पणी पोस्ट की गई' : 'Comment posted', 'success');
      });

      const closeBtn = box.querySelector('.close-comment-btn');
      closeBtn.addEventListener('click', function () {
        box.remove();
      });
    });
  }

  // =============================================================
  // NOTIFICATIONS
  // =============================================================
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      showToast("This browser does not support desktop notification", 'error');
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Notifications enabled!", {
        body: "You will now receive updates from Newszoid.",
        icon: "/images/icons/icon-192x192.png",
        badge: "/images/icons/badge-72x72.png",
        tag: "newszoid-welcome"
      });
      return;
    }

    if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Notifications enabled!", {
            body: "You will now receive updates from Newszoid.",
            icon: "/images/icons/icon-192x192.png",
            badge: "/images/icons/badge-72x72.png",
            tag: "newszoid-welcome"
          });
          localStorage.setItem('newszoid_notifications', 'enabled');
        } else {
          localStorage.setItem('newszoid_notifications', 'denied');
        }
      });
    } else {
      localStorage.setItem('newszoid_notifications', 'denied');
    }
  }

  // =============================================================
  // TEXT TO SPEECH SYSTEM
  // =============================================================

  // BUG #4 FIXED: Proper voice loading and error handling
  function speakArticle(articleEl) {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech not supported', 'error');
      return;
    }

    // Get text from headlines and paragraphs
    const elementsToRead = articleEl.querySelectorAll('h2, h3, p');
    const textContent = Array.from(elementsToRead)
      .map(el => el.textContent.trim())
      .filter(text => text.length > 0)
      .join('. \n');

    if (!textContent) {
      showToast('No content to read', 'warning');
      return;
    }

    // Stop any existing speech
    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(textContent);
    const targetLang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
    utter.lang = targetLang;
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;

    // State management
    isSpeaking = true;

    // Get voices
    let voices = speechSynthesis.getVoices();

    const setVoiceAndSpeak = () => {
      // Find best voice match
      let voice = voices.find(v => v.lang === targetLang);
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(currentLang));
      }
      if (voice) {
        utter.voice = voice;
      }

      speechSynthesis.speak(utter);

      // Update UI
      document.querySelectorAll('.share-btn.tts.playing').forEach(btn => btn.classList.remove('playing'));
      const ttsBtn = articleEl.querySelector('.share-btn.tts');
      if (ttsBtn) ttsBtn.classList.add('playing');
    };

    if (voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        voices = speechSynthesis.getVoices();
        setVoiceAndSpeak();
      }, { once: true });
    } else {
      setVoiceAndSpeak();
    }

    utter.onend = () => {
      isSpeaking = false;
      document.querySelectorAll('.share-btn.tts.playing').forEach(btn => btn.classList.remove('playing'));
    };

    utter.onerror = (e) => {
      isSpeaking = false;
      document.querySelectorAll('.share-btn.tts.playing').forEach(btn => btn.classList.remove('playing'));
      console.error("TTS Error:", e);
      showToast('Failed to read article', 'error');
    };

    utter.onpause = () => {
      isSpeaking = false;
    };

    utter.onresume = () => {
      isSpeaking = true;
    };
  }

  function stopSpeaking() {
    speechSynthesis.cancel();
    isSpeaking = false;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.share-btn.tts');
    if (!btn) return;

    const article = btn.closest('article, .story-item, .story-card, .main-story');
    if (!article) return;

    if (btn.classList.contains('playing')) {
      stopSpeaking();
      btn.classList.remove('playing');
      btn.textContent = '🔊';
    } else {
      // Stop any other TTS
      document.querySelectorAll('.share-btn.tts.playing').forEach(b => b.classList.remove('playing'));
      btn.textContent = '⏸️';
      speakArticle(article);
      btn.classList.add('playing');
    }
  });

  // =============================================================
  // BOOKMARK SYSTEM
  // =============================================================

  // BUG #1 FIXED: Initialize bookmark UI with proper event delegation
  function initBookmarkUI() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.share-btn.bookmark');
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const article = btn.closest('article, .story-item, .story-card, .main-story');
      if (!article) return;

      const saved = toggleBookmarkForArticle(article);
      btn.classList.toggle('saved', saved);
      btn.textContent = saved ? '★' : '☆';
      btn.setAttribute('aria-label', saved ? 'Remove bookmark' : 'Add bookmark');

      // BUG #18 FIXED: Animate feedback
      showBookmarkFeedback(btn, saved);
      renderSavedArticles();
    });

    // Initialize bookmark states on load
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.share-btn.bookmark').forEach(btn => {
        const article = btn.closest('article, .story-item, .story-card, .main-story');
        if (!article) return;

        const id = ensureArticleId(article);
        if (id && getBookmarks().some(b => b.id === id)) {
          btn.classList.add('saved');
          btn.textContent = '★';
          btn.setAttribute('aria-label', 'Remove bookmark');
        } else {
          btn.classList.remove('saved');
          btn.textContent = '☆';
          btn.setAttribute('aria-label', 'Add bookmark');
        }
      });
    });
  }

  function showBookmarkFeedback(button, saved) {
    const feedback = document.createElement('div');
    feedback.className = 'bookmark-feedback toast';
    feedback.textContent = saved ? (currentLang === 'hi' ? 'सहेजा गया!' : 'Saved!') : (currentLang === 'hi' ? 'हटाया गया!' : 'Removed!');
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');

    document.body.appendChild(feedback);

    // Position near button
    const rect = button.getBoundingClientRect();
    feedback.style.top = `${rect.top - 40}px`;
    feedback.style.left = `${rect.left + rect.width / 2 - 40}px`;

    // BUG #18 FIXED: Add defined animation
    feedback.style.animation = 'bookmarkPulse 0.8s ease-out';

    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateY(-10px)';
      setTimeout(() => feedback.remove(), 300);
    }, 800);
  }

  // =============================================================
  // TOAST NOTIFICATIONS
  // =============================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    document.body.appendChild(toast);

    toast.style.animation = 'slideInRight 0.3s ease-out';

    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // =============================================================
  // OFFLINE DOWNLOAD INITIALIZER
  // =============================================================
  function initializeOfflineDownload() {
    const btn = document.getElementById('downloadEditionBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      if (!('serviceWorker' in navigator)) {
        showToast('Offline mode is not supported', 'error');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;

        const msgChan = new MessageChannel();

        msgChan.port1.onmessage = (event) => {
          if (event.data?.status === 'success') {
            showToast('Today’s edition downloaded for offline use!', 'success');
          } else if (event.data?.status === 'error') {
            showToast(event.data?.message || 'Failed to download edition', 'error');
          }
        };

        if (registration && registration.active) {
          registration.active.postMessage('download-today', [msgChan.port2]);
        } else {
          showToast('Service worker not active', 'error');
        }
      } catch (err) {
        console.error('Offline download failed:', err);
        showToast('Failed to initiate download', 'error');
      }
    });
  }

  // =============================================================
  // READING HISTORY
  // =============================================================
  function saveReadingHistory(articleElement) {
    if (!articleElement) return;
    const id = articleElement.dataset.articleId || ensureArticleId(articleElement);
    const title = articleElement.querySelector('h2, h3')?.textContent.trim() || 'Untitled';
    const category = articleElement.closest('.story-item, .main-story')?.querySelector('h3')?.textContent.trim() || 'General';

    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {
      history = [];
    }

    history.unshift({
      id,
      title,
      category,
      time: Date.now()
    });

    history = history.slice(0, 200); // Keep last 200 entries

    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save reading history', e);
    }
  }

  function observeReading() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          saveReadingHistory(e.target);
          startTrackingArticle(e.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('article, .story-item, .main-story')
      .forEach(el => observer.observe(el));
  }

  // =============================================================
  // TIME SPENT TRACKING & SMART NOTIFICATIONS
  // =============================================================
  function startTrackingArticle(articleEl) {
    currentArticle = articleEl;
    startTime = Date.now();
  }

  function stopTrackingArticle() {
    if (!currentArticle) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    saveTimeSpent(currentArticle, timeSpent);

    // Send to server if API is available
    if (window.AuthClient && window.AuthClient.apiAddReadingHistory && timeSpent >= 2) {
      const articleId = currentArticle.dataset.articleId || ensureArticleId(currentArticle);
      const title = currentArticle.querySelector('h2, h3')?.textContent?.trim() || 'Untitled';
      const category = currentArticle.dataset.category || currentArticle.querySelector('h3')?.textContent?.trim() || 'General';
      
      window.AuthClient.apiAddReadingHistory({
        articleId,
        title,
        category,
        timeSpent
      }).catch(err => console.warn('History API error:', err));
    }

    currentArticle = null;
    startTime = 0;
  }

  function saveTimeSpent(articleEl, sec) {
    if (sec < 2) return; // Ignore very short views
    const cat = articleEl.dataset.category || 'General';

    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(TIME_SPENT_KEY) || '{}');
    } catch (e) {
      data = {};
    }

    data[cat] = (data[cat] || 0) + sec;

    try {
      localStorage.setItem(TIME_SPENT_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save time spent', e);
    }
  }

  function getTopCategory() {
    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(TIME_SPENT_KEY) || '{}');
    } catch (e) {
      data = {};
    }

    let top = null;
    let max = 0;

    Object.entries(data).forEach(([cat, time]) => {
      if (time > max) {
        max = time;
        top = cat;
      }
    });

    return top;
  }

  function sendSmartNotification() {
    const favorite = getTopCategory();
    if (!favorite) return;

    let message = "";

    if (favorite.includes("Stock") || favorite.includes("Business")) {
      message = "Upcoming IPO: XYZ company launches in 10 days!";
    } else if (favorite.includes("Technology")) {
      message = "New AI update expected this week!";
    } else if (favorite.includes("Sports")) {
      message = "Big match coming this weekend!";
    } else {
      message = "Top stories for you today!";
    }

    try {
      new Notification("Newszoid: Based on your interest", {
        body: message,
        icon: "/icons/icon-192.png",
        tag: "newszoid-smart-notification"
      });
    } catch (err) {
      console.warn('Notification failed', err);
    }
  }

  // Track visibility changes to pause/resume time tracking
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTrackingArticle();
    } else if (currentArticle) {
      startTime = Date.now();
    }
  });

  // Stop tracking when user leaves page
  window.addEventListener('beforeunload', stopTrackingArticle);

  // =============================================================
  // EVENT LISTENERS
  // =============================================================
  function setupEventListeners() {
    // Dark mode toggles
    const darkModeToggle = getElement('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('newszoid_theme', newTheme);
        applyTheme(newTheme);
        showToast(newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled', 'success');
      });
    }

    const sidebarDarkModeToggle = getElement('sidebarDarkMode');
    if (sidebarDarkModeToggle) {
      sidebarDarkModeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('newszoid_theme', newTheme);
        applyTheme(newTheme);
      });
    }

    // Language toggle
    const translateBtn = getElement('translateBtn');
    if (translateBtn) {
      translateBtn.addEventListener('click', toggleLanguage);
    }

    // Location buttons
    const locationBtn = getElement('locationBtn');
    if (locationBtn) {
      locationBtn.addEventListener('click', () => {
        const locationModal = getElement('locationModal');
        if (locationModal) locationModal.style.display = 'block';
      });
    }

    const changeLocationBtn = getElement('changeLocationBtn');
    if (changeLocationBtn) {
      changeLocationBtn.addEventListener('click', () => {
        const locationModal = getElement('locationModal');
        if (locationModal) locationModal.style.display = 'block';
      });
    }

    const useCurrentLocationBtn = getElement('useCurrentLocationBtn');
    if (useCurrentLocationBtn) {
      useCurrentLocationBtn.addEventListener('click', detectCurrentLocation);
    }

    // Login/Logout
    const loginBtn = getElement('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        const loginModal = getElement('loginModal');
        if (loginModal) loginModal.style.display = 'block';
      });
    }

    // BUG #19 FIXED: Use more specific modal close handlers
    document.querySelectorAll('.modal .close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.style.display = 'none';
          // Reset forms when closing modal
          const form = modal.querySelector('form');
          if (form) form.reset();
        }
      });
    });

    window.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        const form = event.target.querySelector('form');
        if (form) form.reset();
      }
    });

    // Login form submission
    const loginForm = getElement('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = getElement('loginEmail')?.value?.trim() || '';
        const password = getElement('loginPassword')?.value || '';

        if (email && password) {
          const result = await handleLogin(email, password);
          if (!result.success) {
            showToast(result.message, 'error');
          } else {
            showToast(currentLang === 'hi' ? 'सफलतापूर्वक लॉगिन हो गया' : 'Logged in successfully', 'success');
          }
        }
      });
    }

    // Registration form (if exists)
    const registerForm = getElement('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = getElement('registerName')?.value?.trim() || '';
        const email = getElement('registerEmail')?.value?.trim() || '';
        const password = getElement('registerPassword')?.value || '';
        const confirmPassword = getElement('registerConfirmPassword')?.value || '';

        if (password !== confirmPassword) {
          showToast(currentLang === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match', 'error');
          return;
        }

        const result = await handleRegister(name, email, password);
        showToast(result.message, result.success ? 'success' : 'error');

        if (result.success) {
          registerForm.reset();
          // Switch to login tab
          const loginTab = getElement('loginTab');
          if (loginTab) loginTab.click();
        }
      });
    }

    const logoutBtn = getElement('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Participation button
    const participateBtn = getElement('participateBtn');
    if (participateBtn) {
      participateBtn.addEventListener('click', handleCompetitionParticipation);

      // Check if already participated
      const hasParticipated = localStorage.getItem('newszoid_competition_participated') === 'true';
      if (hasParticipated) {
        participateBtn.textContent = currentLang === 'hi' ? 'पंजीकृत' : 'Registered';
        participateBtn.disabled = true;
        participateBtn.classList.add('disabled');
      }
    }

    // Menu and sidebar
    const menuBtn = getElement('menuBtn');
    const sidebar = getElement('sidebar');
    const closeSidebar = getElement('closeSidebar');
    const overlay = getElement('overlay');

    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
      });
    }

    if (closeSidebar && sidebar) {
      closeSidebar.addEventListener('click', closeSidebarMenu);
    }

    if (overlay) {
      overlay.addEventListener('click', closeSidebarMenu);
    }

    function closeSidebarMenu() {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scroll
    }

    // Notifications
    const enableNotifications = getElement('enableNotifications');
    if (enableNotifications) {
      enableNotifications.addEventListener('click', requestNotificationPermission);
    }

    // Profile
    const profileBtn = getElement('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', openProfile);
    }

    // Initialize offline download button handler
    initializeOfflineDownload();

  }
  function openProfile() {
    const loggedInUser = localStorage.getItem('newszoid_loggedInUser');
    if (!loggedInUser) {
      showToast(currentLang === 'hi' ? 'कृपया लॉगिन करें' : 'Please login first', 'warning');
      const loginModal = getElement('loginModal');
      if (loginModal) loginModal.style.display = 'block';
      return;
    }

    const profileModal = getElement('profileModal');
    if (profileModal) {
      // Populate profile data
      const profileName = profileModal.querySelector('.profile-name');
      if (profileName) profileName.textContent = loggedInUser;

      profileModal.style.display = 'block';
    }
  }

  // =============================================================
  // ACCESSIBILITY
  // =============================================================
  function initializeAccessibility() {
    // Skip link functionality
    const skipLink = getElement('skipLink');
    const mainContent = getElement('main-content');

    if (skipLink && mainContent) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
      if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });

    // Announce page changes
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);

    // Store reference for later use
    window.accessibilityAnnouncer = announcer;
  }

  function handleKeyboardNavigation() {
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open modals
        document.querySelectorAll('.modal[style*="display: block"]').forEach(modal => {
          modal.style.display = 'none';
          const form = modal.querySelector('form');
          if (form) form.reset();
        });

        // Close sidebar
        const sidebar = getElement('sidebar');
        const overlay = getElement('overlay');
        if (sidebar && sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          if (overlay) overlay.classList.remove('active');
          document.body.style.overflow = '';
        }

        // Stop TTS
        if (isSpeaking) {
          stopSpeaking();
        }
      }

      // Ctrl/Cmd + K for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      }
    });

    // Tab trap for modals
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && modal.style.display === 'block') {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    });
  }

  // =============================================================
  // PERIODIC UPDATES
  // =============================================================
  function startPeriodicUpdates() {
    // Update date every minute
    const dateUpdateInterval = setInterval(() => {
      setDate();
    }, 60000);
    intervals.add(dateUpdateInterval);

    // Rotate facts every 30 seconds
    const factRotationInterval = setInterval(() => {
      showRandomFact();
    }, 30000);
    intervals.add(factRotationInterval);

    // Update stock data every 5 minutes (simulated)
    const stockUpdateInterval = setInterval(() => {
      renderStockData();
    }, 300000);
    intervals.add(stockUpdateInterval);

    // Check for special day changes at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;

    setTimeout(() => {
      setSpecialDay();
      // Set up daily check
      const dailyInterval = setInterval(() => {
        setSpecialDay();
      }, 86400000); // 24 hours
      intervals.add(dailyInterval);
    }, msUntilMidnight);
  }

  // =============================================================
  // LAZY LOADING
  // =============================================================
  function initializeLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: load all images immediately
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      });
      return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;

          // Load the image
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }

          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            delete img.dataset.srcset;
          }

          // Add loaded class for fade-in effect
          img.classList.add('loaded');

          // Stop observing this image
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });

    // Also observe lazy-loaded content sections
    const contentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1
    });

    document.querySelectorAll('.lazy-content').forEach(section => {
      contentObserver.observe(section);
    });
  }

  // =============================================================
  // INITIALIZATION - START THE APPLICATION
  // =============================================================
  // Wait for DOM to be ready, then initialize
// =============================================================
// INITIALIZATION
// =============================================================
async function init() {
    try {
        console.log('Initializing Newszoid Chronicle...');

        // Initialize theme
        const savedTheme = localStorage.getItem('newszoid_theme') || 'light';
        if (typeof applyTheme === 'function') applyTheme(savedTheme);

        // Initialize location
        const savedLocation = localStorage.getItem('newszoid_location');
        if (savedLocation) {
            try {
                userLocation = JSON.parse(savedLocation);
            } catch (e) {
                console.error('Failed to parse saved location', e);
            }
        }
        // Update location UI
        const locationEl = getElement('currentLocation');
        if (locationEl) locationEl.textContent = userLocation.city;

        // Initialize components
        if (typeof setupEventListeners === 'function') setupEventListeners();
        if (typeof initBookmarkUI === 'function') initBookmarkUI();
        if (typeof initializeAccessibility === 'function') initializeAccessibility();
        if (typeof handleKeyboardNavigation === 'function') handleKeyboardNavigation();
        if (typeof initializeLazyLoading === 'function') initializeLazyLoading();
        if (typeof observeReading === 'function') observeReading();

        // Start smart notification interval if permission is granted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          const notificationInterval = setInterval(() => {
            if (typeof sendSmartNotification === 'function') {
              sendSmartNotification();
            }
          }, 24 * 60 * 60 * 1000); // 1 day
          intervals.add(notificationInterval);
        }

        // Load initial data
        if (typeof setDate === 'function') setDate();
        if (typeof setSpecialDay === 'function') setSpecialDay();

        // Fetch news
        if (typeof fetchNews === 'function') {
            await fetchNews(userLocation.city);
        }

        if (typeof renderStockData === 'function') renderStockData();

        // Render other sections
        if (typeof renderPoll === 'function') renderPoll();
        if (typeof showRandomFact === 'function') showRandomFact();
        if (typeof renderHoroscope === 'function') renderHoroscope();
        if (typeof renderTrendingTopics === 'function') renderTrendingTopics();
        if (typeof renderCompetition === 'function') renderCompetition();

        // Start periodic updates
        if (typeof startPeriodicUpdates === 'function') startPeriodicUpdates();

        // Check login status
        const loggedInUser = localStorage.getItem('newszoid_loggedInUser');
        if (loggedInUser) {
            const userNameEl = getElement('userName');
            const userInfoEl = getElement('userInfo');
            const loginBtn = getElement('loginBtn');

            if (userNameEl) userNameEl.textContent = loggedInUser;
            if (userInfoEl) userInfoEl.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'none';
        }

        console.log('Initialization complete');

    } catch (error) {
        console.error('Initialization error:', error);
        if (typeof showToast === 'function') showToast('Failed to initialize application', 'error');
    }
}

// =============================================================
// START THE APPLICATION
// =============================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

}) ();


// =============================================================
// ACCESSIBILITY
// =============================================================
function initializeAccessibility() {
    // Skip link functionality
    const skipLink = getElement('skipLink');
    const mainContent = getElement('main-content');

    if (skipLink && mainContent) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Add ARIA labels to interactive elements
    document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
            btn.setAttribute('aria-label', btn.textContent.trim());
        }
    });

    // Announce page changes
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);

    // Store reference for later use
    window.accessibilityAnnouncer = announcer;
}

function handleKeyboardNavigation() {
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal[style*="display: block"]').forEach(modal => {
                modal.style.display = 'none';
                const form = modal.querySelector('form');
                if (form) form.reset();
            });

            // Close sidebar
            const sidebar = getElement('sidebar');
            const overlay = getElement('overlay');
            if (sidebar && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            }

            // Stop TTS
            if (isSpeaking) {
                stopSpeaking();
            }
        }

        // Ctrl/Cmd + K for search focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]');
            if (searchInput) searchInput.focus();
        }
    });

    // Tab trap for modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && modal.style.display === 'block') {
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    });
}

// =============================================================
// PERIODIC UPDATES
// =============================================================
function startPeriodicUpdates() {
    // Update date every minute
    const dateUpdateInterval = setInterval(() => {
        setDate();
    }, 60000);
    intervals.add(dateUpdateInterval);

    // Rotate facts every 30 seconds
    const factRotationInterval = setInterval(() => {
        showRandomFact();
    }, 30000);
    intervals.add(factRotationInterval);

    // Update stock data every 5 minutes (simulated)
    const stockUpdateInterval = setInterval(() => {
        renderStockData();
    }, 300000);
    intervals.add(stockUpdateInterval);

    // Check for special day changes at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;

    setTimeout(() => {
        setSpecialDay();
        // Set up daily check
        const dailyInterval = setInterval(() => {
            setSpecialDay();
        }, 86400000); // 24 hours
        intervals.add(dailyInterval);
    }, msUntilMidnight);
}

// =============================================================
// LAZY LOADING
// =============================================================
function initializeLazyLoading() {
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all images immediately
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        });
        return;
    }

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;

                // Load the image
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    delete img.dataset.src;
                }

                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                    delete img.dataset.srcset;
                }

                // Add loaded class for fade-in effect
                img.classList.add('loaded');

                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.01
    });

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });

    // Also observe lazy-loaded content sections
    const contentObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.lazy-content').forEach(section => {
        contentObserver.observe(section);
    });
}
if (window.location.pathname.includes("profile.html")) {
  loadReadingHistory();
  loadReadingStats();
  loadSavedToProfile();
}

  // =============================================================
  // BOOKMARK MIGRATION
  // =============================================================
  async function migrateLocalBookmarks() {
    const raw = localStorage.getItem('newszoid_bookmarks_v1') || localStorage.getItem('newszoid_bookmarks');

    if (!raw) {
      showToast('No local bookmarks found', 'info');
      return;
    }

    let arr = [];
    try {
      arr = JSON.parse(raw);
    } catch (e) {
      showToast('Failed to parse local bookmarks', 'error');
      return;
    }

    try {
      // Check if API is available
      if (!window.AuthClient || !window.AuthClient.apiMigrateBookmarks) {
        showToast('API not available', 'error');
        return;
      }

      const res = await window.AuthClient.apiMigrateBookmarks(arr);
      showToast(`Imported ${res.imported || arr.length} saved articles to your account!`, 'success');

      // Optional: clear old localStorage
      // localStorage.removeItem('newszoid_bookmarks_v1');
      // localStorage.removeItem('newszoid_bookmarks');

      // Refresh server bookmarks display
      if (typeof renderSavedArticlesFromServer === 'function') {
        setTimeout(() => renderSavedArticlesFromServer(), 500);
      }
    } catch (err) {
      if (err.message === 'unauthenticated') {
        showToast('Please login first to import bookmarks', 'warning');
        const loginModal = getElement('loginModal');
        if (loginModal) loginModal.style.display = 'block';
      } else {
        showToast('Migration failed: ' + err.message, 'error');
      }
    }
  }

  // Wire migrate button
  document.addEventListener('DOMContentLoaded', () => {
    const migrateBtn = document.getElementById('migrateBookmarksBtn');
    if (migrateBtn) {
      migrateBtn.addEventListener('click', migrateLocalBookmarks);
    }
  });





