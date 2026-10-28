import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  };

  return (
    <div
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
      className={`animate-pulse bg-slate-200 dark:bg-[#202924] ${variantClasses[variant]} ${className}`}
    />
  );
};
