import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const INPUT_CLASSES =
  'w-full bg-white border border-slate-300 rounded-md px-3 py-2 ' +
  'text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors duration-150 ' +
  'hover:border-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cn(INPUT_CLASSES, className)} {...rest} />;
});
