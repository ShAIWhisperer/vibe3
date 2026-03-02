/**
 * ROUTING RULES:
 * - Router is in main.tsx. Do NOT add another <BrowserRouter> here or anywhere.
 * - Use <Routes> + <Route> components ONLY. Do NOT use useRoutes().
 * - STATIC IMPORTS ONLY — no React.lazy() or dynamic import().
 * - Import from 'react-router' — NOT 'react-router-dom' (does not exist).
 */
import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router";
import ReactGA from "react-ga4";
import Index from "./pages/Index";
import SharedSession from "./pages/SharedSession";

// Initialize Google Analytics
ReactGA.initialize("G-J677YL5S4K");

// Main App component with routing - updated for multi-module synth
function App() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/s/:slug" element={<SharedSession />} />
    </Routes>
  );
}

export default App;
