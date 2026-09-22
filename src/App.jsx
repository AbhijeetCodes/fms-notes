import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { supabase, signInWithGoogle, signOut, isModerator } from './lib/supabase';
import { IconLibrary, IconCalendar, IconUpload, IconFiles, IconShield } from './components/Icons';
import Library from './pages/Library';
import Calendar from './pages/Calendar';
import CourseDetail from './pages/CourseDetail';
import Upload from './pages/Upload';
import MyUploads from './pages/MyUploads';
import Admin from './pages/Admin';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function firstName(user) {
  const full = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  return full.split(/[\s@]/)[0] || 'You';
}

function initials(user) {
  return (firstName(user)[0] || '?').toUpperCase();
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        isModerator(session.user.email).then(setIsMod);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        isModerator(session.user.email).then(setIsMod);
      } else {
        setIsMod(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll to the top whenever the route changes — otherwise a deep-scrolled
  // library keeps its offset on a course page and the title is off-screen.
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <AuthContext.Provider value={{ user, isMod }}>
      <div className="app">
        <a className="skip-link" href="#main">Skip to content</a>

        <header className="header">
          <div className="header-inner">
            <Link to="/" className="header-logo">
              <span className="logo-icon" aria-hidden="true">FMS</span>
              FMS Notes
            </Link>

            <nav className="header-nav" aria-label="Main">
              <span className="nav-links">
                <Link to="/" className={isActive('/')}>Library</Link>
                <Link to="/calendar" className={isActive('/calendar')}>Calendar</Link>
                <Link to="/upload" className={isActive('/upload')}>Upload</Link>
                {user && <Link to="/mine" className={isActive('/mine')}>My Uploads</Link>}
                {isMod && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
              </span>

              {user ? (
                <span className="header-auth">
                  <span className="header-user" title={user.email}>
                    <span className="avatar" aria-hidden="true">{initials(user)}</span>
                    <span className="name">{firstName(user)}</span>
                  </span>
                  <button className="sign-out-btn" onClick={() => signOut()}>Sign out</button>
                </span>
              ) : (
                <button className="sign-in-btn" onClick={() => signInWithGoogle()}>
                  Sign in
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className="main" id="main">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/course/:code" element={<CourseDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/mine" element={<MyUploads />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>

        {/* Sign-off belongs at the end of the library, not under every page */}
        {location.pathname === '/' && (
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-brand">An initiative by FMS students</div>
              <div className="footer-text">{'Built by Abhijeet with coffee ☕ & tokens 🤖'}</div>
            </div>
          </footer>
        )}

        {/* Thumb-reachable navigation on phones, where most of the traffic lands from WhatsApp */}
        <nav className="tabbar" aria-label="Main (mobile)">
          <div className="tabbar-inner">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>
              <IconLibrary className="tab-icon" />
              Library
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => isActive ? 'active' : undefined}>
              <IconCalendar className="tab-icon" />
              Calendar
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `tab-upload${isActive ? ' active' : ''}`}>
              <IconUpload className="tab-icon" />
              Upload
            </NavLink>
            {user && (
              <NavLink to="/mine" className={({ isActive }) => isActive ? 'active' : undefined}>
                <IconFiles className="tab-icon" />
                Mine
              </NavLink>
            )}
            {isMod && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : undefined}>
                <IconShield className="tab-icon" />
                Admin
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
