import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Details from './pages/Details';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import MyList from './pages/MyList';
import ListView from './pages/ListView';

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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/list" element={<MyList />} />
            <Route path="/lists/:id" element={<ListView />} />
            {/* We will add more routes here soon */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
