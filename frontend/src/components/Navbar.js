import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SearchBar from './SearchBar';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full bg-gradient-to-b from-black to-transparent z-50 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="text-primary text-2xl font-bold">STREAMFORGE</Link>
        
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/browse" className="hover:text-gray-300 transition">Browse</Link>
            <Link to="/my-list" className="hover:text-gray-300 transition">My List</Link>
            <SearchBar />
            
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="flex items-center space-x-2">
                <img 
                  src={user?.avatar_url || 'https://via.placeholder.com/32'} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm">{user?.username}</span>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-darker rounded shadow-lg border border-gray-700">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-gray-800 transition">Profile</Link>
                  <Link to="/settings" className="block px-4 py-2 hover:bg-gray-800 transition">Settings</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-800 transition">Logout</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;