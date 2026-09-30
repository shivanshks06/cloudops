import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudops_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("cloudops_token") || null);

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudops_projects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeProject, setActiveProjectState] = useState(() => {
    try {
      const saved = localStorage.getItem("cloudops_active_project");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync token and active project ID with axios interceptors
  useEffect(() => {
    const reqInterceptor = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("cloudops_token");
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      const storedProject = localStorage.getItem("cloudops_active_project");
      if (storedProject) {
        try {
          const parsed = JSON.parse(storedProject);
          if (parsed?.id) {
            config.headers["x-project-id"] = parsed.id;
          }
        } catch {}
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(reqInterceptor);
    };
  }, []);

  const setActiveProject = (proj) => {
    setActiveProjectState(proj);
    if (proj) {
      localStorage.setItem("cloudops_active_project", JSON.stringify(proj));
    } else {
      localStorage.removeItem("cloudops_active_project");
    }
  };

  const refreshProjects = async () => {
    try {
      const res = await api.get("/projects");
      if (res.data?.data) {
        setProjects(res.data.data);
        localStorage.setItem("cloudops_projects", JSON.stringify(res.data.data));
        if (!activeProject && res.data.data.length > 0) {
          setActiveProject(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to refresh projects:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("cloudops_token");
      if (savedToken) {
        try {
          const res = await api.get("/auth/me");
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("cloudops_user", JSON.stringify(res.data.user));
          }
          if (res.data?.projects) {
            setProjects(res.data.projects);
            localStorage.setItem("cloudops_projects", JSON.stringify(res.data.projects));
            if (!activeProject && res.data.projects.length > 0) {
              setActiveProject(res.data.projects[0]);
            }
          }
        } catch (err) {
          console.warn("Session expired or invalid token:", err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser, projects: newProjects, activeProject: defaultProj } = res.data;

    setToken(newToken);
    setUser(newUser);
    setProjects(newProjects || []);

    localStorage.setItem("cloudops_token", newToken);
    localStorage.setItem("cloudops_user", JSON.stringify(newUser));
    localStorage.setItem("cloudops_projects", JSON.stringify(newProjects || []));

    const selected = defaultProj || newProjects?.[0] || null;
    setActiveProject(selected);

    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await api.post("/auth/signup", { name, email, password });
    const { token: newToken, user: newUser, projects: newProjects, activeProject: defaultProj } = res.data;

    setToken(newToken);
    setUser(newUser);
    setProjects(newProjects || []);

    localStorage.setItem("cloudops_token", newToken);
    localStorage.setItem("cloudops_user", JSON.stringify(newUser));
    localStorage.setItem("cloudops_projects", JSON.stringify(newProjects || []));

    setActiveProject(defaultProj || newProjects?.[0] || null);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProjects([]);
    setActiveProjectState(null);
    localStorage.removeItem("cloudops_token");
    localStorage.removeItem("cloudops_user");
    localStorage.removeItem("cloudops_projects");
    localStorage.removeItem("cloudops_active_project");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        projects,
        activeProject,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        signup,
        logout,
        setActiveProject,
        refreshProjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
