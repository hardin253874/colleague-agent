'use client';

import { useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, Radio } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { WizardStep } from '@/components/WizardStep';
import { saveBasicInfo } from './actions';
import { type BasicInfoState } from './schema';

const INITIAL: BasicInfoState = { ok: false, errors: {} };

const ROLE_OPTIONS = ['PM', 'Developer', 'Designer', 'Evaluator'] as const;

const CHECKBOX_INPUT_CLASSES =
  'w-4 h-4 rounded border-slate-300 text-indigo-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';

export default function BasicInfoPage() {
  const [state, formAction] = useActionState(saveBasicInfo, INITIAL);

  return (
    <WizardStep stepNumber={1}>
      <h1 className="text-2xl font-semibold text-slate-900">Basic Information</h1>
      <p className="mt-2 text-sm text-slate-600">
        Tell us who this colleague is. Only name and at least one role are required.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name / Codename <span className="text-red-500">*</span>
          </Label>
          <Input id="name" name="name" type="text" required />
          {state.errors?.name && (
            <p className="text-xs text-red-600 mt-1">{state.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">
              Roles <span className="text-red-500">*</span>
            </legend>
            <p className="text-xs text-slate-500 mt-1">
              Select one or more. The bundled skill set is the union across selected roles.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {ROLE_OPTIONS.map((role) => {
                const inputId = `role-${role}`;
                return (
                  <label
                    key={role}
                    htmlFor={inputId}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      name="roles"
                      value={role}
                      className={CHECKBOX_INPUT_CLASSES}
                    />
                    <span className="text-sm text-slate-700">{role}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {state.errors?.roles && (
            <p className="text-xs text-red-600 mt-1">{state.errors.roles}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gender (optional)</Label>
            <RadioGroup aria-label="Gender" className="pt-2">
              <Radio name="gender" value="M" label="M" />
              <Radio name="gender" value="F" label="F" />
              <Radio name="gender" value="U" label="—" />
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mbti">MBTI (optional, <a href="https://www.16personalities.com/free-personality-test" target="_blank" className='underline'>for fun</a>)</Label>
            <Input id="mbti" name="mbti" type="text" placeholder="e.g. INTJ" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="impression">Subjective impression (optional)</Label>
          <Textarea
            id="impression"
            name="impression"
            rows={4}
            placeholder="Describe your impression of the colleague in your own words — personality, work style, anything distinctive."
          />
        </div>

        <div className="flex justify-end pt-6">
          <Button type="submit" variant="primary">Next Page</Button>
        </div>
      </form>
    </WizardStep>
  );
}
