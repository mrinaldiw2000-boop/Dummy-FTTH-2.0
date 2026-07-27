/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - CORE APPLICATION LOGIC
 * Auth Guard, Theme Manager, Notifications, Counter Animations, Toast Notifications.
 */

// Initialize Local Storage Keys
const STORAGE_KEYS = {
  AUTH_USER: "ftth_auth_user",
  THEME_MODE: "ftth_theme_mode",
  PROJECT_DATA: "ftth_project_data",
  ISSUES_DATA: "ftth_issues_data"
};

// In-Memory Session Fallback (Prevents redirect loops if localStorage is blocked)
window.ftth_session = window.ftth_session || null;

/**
 * Gets active authenticated user safely
 */
function getAuthUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn("LocalStorage access warning:", e);
  }
  return window.ftth_session;
}

/**
 * Sets authenticated user safely
 */
function setAuthUser(userData) {
  window.ftth_session = userData;
  try {
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userData));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  } catch (e) {
    console.warn("LocalStorage write warning:", e);
  }
}

/**
 * Ensures user is authenticated before viewing protected pages.
 * Auto-initializes default session if navigating directly to dashboard.
 */
function checkAuthGuard() {
  const authUser = getAuthUser();
  const path = (window.location.pathname || "").toLowerCase();
  const isLoginPage = path.endsWith("login.html") || path.endsWith("index.html") || path === "/" || path.endsWith("/login");

  // Auto-login default session if visiting dashboard without auth data
  if (!authUser && !isLoginPage) {
    const defaultAuth = {
      username: "admin",
      name: "Project Administrator",
      role: "Enterprise Lead",
      loginTime: new Date().toISOString()
    };
    setAuthUser(defaultAuth);
  } else if (authUser && isLoginPage && !window.location.search.includes("logout=true")) {
    // If already logged in and visiting login page, go to dashboard
    window.location.href = "dashboard.html";
  }
}

/**
 * Loads project dataset from localStorage or initializes with default sample dataset
 * @returns {Array} Array of FTTH project records
 */
function getStoredProjectData() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECT_DATA);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to parse stored project data, loading sample data instead.", e);
  }

  // Fallback to sample dataset
  if (typeof FTTH_SAMPLE_DATASET !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_DATA, JSON.stringify(FTTH_SAMPLE_DATASET));
    } catch (e) {}
    return FTTH_SAMPLE_DATASET;
  }
  return [];
}

/**
 * Saves updated FTTH project dataset into localStorage
 * @param {Array} dataset Array of project records
 */
function saveProjectData(dataset) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECT_DATA, JSON.stringify(dataset));
  } catch (e) {
    console.warn("Failed to save project data to localStorage:", e);
  }
}

/**
 * Initializes Theme Switcher (Dark/Light mode)
 */
function initThemeManager() {
  let savedTheme = "light";
  try {
    savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_MODE) || "light";
  } catch (e) {}
  
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    updateThemeIcon(themeBtn, savedTheme);
    themeBtn.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nextTheme);
      try {
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, nextTheme);
      } catch (e) {}
      updateThemeIcon(themeBtn, nextTheme);
      showToast(`Switched to ${nextTheme.toUpperCase()} mode`, "info");
    });
  }
}

/**
 * Updates Theme Icon depending on active theme
 */
function updateThemeIcon(btn, theme) {
  const icon = btn.querySelector("i");
  if (icon) {
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

/**
 * Initializes Sidebar Collapse & Drawer logic
 */
function initSidebarManager() {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (window.innerWidth <= 992) {
        sidebar.classList.toggle("mobile-open");
      } else {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  // Highlight Active Navigation Link
  const currentPath = (window.location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  const navLinks = document.querySelectorAll(".menu-link");
  navLinks.forEach(link => {
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href === currentPath) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/**
 * Initializes Fullscreen Toggle button
 */
function initFullscreenToggle() {
  const btn = document.getElementById("fullscreen-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Fullscreen request error", err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
  }
}

/**
 * Displays Toast Notification dynamically
 * @param {string} message Message text
 * @param {string} type 'success' | 'danger' | 'warning' | 'info'
 */
function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-ftth toast-${type}`;

  const iconMap = {
    success: "fas fa-check-circle text-success",
    danger: "fas fa-exclamation-circle text-danger",
    warning: "fas fa-exclamation-triangle text-warning",
    info: "fas fa-info-circle text-primary"
  };

  const icon = document.createElement("i");
  icon.className = `${iconMap[type] || iconMap.info} fa-lg`;

  const textSpan = document.createElement("span");
  textSpan.style.fontWeight = "600";
  textSpan.style.fontSize = "0.9rem";
  textSpan.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(textSpan);
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "fadeOutRight 0.4s ease forwards";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}

/**
 * Animates numbers in KPI Cards (CountUp effect)
 * @param {HTMLElement} element Target DOM element
 * @param {number} targetValue Final value
 * @param {string} suffix Optional suffix like '%', 'HP'
 */
function animateCounter(element, targetValue, suffix = "") {
  if (!element) return;
  const duration = 1200;
  const start = 0;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuad = progress * (2 - progress);
    const currentValue = Math.floor(start + easeOutQuad * (targetValue - start));
    
    element.textContent = currentValue.toLocaleString("id-ID") + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.textContent = targetValue.toLocaleString("id-ID") + suffix;
    }
  }

  requestAnimationFrame(updateNumber);
}

/**
 * Updates Notification Badge Color depending on Overall Achievement Threshold
 * Thresholds: <50% Red, 50-80% Yellow, >80% Green
 * @param {number} achievementPercentage Overall project achievement rate
 */
function updateNotificationBadge(achievementPercentage) {
  const badge = document.getElementById("notification-badge");
  if (!badge) return;

  if (achievementPercentage < 50) {
    badge.style.backgroundColor = "var(--danger-color)";
    badge.setAttribute("title", `Warning: Low Achievement (${achievementPercentage.toFixed(1)}%)`);
  } else if (achievementPercentage <= 80) {
    badge.style.backgroundColor = "var(--warning-color)";
    badge.setAttribute("title", `Notice: Moderate Achievement (${achievementPercentage.toFixed(1)}%)`);
  } else {
    badge.style.backgroundColor = "var(--success-color)";
    badge.setAttribute("title", `Great Job: High Achievement (${achievementPercentage.toFixed(1)}%)`);
  }
}

/**
 * User Logout Handler
 */
function initLogoutHandler() {
  const logoutBtns = document.querySelectorAll(".logout-trigger");
  logoutBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setAuthUser(null);
      showToast("Logging out...", "info");
      setTimeout(() => {
        window.location.href = "login.html?logout=true";
      }, 300);
    });
  });
}

/**
 * Hides Loading Screen once document is fully initialized
 */
function hideLoadingScreen() {
  const screen = document.getElementById("loading-screen");
  if (screen) {
    screen.classList.add("hidden");
  }
}

// Emergency auto-hide for loading screen after 400ms
setTimeout(hideLoadingScreen, 400);

// Global Document Loaded Initialization
document.addEventListener("DOMContentLoaded", () => {
  checkAuthGuard();
  initThemeManager();
  initSidebarManager();
  initFullscreenToggle();
  initLogoutHandler();
  hideLoadingScreen();
});
