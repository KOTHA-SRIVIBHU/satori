import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Details from './pages/Details';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-satori-dark">
        <Navbar />
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/anime/:id" element={<Details />} />
            <Route path="/profile" element={<Profile />} />
            {/* We will add more routes here soon */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
