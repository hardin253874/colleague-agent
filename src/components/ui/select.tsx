import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const SELECT_CLASSES =
  'w-full bg-white border border-slate-300 rounded-md px-3 py-2 ' +
  'text-sm text-slate-900 ' +
  'transition-colors duration-150 ' +
  'hover:border-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cn(SELECT_CLASSES, className)} {...rest}>
      {children}
    </select>
  );
});
