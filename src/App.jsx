import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase, signInWithGoogle, signOut, isModerator } from './lib/supabase';
import Library from './pages/Library';
import CourseDetail from './pages/CourseDetail';
import Upload from './pages/Upload';
import MyUploads from './pages/MyUploads';
import Admin from './pages/Admin';

const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

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

  const isActive = (path) => location.pathname === path ? 'active' : '';

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, isMod }}>
      <div className="app">
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="header-logo">FMS Notes</Link>
            <nav className="header-nav">
              <Link to="/" className={isActive('/')}>Library</Link>
              <Link to="/upload" className={isActive('/upload')}>Upload</Link>
              {user && <Link to="/mine" className={isActive('/mine')}>My Uploads</Link>}
              {isMod && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
              {user ? (
                <button onClick={() => signOut()}>Sign Out</button>
              ) : (
                <button onClick={() => signInWithGoogle()}>Sign In</button>
              )}
            </nav>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/course/:code" element={<CourseDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/mine" element={<MyUploads />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
