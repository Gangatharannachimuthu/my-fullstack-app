import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_KEY = 'mandram.serverUrl';
const USER_KEY = 'mandram.user';

/**
 * A phone cannot reach the backend on `localhost`, and the PC's address changes
 * between networks, so the server address is configured in the app and kept on the
 * device rather than baked in at build time. Held in a module variable as well as
 * storage so every request does not have to await AsyncStorage.
 */
let serverUrl = null;
let username = null;

export const api = axios.create({ timeout: 20000 });

api.interceptors.request.use((config) => {
  if (serverUrl) config.baseURL = `${serverUrl}/api`;
  // Same header the web client sends; the backend authorises admin routes off it.
  if (username) config.headers['X-Username'] = username;
  config.headers['Content-Type'] = 'application/json';
  return config;
});

/** Trim, add a scheme if missing, and drop any trailing slash or /api suffix. */
export function normalizeServerUrl(raw) {
  let url = (raw || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/api$/i, '');
  return url;
}

export function getServerUrl() {
  return serverUrl;
}

export async function setServerUrl(raw) {
  serverUrl = normalizeServerUrl(raw);
  await AsyncStorage.setItem(SERVER_KEY, serverUrl);
  return serverUrl;
}

export function setUsername(name) {
  username = name || null;
}

export async function loadSession() {
  const [storedServer, storedUser] = await Promise.all([
    AsyncStorage.getItem(SERVER_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);
  serverUrl = storedServer || null;
  const user = storedUser ? JSON.parse(storedUser) : null;
  username = user?.username || null;
  return { serverUrl, user };
}

export async function saveUser(user) {
  username = user?.username || null;
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}

/**
 * Reach the server without the /api prefix, to tell "wrong address" apart from
 * "address fine, credentials wrong" while the user is setting things up.
 */
export async function testConnection(raw) {
  const url = normalizeServerUrl(raw);
  if (!url) return { ok: false, message: 'Enter a server address' };
  try {
    const res = await axios.get(`${url}/health`, { timeout: 8000 });
    if (res.data?.status === 'healthy') return { ok: true, message: `Connected to ${url}` };
    return { ok: false, message: 'That address answered, but it is not the Mandram server.' };
  } catch (err) {
    return { ok: false, message: describeNetworkError(err, url) };
  }
}

/** Network failures on a phone are usually address problems - say which one. */
export function describeNetworkError(err, url) {
  if (err?.response) {
    return err.response.data?.error || `Server returned ${err.response.status}`;
  }
  if (err?.code === 'ECONNABORTED') {
    return `Timed out reaching ${url || 'the server'}. Is the phone on the same WiFi as the PC?`;
  }
  return (
    `Could not reach ${url || 'the server'}. Check the address, that the backend is running, ` +
    `and that the phone is on the same network.`
  );
}

/** Pull a readable message out of any axios error. */
export function errorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.error || (err?.request ? describeNetworkError(err) : fallback);
}
