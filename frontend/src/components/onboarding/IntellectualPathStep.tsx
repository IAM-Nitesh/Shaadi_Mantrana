'use client';

import { RoyalInput, RoyalSelect } from './RoyalFields';

interface IntellectualPathStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function IntellectualPathStep({ data, updateField }: IntellectualPathStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <RoyalInput 
          label="Highest Education" 
          fieldName="education"
          value={data.education || ''} 
          onChange={(e) => updateField('education', e.target.value)}
          placeholder="e.g. Masters in Architecture"
        />

        <RoyalInput 
          label="Professional Occupation" 
          fieldName="occupation"
          value={data.occupation || ''} 
          onChange={(e) => updateField('occupation', e.target.value)}
          placeholder="e.g. Senior Software Architect"
        />

        <RoyalSelect 
          label="Annual Income" 
          fieldName="annualIncome"
          value={data.annualIncome || ''}
          onChange={(e) => updateField('annualIncome', e.target.value)}
          options={[
            { value: 'Under 5L', label: 'Under 5 Lakhs' },
            { value: '5L - 10L', label: '5 Lakhs - 10 Lakhs' },
            { value: '10L - 20L', label: '10 Lakhs - 20 Lakhs' },
            { value: '20L - 50L', label: '20 Lakhs - 50 Lakhs' },
            { value: '50L - 1Cr', label: '50 Lakhs - 1 Crore' },
            { value: 'Above 1Cr', label: 'Above 1 Crore' }
          ]}
        />

        <RoyalSelect 
          label="Open to Settle Abroad?" 
          fieldName="settleAbroad"
          value={data.settleAbroad || ''}
          onChange={(e) => updateField('settleAbroad', e.target.value)}
          options={[
            { value: 'Yes', label: 'Yes, Absolutely' },
            { value: 'No', label: 'No, Prefer Home' },
            { value: 'Maybe', label: 'Open to Discussion' }
          ]}
        />
      </div>
    </div>
  );
}
