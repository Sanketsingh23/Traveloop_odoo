import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

type NavbarProps = {
  onLogout?: () => void;
};

const signInHref = '/login';
const registerHref = '/register';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Trips', href: '/trips' },
  { label: 'Explore', href: '/city-search' },
  { label: 'Activities', href: '/activity-search' },
  { label: 'Budget', href: '/itinerary-budget' },
  { label: 'Checklist', href: '/packing-checklist' },
  { label: 'Profile', href: '/profile' },
];

export default function Navbar({ onLogout }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const userFromUrl = urlParams.get('user');
    const storedToken = localStorage.getItem('travelloop_token');

    const finalToken = tokenFromUrl || storedToken;

    if (finalToken) {
      if (tokenFromUrl) {
        localStorage.setItem('travelloop_token', finalToken);
        if (userFromUrl) {
          localStorage.setItem('travelloop_user', userFromUrl);
        }
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('travelloop_token');
    localStorage.removeItem('travelloop_user');
    setIsAuthenticated(false);
    if (onLogout) onLogout();
    window.location.href = '/';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '78rem',
        zIndex: 50,
      }}
    >
      <motion.div
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="liquid-glass"
        style={{
          borderRadius: '9999px',
          height: '3.5rem',
          padding: '0 0.75rem 0 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          boxShadow: scrolled
            ? '0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <div style={{ flex: '0 0 auto', paddingRight: '1rem' }}>
          <a
            href="/"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: '1.2rem',
              color: 'white',
              letterSpacing: 0,
              textDecoration: 'none',
            }}
          >
            TravelLoop
          </a>
        </div>

        <nav
          aria-label="Primary navigation"
          style={{
            display: 'flex',
            gap: '1rem',
            flex: '1 1 auto',
            justifyContent: 'center',
            minWidth: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {isAuthenticated && menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontWeight: 400,
                whiteSpace: 'nowrap',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
            <a
              href={signInHref}
              style={{
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '0.55rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'white',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              Sign in
            </a>
            <a
              href={registerHref}
              style={{
                borderRadius: '9999px',
                padding: '0.55rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#000',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: 'white',
              }}
            >
              Get started
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}
