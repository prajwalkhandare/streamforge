// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password (min 6 chars, at least one letter and one number)
export const isValidPassword = (password) => {
  if (!password || password.length < 6) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

// Validate strong password (uppercase, lowercase, number, special char, min 8)
export const isStrongPassword = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// Validate username (alphanumeric, underscore, 3-20 chars)
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Validate phone number (10 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate video ID format
export const isValidVideoId = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Validate date
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Validate age (minimum age)
export const isValidAge = (birthDate, minAge = 13) => {
  if (!isValidDate(birthDate)) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= minAge;
};

// Validate required field
export const isRequired = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// Validate min length
export const minLength = (value, length) => {
  if (!value) return false;
  return String(value).length >= length;
};

// Validate max length
export const maxLength = (value, length) => {
  if (!value) return true;
  return String(value).length <= length;
};

// Validate numeric
export const isNumeric = (value) => {
  return /^[0-9]+$/.test(String(value));
};

// Validate integer
export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

// Validate range (min-max)
export const isInRange = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
};

// Validate rating (1-10)
export const isValidRating = (rating) => {
  return isInRange(rating, 1, 10);
};

// Validate file type
export const isValidFileType = (file, allowedTypes) => {
  if (!file) return false;
  return allowedTypes.includes(file.type);
};

// Validate file size (in bytes)
export const isValidFileSize = (file, maxSize) => {
  if (!file) return false;
  return file.size <= maxSize;
};

// Validate image file (jpg, png, gif, webp)
export const isValidImage = (file) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return isValidFileType(file, allowedImageTypes);
};

// Validate video file
export const isValidVideoFile = (file) => {
  const allowedVideoTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov', 'video/webm'];
  return isValidFileType(file, allowedVideoTypes);
};

// Get validation error message
export const getValidationMessage = (field, rule, value) => {
  const messages = {
    required: `${field} is required`,
    email: `Please enter a valid ${field}`,
    minLength: `${field} must be at least ${rule.value} characters`,
    maxLength: `${field} must be at most ${rule.value} characters`,
    password: `${field} must be at least 6 characters with at least one letter and one number`,
    strongPassword: `${field} must contain uppercase, lowercase, number, and special character`,
    username: `${field} must be 3-20 characters (letters, numbers, underscore)`,
    phone: `${field} must be 10 digits`,
    url: `Please enter a valid URL`,
    numeric: `${field} must be a number`,
    range: `${field} must be between ${rule.min} and ${rule.max}`,
    rating: `${field} must be between 1 and 10`,
  };
  return messages[rule] || `Invalid ${field}`;
};

// Validation rules object
export const validators = {
  email: (value) => ({ valid: isValidEmail(value), message: 'Invalid email address' }),
  password: (value) => ({ valid: isValidPassword(value), message: 'Password must be at least 6 characters with at least one letter and one number' }),
  strongPassword: (value) => ({ valid: isStrongPassword(value), message: 'Password must contain uppercase, lowercase, number, and special character' }),
  username: (value) => ({ valid: isValidUsername(value), message: 'Username must be 3-20 characters (letters, numbers, underscore)' }),
  required: (value) => ({ valid: isRequired(value), message: 'This field is required' }),
  minLength: (value, length) => ({ valid: minLength(value, length), message: `Must be at least ${length} characters` }),
  maxLength: (value, length) => ({ valid: maxLength(value, length), message: `Must be at most ${length} characters` }),
  numeric: (value) => ({ valid: isNumeric(value), message: 'Must be a number' }),
  phone: (value) => ({ valid: isValidPhone(value), message: 'Must be 10 digits' }),
  url: (value) => ({ valid: isValidUrl(value), message: 'Invalid URL' }),
  rating: (value) => ({ valid: isValidRating(value), message: 'Rating must be between 1 and 10' }),
};