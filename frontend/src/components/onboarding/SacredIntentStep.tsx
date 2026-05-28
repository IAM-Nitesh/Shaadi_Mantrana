'use client';

import { RoyalTextArea, RoyalInput } from './RoyalFields';

interface SacredIntentStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function SacredIntentStep({ data, updateField }: SacredIntentStepProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <RoyalTextArea 
          label="About Me" 
          fieldName="about"
          value={data.about || ''} 
          onChange={(e) => updateField('about', e.target.value)}
          placeholder="Share your story, values, and what you seek in a life partner..."
        />

        <RoyalInput 
          label="Interests & Passions" 
          fieldName="interests"
          value={data.interests?.join(', ') || ''} 
          onChange={(e) => updateField('interests', e.target.value.split(',').map((s: string) => s.trim()))}
          placeholder="e.g. Classical Music, Ancient History, Yoga (comma separated)"
        />

        <RoyalTextArea 
          label="Specific Requirements" 
          fieldName="specificRequirements"
          value={data.specificRequirements || ''} 
          onChange={(e) => updateField('specificRequirements', e.target.value)}
          placeholder="Any specific preferences or non-negotiables for your destined match..."
        />
      </div>
      
      <div className="p-4 bg-royal-gold/5 border border-royal-gold/10 rounded-2xl">
        <p className="text-royal-gold/60 text-xs italic leading-relaxed text-center">
          "The most beautiful union is one where two souls reflect each other's virtues and support each other's sacred path."
        </p>
      </div>
    </div>
  );
}
