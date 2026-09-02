import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, getTheme } from "./lib/theme";
import "./index.css";

// Set the theme before the first paint so dark mode never flashes.
applyTheme(getTheme());

createRoot(document.getElementById("root")!).render(<App />);
