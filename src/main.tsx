import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug: surface env variables in console for OAuth troubleshooting
console.log("VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID);

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
