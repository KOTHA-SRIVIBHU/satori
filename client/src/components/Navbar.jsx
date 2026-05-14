import { Search, User, BarChart3, Zap, LogOut, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const navLinks = [
    { path: '/', icon: Search, label: 'Explorer' },
    { path: '/list', icon: BarChart3, label: 'My List' }, // Changed Analytics to My List for now
    { path: '/dna', icon: Zap, label: 'Anime DNA' },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-[100] bg-[#050507]/60 backdrop-blur-xl border-b border-white/[0.05] px-8 py-4 flex items-center justify-between"
    >
      <Link to="/" className="group flex items-center gap-2">
        <div className="w-8 h-8 bg-satori-accent rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
          <Zap size={18} className="text-white fill-current" />
        </div>
        <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent group-hover:from-satori-accent group-hover:to-blue-400 transition-all">
          SATORI
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isActive ? 'text-white' : 'text-satori-muted hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{link.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-white/[0.05] rounded-full -z-10 border border-white/[0.05]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
        <div className="w-px h-4 bg-white/10 mx-4" />
        
        {user ? (
          <div className="flex items-center gap-3">
            <Link 
              to="/profile" 
              className="p-2.5 bg-satori-accent/10 rounded-xl text-satori-accent hover:bg-satori-accent hover:text-white transition-all shadow-lg hover:shadow-satori-accent/20"
            >
              <User size={18} />
            </Link>
            <button 
              onClick={logout}
              className="p-2.5 bg-red-500/10 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-4 py-2 bg-satori-accent text-white rounded-lg font-medium hover:bg-purple-600 transition-all shadow-lg shadow-satori-accent/20"
          >
            <LogIn size={18} />
            <span>Login</span>
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
