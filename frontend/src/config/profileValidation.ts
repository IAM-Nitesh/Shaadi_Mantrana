// Type definition for field configuration
export interface FieldConfig {
  hint: string;
  placeholder: string;
  validation: (value: any) => boolean;
  errorMessage: string;
}

// Field hints configuration with backend-aligned validation
export const FIELD_HINTS: { [key: string]: FieldConfig } = {
  name: {
    hint: "Enter your full name (minimum 2 characters)",
    placeholder: "e.g. Priya Sharma",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Full name must be at least 2 characters"
  },
  gender: {
    hint: "Select your gender",
    placeholder: "Choose gender",
    validation: (value: any) => !!value && ['Male', 'Female'].includes(value),
    errorMessage: "Please select your gender"
  },
  dateOfBirth: {
    hint: "Select your date of birth (Age: 18-80 years)",
    placeholder: "Choose date",
    validation: (value: string) => {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 80;
    },
    errorMessage: "Age must be between 18-80 years"
  },
  height: {
    hint: "Select your height in feet and inches",
    placeholder: "e.g. 5'6\"",
    validation: (value: string) => {
      if (!value) return false;
      const match = value.match(/^(\d+)'(\d+)"*$/);
      if (!match) return false;
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      const totalInches = (feet * 12) + inches;
      return totalInches >= 48 && totalInches <= 96;
    },
    errorMessage: "Please select your height"
  },
  weight: {
    hint: "Enter your weight in kg (30-200 kg)",
    placeholder: "e.g. 65",
    validation: (value: string) => {
      if (!value) return false;
      const weight = parseInt(value);
      return weight >= 30 && weight <= 200;
    },
    errorMessage: "Weight must be between 30-200 kg"
  },
  complexion: {
    hint: "Select your skin complexion",
    placeholder: "Choose complexion",
    validation: (value: string) => !!value && ['Fair', 'Medium', 'Dark'].includes(value),
    errorMessage: "Please select your skin complexion"
  },
  education: {
    hint: "Enter your highest education qualification (minimum 3 characters)",
    placeholder: "e.g. Bachelor's Degree, MBA, PhD",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Education qualification must be at least 3 characters"
  },
  occupation: {
    hint: "Enter your profession or occupation (minimum 3 characters)",
    placeholder: "e.g. Software Engineer, Doctor, Teacher",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Profession must be at least 3 characters"
  },
  annualIncome: {
    hint: "Select your annual income range",
    placeholder: "Choose annual income",
    validation: (value: string) => {
      if (!value) return false;
      return ['Under 5L', '5L - 10L', '10L - 20L', '20L - 50L', '50L - 1Cr', 'Above 1Cr'].includes(value);
    },
    errorMessage: "Please select your annual income"
  },
  nativePlace: {
    hint: "Enter your native place/city (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi, Bangalore",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Native place must be at least 2 characters"
  },
  currentResidence: {
    hint: "Enter your current residence city (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi, Bangalore",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Current residence must be at least 2 characters"
  },
  maritalStatus: {
    hint: "Select your current marital status",
    placeholder: "Choose status",
    validation: (value: string) => !!value && ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'].includes(value),
    errorMessage: "Please select your marital status"
  },
  father: {
    hint: "Enter your father's name (minimum 2 characters)",
    placeholder: "e.g. Rajesh Kumar",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Father's name must be at least 2 characters"
  },
  mother: {
    hint: "Enter your mother's name (minimum 2 characters)",
    placeholder: "e.g. Sunita Devi",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Mother's name must be at least 2 characters"
  },
  about: {
    hint: "Tell us about yourself (minimum 10 characters)",
    placeholder: "Share your interests, values, and what you're looking for...",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 10,
    errorMessage: "About section must be at least 10 characters"
  },
  images: {
    hint: "Upload a clear profile picture",
    placeholder: "Click to upload photo",
    validation: (value: any) => value && typeof value === 'string' && value.trim() !== '',
    errorMessage: "Please upload a profile picture"
  },
  timeOfBirth: {
    hint: "Select your time of birth (required for accurate matching)",
    placeholder: "Choose time",
    validation: (value: any) => {
      if (!value) return false;
      if (value instanceof Date) return !isNaN(value.getTime());
      return typeof value === 'string' && value.trim() !== '';
    },
    errorMessage: "Please select your time of birth"
  },
  placeOfBirth: {
    hint: "Enter your place of birth (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Place of birth must be at least 2 characters"
  },
  manglik: {
    hint: "Select your Manglik status",
    placeholder: "Choose status",
    validation: (value: string) => !!value && ['Yes', 'No', 'Dont Know', "Don't Know"].includes(value),
    errorMessage: "Please select your Manglik status"
  },
  fatherGotra: {
    hint: "Enter your father's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Father's gotra must be at least 3 characters"
  },
  motherGotra: {
    hint: "Enter your mother's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Mother's gotra must be at least 3 characters"
  },
  grandfatherGotra: {
    hint: "Enter your grandfather's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Grandfather's gotra must be at least 3 characters"
  },
  grandmotherGotra: {
    hint: "Enter your grandmother's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Grandmother's gotra must be at least 3 characters"
  },
  brothers: {
    hint: "Select number of brothers",
    placeholder: "Choose count",
    validation: (value: string) => {
      if (value === undefined || value === null || value === '') return false;
      const count = parseInt(value);
      return count >= 0 && count <= 5;
    },
    errorMessage: "Please select number of brothers"
  },
  sisters: {
    hint: "Select number of sisters",
    placeholder: "Choose count",
    validation: (value: string) => {
      if (value === undefined || value === null || value === '') return false;
      const count = parseInt(value);
      return count >= 0 && count <= 5;
    },
    errorMessage: "Please select number of sisters"
  },
  eatingHabit: {
    hint: "Select your eating preference",
    placeholder: "Choose preference",
    validation: (value: string) => !!value && ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].includes(value),
    errorMessage: "Please select your eating preference"
  },
  smokingHabit: {
    hint: "Select your smoking preference",
    placeholder: "Choose preference",
    validation: (value: string) => !!value && ['Yes', 'No', 'Occasionally'].includes(value),
    errorMessage: "Please select your smoking preference"
  },
  drinkingHabit: {
    hint: "Select your drinking preference",
    placeholder: "Choose preference",
    validation: (value: string) => !!value && ['Yes', 'No', 'Occasionally'].includes(value),
    errorMessage: "Please select your drinking preference"
  },
  settleAbroad: {
    hint: "Select your preference for settling abroad",
    placeholder: "Choose preference",
    validation: (value: string) => !!value && ['Yes', 'No', 'Maybe'].includes(value),
    errorMessage: "Please select your preference for settling abroad"
  },
  interests: {
    hint: "Add your interests and hobbies (minimum 1 interest)",
    placeholder: "e.g. Reading, Travel, Music",
    validation: (value: any) => {
      if (!value) return false;
      if (typeof value === 'string') {
        const arr = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return arr.length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0 && value.every(interest => interest && typeof interest === 'string' && interest.trim().length > 0);
      }
      return false;
    },
    errorMessage: "Please add at least 1 interest"
  },
  specificRequirements: {
    hint: "Enter any specific requirements or preferences (minimum 10 characters)",
    placeholder: "e.g. Looking for someone from same city, specific education background",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 10,
    errorMessage: "Specific requirements must be at least 10 characters"
  }
};
