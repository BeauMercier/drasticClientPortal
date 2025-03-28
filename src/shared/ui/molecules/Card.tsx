import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string | ReactNode;
  icon?: ReactNode;
  className?: string;
  footer?: ReactNode;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  icon,
  className = '',
  footer,
  noPadding = false,
}) => {
  return (
    <div className={`bg-white dark:bg-black rounded-lg shadow-md border border-gray-200 dark:border-gray-900 overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-900 flex items-center justify-between">
          {typeof title === 'string' ? (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          ) : (
            title
          )}
          {icon && <div>{icon}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-900">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 