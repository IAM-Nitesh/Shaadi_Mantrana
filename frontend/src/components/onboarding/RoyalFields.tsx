'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { FIELD_HINTS } from '../../config/profileValidation';

const TEXT_ONLY_FIELDS = new Set([
  'name',
  'nativePlace',
  'currentResidence',
  'placeOfBirth',
  'father',
  'mother',
  'fatherGotra',
  'motherGotra',
  'grandfatherGotra',
  'grandmotherGotra'
]);

const NUMBER_ONLY_FIELDS = new Set(['weight']);

function sanitizeFieldValue(fieldName: string | undefined, type: string | undefined, value: string) {
  if (fieldName && TEXT_ONLY_FIELDS.has(fieldName)) {
    return value.replace(/[^a-zA-Z\s]/g, '');
  }

  if ((fieldName && NUMBER_ONLY_FIELDS.has(fieldName)) || type === 'number') {
    return value.replace(/\D/g, '');
  }

  return value;
}

interface RoyalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
  hint?: string;
  fieldName?: string;
}

export function RoyalInput({ label, error, isValid: propIsValid, isInvalid: propIsInvalid, hint: propHint, fieldName, className, onFocus, onBlur, onChange, value, type, ...props }: RoyalInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const fieldConfig = fieldName ? FIELD_HINTS[fieldName] : null;
  const isValueValid = fieldConfig ? fieldConfig.validation(value) : true;
  const hasValue = value !== undefined && value !== '' && value !== null;
  
  const isValid = propIsValid ?? (fieldName ? (hasValue && isValueValid) : false);
  const isInvalid = propIsInvalid ?? (fieldName ? (hasInteracted && !isValueValid) : false);
  const hint = propHint ?? fieldConfig?.hint;

  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          value={value}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); setHasInteracted(true); onBlur?.(e); }}
          onChange={(e) => {
            const sanitized = sanitizeFieldValue(fieldName, type, e.currentTarget.value);
            if (sanitized !== e.currentTarget.value) {
              e.currentTarget.value = sanitized;
            }
            onChange?.(e);
          }}
          type={type}
          className={cn(
            "w-full bg-royal-obsidian border-b border-x-0 border-t-0 py-4 px-1 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none rounded-none transition-all duration-300 placeholder:text-royal-gold/20",
            isValid && !isInvalid ? "border-emerald-500 focus:border-emerald-400" :
            isInvalid || error ? "border-royal-crimson focus:border-royal-crimson text-royal-crimson" :
            "border-royal-gold/20 focus:border-royal-gold group-hover:border-royal-gold/40",
            className
          )}
          {...props}
        />
        <motion.div 
          className={cn(
            "absolute bottom-0 left-0 h-[2px] w-0 group-focus-within:w-full transition-all duration-500",
            isValid && !isInvalid ? "bg-emerald-500" :
            isInvalid || error ? "bg-royal-crimson" : "bg-royal-gold"
          )}
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1 px-1">{error}</p>}
      {isFocused && hint && !error && (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-1 flex items-start space-x-1 px-1">
          <i className="ri-information-line text-royal-gold/80 text-[10px]"></i>
          <p className="text-[10px] text-royal-gold/80 italic">{hint}</p>
        </motion.div>
      )}
    </div>
  );
}

interface RoyalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
  hint?: string;
  fieldName?: string;
}

export function RoyalSelect({ label, options, error, isValid: propIsValid, isInvalid: propIsInvalid, hint: propHint, fieldName, className, onFocus, onBlur, value, ...props }: RoyalSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const fieldConfig = fieldName ? FIELD_HINTS[fieldName] : null;
  const isValueValid = fieldConfig ? fieldConfig.validation(value) : true;
  const hasValue = value !== undefined && value !== '' && value !== null;
  
  const isValid = propIsValid ?? (fieldName ? (hasValue && isValueValid) : false);
  const isInvalid = propIsInvalid ?? (fieldName ? (hasInteracted && !isValueValid) : false);
  const hint = propHint ?? fieldConfig?.hint;

  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); setHasInteracted(true); onBlur?.(e); }}
          className={cn(
            "w-full bg-royal-obsidian border-b border-x-0 border-t-0 py-4 px-1 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none rounded-none transition-all duration-300 appearance-none",
            isValid && !isInvalid ? "border-emerald-500 focus:border-emerald-400" :
            isInvalid || error ? "border-royal-crimson focus:border-royal-crimson text-royal-crimson" :
            "border-royal-gold/20 focus:border-royal-gold group-hover:border-royal-gold/40",
            className
          )}
          {...props}
        >
          <option value="" disabled className="bg-royal-obsidian text-royal-gold/20">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-royal-obsidian text-white py-2">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-royal-gold/40">
          <i className="ri-arrow-down-s-line"></i>
        </div>
        <motion.div 
          className={cn(
            "absolute bottom-0 left-0 h-[2px] w-0 group-focus-within:w-full transition-all duration-500",
            isValid && !isInvalid ? "bg-emerald-500" :
            isInvalid || error ? "bg-royal-crimson" : "bg-royal-gold"
          )}
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1 px-1">{error}</p>}
      {isFocused && hint && !error && (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-1 flex items-start space-x-1 px-1">
          <i className="ri-information-line text-royal-gold/80 text-[10px]"></i>
          <p className="text-[10px] text-royal-gold/80 italic">{hint}</p>
        </motion.div>
      )}
    </div>
  );
}

interface RoyalTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
  hint?: string;
  fieldName?: string;
}

export function RoyalTextArea({ label, error, isValid: propIsValid, isInvalid: propIsInvalid, hint: propHint, fieldName, className, onFocus, onBlur, value, ...props }: RoyalTextAreaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const fieldConfig = fieldName ? FIELD_HINTS[fieldName] : null;
  const isValueValid = fieldConfig ? fieldConfig.validation(value) : true;
  const hasValue = value !== undefined && value !== '' && value !== null;
  
  const isValid = propIsValid ?? (fieldName ? (hasValue && isValueValid) : false);
  const isInvalid = propIsInvalid ?? (fieldName ? (hasInteracted && !isValueValid) : false);
  const hint = propHint ?? fieldConfig?.hint;

  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <textarea
          value={value}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setIsFocused(false); setHasInteracted(true); onBlur?.(e); }}
          className={cn(
            "w-full bg-royal-obsidian border rounded-xl py-4 px-4 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none transition-all duration-300 placeholder:text-royal-gold/20 min-h-[120px] resize-none",
            isValid && !isInvalid ? "border-emerald-500 focus:border-emerald-400" :
            isInvalid || error ? "border-royal-crimson focus:border-royal-crimson text-royal-crimson" :
            "border-royal-gold/20 focus:border-royal-gold group-hover:border-royal-gold/40",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1 px-1">{error}</p>}
      {isFocused && hint && !error && (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-1 flex items-start space-x-1 px-1">
          <i className="ri-information-line text-royal-gold/80 text-[10px]"></i>
          <p className="text-[10px] text-royal-gold/80 italic">{hint}</p>
        </motion.div>
      )}
    </div>
  );
}
