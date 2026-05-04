document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  const switchTab = (tab) => {
    if (tab === 'login') {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      tabLogin.classList.add('active');
      tabSignup.classList.remove('active');
    } else {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
      tabSignup.classList.add('active');
      tabLogin.classList.remove('active');
    }
  };

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabSignup.addEventListener('click', () => switchTab('signup'));
  document.getElementById('go-signup').addEventListener('click', (e) => { e.preventDefault(); switchTab('signup'); });
  document.getElementById('go-login').addEventListener('click', (e) => { e.preventDefault(); switchTab('login'); });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Logging in...';
    try {
      const data = await api.login({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Welcome back, ' + data.user.name + '!', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  // Signup
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signupForm.querySelector('button[type=submit]');
    const pw = document.getElementById('signup-password').value;
    const pw2 = document.getElementById('signup-password2').value;
    if (pw !== pw2) { showToast('Passwords do not match', 'error'); return; }
    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      const data = await api.signup({
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password: pw
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('Account created! Welcome aboard 🎉', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Create Account';
    }
  });
});
