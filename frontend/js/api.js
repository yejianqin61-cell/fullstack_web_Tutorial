// API 请求封装
const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    // 401 自动清除 token
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    throw new Error(data.error || '请求失败');
  }

  return data;
}

// GET 请求
function get(url) {
  return request(url, { method: 'GET' });
}

// POST 请求
function post(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(body) });
}

// PUT 请求
function put(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

// DELETE 请求
function del(url) {
  return request(url, { method: 'DELETE' });
}
