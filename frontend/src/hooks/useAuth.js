import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const userData = authService.getUser();
        if (userData && authService.isAuthenticated()) {
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.data?.user) {
      setUser(response.data.user);
      setIsAuthenticated(true);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUser,
  };
};