// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  VIDEOS: {
    BASE: '/videos',
    FEATURED: '/videos/featured',
    TRENDING: '/videos/trending',
    HISTORY: '/videos/history',
    RELATED: (id) => `/videos/${id}/related`,
    WATCH: (id) => `/videos/${id}/watch`,
    LIKE: (id) => `/videos/${id}/like`,
    UNLIKE: (id) => `/videos/${id}/unlike`,
    COMMENTS: (id) => `/videos/${id}/comments`,
  },
  USERS: {
    PROFILE: '/users/profile',
    HISTORY: '/users/history',
    MY_LIST: '/users/my-list',
    PREFERENCES: '/users/preferences',
    RATINGS: '/users/ratings',
  },
  SEARCH: {
    BASE: '/search',
    SUGGESTIONS: '/search/suggestions',
    TRENDING: '/search/trending',
    HISTORY: '/search/history',
    FILTERS: '/search/filters',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    VIDEOS: '/admin/videos',
    CATEGORIES: '/admin/categories',
    ANALYTICS: '/admin/analytics',
    CONFIG: '/admin/config',
  },
};

// App constants
export const APP_NAME = 'StreamForge';
export const APP_VERSION = '1.0.0';
export const DEFAULT_AVATAR = 'https://via.placeholder.com/100';
export const DEFAULT_THUMBNAIL = 'https://via.placeholder.com/300x200';

// Video quality options
export const VIDEO_QUALITIES = [
  { value: 'auto', label: 'Auto' },
  { value: '1080p', label: '1080p' },
  { value: '720p', label: '720p' },
  { value: '480p', label: '480p' },
  { value: '360p', label: '360p' },
];

// Video categories
export const VIDEO_CATEGORIES = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Documentary',
  'Animation',
  'Family',
];

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Toast messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Registration successful! Please login.',
  PROFILE_UPDATED: 'Profile updated successfully',
  ADDED_TO_LIST: 'Added to My List',
  REMOVED_FROM_LIST: 'Removed from My List',
  LIKED: 'Liked!',
  UNLIKED: 'Removed like',
  ERROR: 'Something went wrong',
  NETWORK_ERROR: 'Network error. Please check your connection',
  SESSION_EXPIRED: 'Session expired. Please login again',
};

// Error messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must be at least 6 characters',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TAKEN: 'Username already taken',
  EMAIL_TAKEN: 'Email already registered',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCESS_DENIED: 'You do not have permission to access this resource',
  NOT_FOUND: 'Resource not found',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  RECENT_SEARCHES: 'recentSearches',
  PREFERENCES: 'preferences',
  WATCH_HISTORY: 'watchHistory',
};

// Route paths
export const ROUTES = {
  HOME: '/',
  BROWSE: '/browse',
  WATCH: (id) => `/watch/${id}`,
  VIDEO_DETAILS: (id) => `/video/${id}`,
  SEARCH: '/search',
  PROFILE: '/profile',
  MY_LIST: '/my-list',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: '/admin',
};

// Regex patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^[0-9]{10}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};