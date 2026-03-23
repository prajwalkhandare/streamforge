import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        className="bg-gray-800 text-white px-3 py-1 rounded-l focus:outline-none focus:ring-1 focus:ring-primary w-40"
      />
      <button
        type="submit"
        className="bg-gray-700 px-3 py-1 rounded-r hover:bg-gray-600 transition"
      >
        <MagnifyingGlassIcon className="h-5 w-5" />
      </button>
    </form>
  );
};

export default SearchBar;