export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function queryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request(method, path, body, headers = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check that it is running and try again.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body (e.g. proxy error page) - fall through to a generic message.
  }

  if (!res.ok) {
    if (res.status === 401 && onUnauthorized && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.fields || {});
  }
  return data;
}

export const api = {
  get: (path, params) => request('GET', `${path}${queryString(params)}`),
  post: (path, body = {}, headers) => request('POST', path, body, headers),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};

export async function downloadCsv(path, params, filename) {
  const res = await fetch(`/api${path}${queryString(params)}`, { credentials: 'same-origin' });
  if (!res.ok) throw new ApiError('Could not export the file.', res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
