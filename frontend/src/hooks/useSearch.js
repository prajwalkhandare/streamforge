import { useState, useEffect, useCallback } from 'react';
import { videoService } from '../services/video.service';
import { debounce } from '../utils/helpers';

export const useSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((term) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm.trim()) {
        setResults([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await videoService.getVideos({ search: searchTerm, limit: 50 });
        setResults(response.data?.videos || []);
        setTotal(response.data?.pagination?.total || 0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Trigger search when query changes
  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleSearch = (newQuery) => {
    setQuery(newQuery);
  };

  const submitSearch = (searchTerm) => {
    setQuery(searchTerm);
    saveRecentSearch(searchTerm);
    performSearch(searchTerm);
  };

  return {
    query,
    setQuery: handleSearch,
    results,
    loading,
    total,
    recentSearches,
    saveRecentSearch,
    clearRecentSearches,
    submitSearch,
  };
};