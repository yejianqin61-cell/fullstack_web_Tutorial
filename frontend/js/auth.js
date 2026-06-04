// 认证相关逻辑

// 获取当前登录用户
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// 检查是否已登录
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// 保存登录状态
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

// 退出登录
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// 更新导航栏
function updateNavbar() {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const user = getCurrentUser();

  if (user) {
    navLinks.innerHTML = `
      <span class="user-info">👤 ${escapeHtml(user.username)}</span>
      <a href="/create.html" class="btn-primary">✏️ 写文章</a>
      <a href="/my.html">📄 我的文章</a>
      <button onclick="logout()">🚪 退出</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a href="/login.html">登录</a>
      <a href="/register.html" class="btn-primary">注册</a>
    `;
  }
}
