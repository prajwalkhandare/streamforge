import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const Button = ({
  children,
  to,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const baseStyles = 'rounded font-semibold transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-400',
    outline: 'border border-white text-white hover:bg-white hover:text-black focus:ring-white',
    ghost: 'text-white hover:bg-white/10 focus:ring-white',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
};

export default Button;
