import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("cloudops_theme");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, []);

  return <AppRoutes />;
}