import React from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  ...props
}) => {
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles =
        'bg-[#db4942] hover:bg-[#c43b35] text-white border-0 font-medium';
      break;
    case 'outline':
      variantStyles =
        'bg-color-bg-card hover:bg-primary-red-muted text-[#db4942] border border-[#db4942] font-medium';
      break;
    case 'ghost':
      variantStyles =
        'bg-transparent hover:bg-color-bg-card text-color-text-muted hover:text-color-text-main border border-transparent';
      break;
    case 'danger':
      variantStyles =
        'bg-[#db4942]/15 hover:bg-[#db4942]/25 text-[#db4942] border border-[#db4942]/30 font-medium';
      break;
  }

  return (
    <button
      className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
