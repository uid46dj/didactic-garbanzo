// Local-only persistence helpers. Nothing in this app ever leaves the
// browser: all tracking, events and scores are kept in localStorage so a
// host can resume / export a session without any network dependency.

const KEY = "reaction-game-session-v1";

export function saveSession(data: unknown) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors - session keeps running in memory
  }
}

export function loadSession<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function downloadSessionJSON(data: unknown, filename = "session-data.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
