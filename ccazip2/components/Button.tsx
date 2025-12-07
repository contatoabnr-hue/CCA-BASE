import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-300 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark disabled:opacity-50 disabled:cursor-not-allowed border";
  
  const variants = {
    primary: "bg-surface border-primary/30 text-primary hover:border-magic hover:text-magic hover:shadow-[0_0_15px_rgba(63,222,224,0.3)] active:bg-stone-900 focus:ring-magic",
    secondary: "bg-transparent border-primary/20 text-primary/80 hover:border-magic hover:text-magic hover:bg-white/5 focus:ring-primary",
    ghost: "bg-transparent border-transparent text-primary/60 hover:text-magic hover:bg-white/5 focus:ring-primary",
    danger: "bg-red-900/20 border-red-900/50 text-red-400 hover:bg-red-900/40 hover:border-red-500 focus:ring-red-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};