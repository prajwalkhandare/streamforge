import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      // Theme state
      theme: 'dark',
      sidebarOpen: false,
      modalOpen: false,
      modalContent: null,
      modalTitle: '',
      sidebarOpen: false,
      
      // Toast state
      toast: {
        show: false,
        message: '',
        type: 'info', // info, success, error, warning
        duration: 3000,
      },
      
      // Loading states
      globalLoading: false,
      loadingOverlay: false,
      
      // Search state
      searchOpen: false,
      searchQuery: '',
      
      // Navigation
      currentRoute: '/',
      
      // Actions
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          return { theme: newTheme };
        }),
      
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      openSidebar: () => set({ sidebarOpen: true }),
      
      closeSidebar: () => set({ sidebarOpen: false }),
      
      // Modal actions
      openModal: (content, title = '') =>
        set({
          modalOpen: true,
          modalContent: content,
          modalTitle: title,
        }),
      
      closeModal: () =>
        set({
          modalOpen: false,
          modalContent: null,
          modalTitle: '',
        }),
      
      // Toast actions
      showToast: (message, type = 'info', duration = 3000) =>
        set({
          toast: {
            show: true,
            message,
            type,
            duration,
          },
        }),
      
      hideToast: () =>
        set({
          toast: {
            show: false,
            message: '',
            type: 'info',
            duration: 3000,
          },
        }),
      
      // Loading actions
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      
      showLoadingOverlay: () => set({ loadingOverlay: true }),
      
      hideLoadingOverlay: () => set({ loadingOverlay: false }),
      
      // Search actions
      openSearch: () => set({ searchOpen: true }),
      
      closeSearch: () => set({ searchOpen: false, searchQuery: '' }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Navigation
      setCurrentRoute: (route) => set({ currentRoute: route }),
      
      // Reset all UI state
      resetUI: () =>
        set({
          sidebarOpen: false,
          modalOpen: false,
          modalContent: null,
          modalTitle: '',
          toast: { show: false, message: '', type: 'info', duration: 3000 },
          globalLoading: false,
          loadingOverlay: false,
          searchOpen: false,
          searchQuery: '',
        }),
    }),
    {
      name: 'ui-storage',
      getStorage: () => localStorage,
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);