'use client';

import { RoyalInput, RoyalSelect } from './RoyalFields';

interface PhysicalVitalityStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

const COMPLEXION_OPTIONS = [
  { value: 'Fair', label: 'Fair' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Dark', label: 'Dark' }
];

const HABIT_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Occasionally', label: 'Occasionally' },
  { value: 'Yes', label: 'Yes' }
];

const HEIGHT_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const f = Math.floor(i / 12) + 4;
  const inc = i % 12;
  return { value: `${f}'${inc}"`, label: `${f} ft ${inc} in` };
});

export default function PhysicalVitalityStep({ data, updateField }: PhysicalVitalityStepProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <RoyalSelect 
          label="Height" 
          fieldName="height"
          value={data.height || ''} 
          onChange={(e) => updateField('height', e.target.value)}
          options={HEIGHT_OPTIONS}
        />
        <RoyalInput 
          label="Weight" 
          fieldName="weight"
          value={data.weight || ''} 
          onChange={(e) => updateField('weight', e.target.value)}
          placeholder="e.g. 70"
          inputMode="numeric"
        />
      </div>

      <RoyalSelect 
        label="Complexion" 
        fieldName="complexion"
        value={data.complexion || ''}
        onChange={(e) => updateField('complexion', e.target.value)}
        options={COMPLEXION_OPTIONS}
      />

      <div className="space-y-6 pt-4">
        <h3 className="text-royal-gold/60 text-[10px] uppercase tracking-[0.2em] mb-4">Lifestyle Habits</h3>
        
        <RoyalSelect 
          label="Eating Habit" 
          fieldName="eatingHabit"
          value={data.eatingHabit || ''}
          onChange={(e) => updateField('eatingHabit', e.target.value)}
          options={[
            { value: 'Vegetarian', label: 'Vegetarian' },
            { value: 'Non-Vegetarian', label: 'Non-Vegetarian' },
            { value: 'Eggetarian', label: 'Eggetarian' }
          ]}
        />

        <RoyalSelect 
          label="Smoking Habit" 
          fieldName="smokingHabit"
          value={data.smokingHabit || ''}
          onChange={(e) => updateField('smokingHabit', e.target.value)}
          options={HABIT_OPTIONS}
        />

        <RoyalSelect 
          label="Drinking Habit" 
          fieldName="drinkingHabit"
          value={data.drinkingHabit || ''}
          onChange={(e) => updateField('drinkingHabit', e.target.value)}
          options={HABIT_OPTIONS}
        />
      </div>
    </div>
  );
}
