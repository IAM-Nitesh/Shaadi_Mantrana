'use client';

import { RoyalTextArea } from './RoyalFields';

const INTEREST_OPTIONS = [
  'Classical Music', 'Bollywood', 'Devotional Music', 'Ghazals',
  'Ancient History', 'Indian Culture', 'Philosophy', 'Literature', 'Poetry',
  'Yoga', 'Meditation', 'Fitness', 'Ayurveda', 'Cooking', 'Baking',
  'Travel', 'Nature', 'Gardening', 'Photography', 'Art & Painting',
  'Cricket', 'Badminton', 'Chess', 'Swimming',
  'Volunteering', 'Spirituality', 'Temple Visits', 'Seva',
  'Technology', 'Reading', 'Writing', 'Dance', 'Theatre',
  'Movies', 'Documentaries', 'Astronomy', 'Environment',
];

interface SacredIntentStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function SacredIntentStep({ data, updateField }: SacredIntentStepProps) {
  const selectedInterests: string[] = Array.isArray(data.interests)
    ? data.interests.filter(Boolean)
    : [];

  const toggleInterest = (interest: string) => {
    const current = selectedInterests;
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    updateField('interests', updated);
  };

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

        {/* Interests multi-select — aligned with /profile page */}
        <div>
          <label className="block text-sm font-medium text-royal-gold mb-3">
            Interests &amp; Passions
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selected
                      ? 'bg-royal-gold text-royal-obsidian border-royal-gold shadow-md'
                      : 'bg-royal-obsidian/60 text-royal-gold/80 border-royal-gold/30 hover:border-royal-gold/60 hover:text-royal-gold'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {selectedInterests.length > 0 && (
            <p className="text-xs text-royal-gold/50 mt-3">
              {selectedInterests.length} selected: {selectedInterests.join(', ')}
            </p>
          )}
        </div>

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
          &quot;The most beautiful union is one where two souls reflect each other&apos;s virtues and support each other&apos;s sacred path.&quot;
        </p>
      </div>
    </div>
  );
}
