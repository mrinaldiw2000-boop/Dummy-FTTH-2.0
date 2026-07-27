/**
 * PROJECT FTTH ENTERPRISE DASHBOARD - LOGIN MODULE
 * Validates credentials (admin / 12345) and handles session routing.
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const rememberCheckbox = document.getElementById("remember-me");
  const forgotBtn = document.getElementById("forgot-password-btn");
  const demoAccessBtn = document.getElementById("demo-access-btn");

  // Load remembered username if present
  try {
    const rememberedUser = localStorage.getItem("ftth_remembered_username");
    if (rememberedUser && usernameInput) {
      usernameInput.value = rememberedUser;
      if (rememberCheckbox) rememberCheckbox.checked = true;
    }
  } catch(e) {}

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();

      // Check default credentials or allow any login in demo mode
      if ((username === "admin" && password === "12345") || username.length > 0) {
        try {
          if (rememberCheckbox && rememberCheckbox.checked) {
            localStorage.setItem("ftth_remembered_username", username);
          } else {
            localStorage.removeItem("ftth_remembered_username");
          }
        } catch(e) {}

        const authData = {
          username: username || "admin",
          name: username === "admin" ? "Project Administrator" : username,
          role: "Enterprise Lead",
          loginTime: new Date().toISOString()
        };

        if (typeof setAuthUser === "function") {
          setAuthUser(authData);
        } else {
          try {
            localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authData));
          } catch(e) {}
        }

        if (typeof showToast === "function") {
          showToast("Login Successful! Redirecting...", "success");
        }

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 300);
      } else {
        if (typeof showToast === "function") {
          showToast("Invalid Username or Password! (Default: admin / 12345)", "danger");
        }
      }
    });
  }

  if (demoAccessBtn) {
    demoAccessBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const authData = {
        username: "admin",
        name: "Project Administrator",
        role: "Enterprise Lead",
        loginTime: new Date().toISOString()
      };
      if (typeof setAuthUser === "function") {
        setAuthUser(authData);
      }
      window.location.href = "dashboard.html";
    });
  }

  if (forgotBtn) {
    forgotBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof showToast === "function") {
        showToast("Default credentials: Username: admin, Password: 12345", "info");
      }
    });
  }
});
