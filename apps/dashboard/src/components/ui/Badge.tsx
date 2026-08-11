import React from 'react';

export type BadgeVariant = 'red' | 'green' | 'amber' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'red',
  children,
  icon,
  className = '',
}) => {
  let variantStyles = '';

  switch (variant) {
    case 'red':
      variantStyles = 'bg-[#db4942]/15 text-[#db4942] border border-[#db4942]/30';
      break;
    case 'green':
      variantStyles = 'bg-[#4caf50]/15 text-[#4caf50] border border-[#4caf50]/30';
      break;
    case 'amber':
      variantStyles = 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      break;
    case 'slate':
      variantStyles = 'bg-slate-500/15 text-slate-400 border border-slate-500/30';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${variantStyles} ${className}`}
    >
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
