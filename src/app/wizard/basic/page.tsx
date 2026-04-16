'use client';

import { useActionState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { RadioGroup, Radio } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { WizardStep } from '@/components/WizardStep';
import { saveBasicInfo, type BasicInfoState } from './actions';

const INITIAL: BasicInfoState = { ok: false, errors: {} };

export default function BasicInfoPage() {
  const [state, formAction] = useActionState(saveBasicInfo, INITIAL);

  return (
    <WizardStep stepNumber={1}>
      <h1 className="text-2xl font-semibold text-slate-900">Basic Information</h1>
      <p className="mt-2 text-sm text-slate-600">
        Tell us who this colleague is. Only name and role are required.
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
          <Label htmlFor="role">
            Role <span className="text-red-500">*</span>
          </Label>
          <Select id="role" name="role" required defaultValue="">
            <option value="" disabled>Select role...</option>
            <option value="PM">PM</option>
            <option value="Developer">Developer</option>
            <option value="Designer">Designer</option>
            <option value="Evaluator">Evaluator</option>
          </Select>
          {state.errors?.role && (
            <p className="text-xs text-red-600 mt-1">{state.errors.role}</p>
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
            <Label htmlFor="mbti">MBTI (optional, for fun)</Label>
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
