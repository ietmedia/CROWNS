import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { NotesPage } from "./pages/NotesPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEffect } from "react";
import { getStoredTheme, setTheme } from "./lib/theme";

export function App() {
  useEffect(() => {
    const initial = getStoredTheme();
    setTheme(initial);
  }, []);

  return (
    <BrowserRouter>
      <div className="appShell">
        <header className="topBar">
          <div className="container topBarInner">
            <a className="brand" href="/">
              <span className="brandMark" aria-hidden="true">
                ◌
              </span>
              <span className="brandText">CROWNS</span>
            </a>
            <nav className="nav">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Home
              </NavLink>
              <NavLink to="/notes" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                Notes
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => (isActive ? "navLink active" : "navLink")}>
                About
              </NavLink>
            </nav>
            <div className="topBarActions">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </div>
        </main>

        <footer className="footer">
          <div className="container footerInner">
            <span className="muted">© {new Date().getFullYear()} CROWNS</span>
            <span className="muted">Built with Vite + React + TypeScript</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

