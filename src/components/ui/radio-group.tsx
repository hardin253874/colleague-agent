import { forwardRef } from 'react';
import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type RadioGroupProps = HTMLAttributes<HTMLDivElement>;

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cn('flex items-center gap-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

const RADIO_INPUT_CLASSES =
  'w-4 h-4 rounded-full border-slate-300 text-indigo-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, className, ...rest },
  ref,
) {
  const inputId = id ?? `radio-${rest.name ?? 'x'}-${rest.value ?? ''}`;
  return (
    <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer select-none">
      <input
        ref={ref}
        id={inputId}
        type="radio"
        className={cn(RADIO_INPUT_CLASSES, className)}
        {...rest}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
});
