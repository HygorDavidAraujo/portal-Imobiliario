import React from 'react';

type SkeletonProps = {
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', as = 'div' }) => {
  const Comp: any = as;
  return (
    <Comp
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 ${className}`}
    />
  );
};
