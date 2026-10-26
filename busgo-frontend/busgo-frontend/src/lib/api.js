// Backend se baat karne ka ek hi jagah.
// - access token memory me rehta hai (localStorage me nahi, taaki chori ka risk kam)
// - token expire ho to refresh cookie se naya token lekar request dobara bhejta hai

const BASE = import.meta.env.VITE_API_URL || ""; // dev me khali: vite proxy

let accessToken = null;
let refreshing = null; // ek saath kai request fail ho to refresh sirf ek baar chale

export const setToken = (t) => {
  accessToken = t;
};
export const getToken = () => accessToken;

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const parse = async (res) => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

const send = (path, { method = "GET", body, headers = {} } = {}) => {
  const isForm = body instanceof FormData;
  return fetch(`${BASE}/api${path}`, {
    method,
    credentials: "include", // refresh cookie ke liye
    headers: {
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
};

// cookie se naya access token lo (app khulte hi aur token expire hone par)
export const refreshSession = () => {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/api/auth/refresh`, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await parse(res);
        accessToken = data.token || null;
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

export async function api(path, options = {}) {
  let res = await send(path, options);

  // token expire hua to ek baar refresh karke dobara try
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const fresh = await refreshSession();
    if (fresh) res = await send(path, options);
  }

  const data = await parse(res);
  if (!res.ok) {
    throw new ApiError(res.status, data.message || "Something went wrong", data);
  }
  return data;
}
