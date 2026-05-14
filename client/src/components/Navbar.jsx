import { Search, User, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-satori-dark/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-satori-accent to-blue-400 bg-clip-text text-transparent">
        SATORI
      </Link>

      <div className="flex items-center gap-8 text-satori-muted">
        <Link to="/" className="flex items-center gap-2 hover:text-satori-text transition-colors">
          <Search size={20} /> <span>Explorer</span>
        </Link>
        <Link to="/analytics" className="flex items-center gap-2 hover:text-satori-text transition-colors">
          <BarChart3 size={20} /> <span>Analytics</span>
        </Link>
        <Link to="/dna" className="flex items-center gap-2 hover:text-satori-text transition-colors">
          <Zap size={20} /> <span>Anime DNA</span>
        </Link>
        <Link to="/profile" className="p-2 bg-satori-accent/10 rounded-full text-satori-accent hover:bg-satori-accent hover:text-white transition-all">
          <User size={20} />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
