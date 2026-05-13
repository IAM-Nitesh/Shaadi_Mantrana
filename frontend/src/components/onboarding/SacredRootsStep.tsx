'use client';

import { RoyalInput, RoyalSelect } from './RoyalFields';

interface SacredRootsStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function SacredRootsStep({ data, updateField }: SacredRootsStepProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <RoyalSelect 
          label="Marital Status" 
          value={data.maritalStatus || ''}
          onChange={(e) => updateField('maritalStatus', e.target.value)}
          options={[
            { value: 'Never Married', label: 'Never Married' },
            { value: 'Divorced', label: 'Divorced' },
            { value: 'Widowed', label: 'Widowed' },
            { value: 'Awaiting Divorce', label: 'Awaiting Divorce' }
          ]}
        />
        <RoyalSelect 
          label="Manglik" 
          value={data.manglik || ''}
          onChange={(e) => updateField('manglik', e.target.value)}
          options={[
            { value: 'No', label: 'No' },
            { value: 'Yes', label: 'Yes' },
            { value: 'Don\'t Know', label: 'Don\'t Know' }
          ]}
        />
      </div>

      <div className="space-y-6">
        <RoyalInput 
          label="Native Place" 
          value={data.nativePlace || ''} 
          onChange={(e) => updateField('nativePlace', e.target.value)}
          placeholder="Ancestral Town/City"
        />
        <RoyalInput 
          label="Current Residence" 
          value={data.currentResidence || ''} 
          onChange={(e) => updateField('currentResidence', e.target.value)}
          placeholder="City you currently live in"
        />
      </div>

      <div className="space-y-6 pt-4">
        <h3 className="text-royal-gold/60 text-[10px] uppercase tracking-[0.2em] mb-4">Family Pillars</h3>
        <div className="grid grid-cols-2 gap-4">
          <RoyalInput label="Father's Name" value={data.father || ''} onChange={(e) => updateField('father', e.target.value)} />
          <RoyalInput label="Mother's Name" value={data.mother || ''} onChange={(e) => updateField('mother', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RoyalInput label="Brothers" type="number" value={data.brothers || ''} onChange={(e) => updateField('brothers', e.target.value)} />
          <RoyalInput label="Sisters" type="number" value={data.sisters || ''} onChange={(e) => updateField('sisters', e.target.value)} />
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <h3 className="text-royal-gold/60 text-[10px] uppercase tracking-[0.2em] mb-4">Ancestral Gotras</h3>
        <div className="grid grid-cols-2 gap-4">
          <RoyalInput label="Father's Gotra" value={data.fatherGotra || ''} onChange={(e) => updateField('fatherGotra', e.target.value)} />
          <RoyalInput label="Mother's Gotra" value={data.motherGotra || ''} onChange={(e) => updateField('motherGotra', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RoyalInput label="Paternal Grandfather's Gotra" value={data.grandfatherGotra || ''} onChange={(e) => updateField('grandfatherGotra', e.target.value)} />
          <RoyalInput label="Maternal Grandmother's Gotra" value={data.grandmotherGotra || ''} onChange={(e) => updateField('grandmotherGotra', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
