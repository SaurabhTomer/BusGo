import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, refreshSession, setToken } from "../lib/api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // app khulte hi session check ho raha hai

  const loadMe = useCallback(async () => {
    const data = await api("/auth/me");
    setUser(data.user);
    return data.user;
  }, []);

  // app khulte hi: refresh cookie se session wapas
  useEffect(() => {
    (async () => {
      try {
        const token = await refreshSession();
        if (token) await loadMe();
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  // login / signup / operator signup ke baad token set karke user lao
  const startSession = async (token) => {
    setToken(token);
    return loadMe();
  };

  const login = async (email, password) => {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    return startSession(data.token);
  };

  const signup = async (form) => {
    const data = await api("/auth/signup", { method: "POST", body: form });
    return startSession(data.token);
  };

  const operatorSignup = async (form) => {
    const data = await api("/operators/signup", { method: "POST", body: form });
    return startSession(data.token);
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* cookie pehle hi gayi ho to bhi nikalna hai */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, operatorSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
