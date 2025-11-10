import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch (e) {
      return null;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    // ensure deviceId
    if (!localStorage.getItem("deviceId")) {
      localStorage.setItem("deviceId", uuidv4());
    }
  }, []);

  const login = async (email, password) => {
    const resp = await api.post("/auth/login", { email, password });
    if (resp.data?.success) {
      const { token, user } = resp.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      return { success: true, user };
    }
    return { success: false, message: resp.data?.message };
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
