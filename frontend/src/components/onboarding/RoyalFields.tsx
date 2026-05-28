'use client';

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface RoyalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function RoyalInput({ label, error, className, ...props }: RoyalInputProps) {
  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          className={cn(
            "w-full bg-royal-obsidian border-b border-x-0 border-t-0 border-royal-gold/20 py-4 px-1 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none rounded-none transition-all duration-300 focus:border-royal-gold group-hover:border-royal-gold/40 placeholder:text-royal-gold/20",
            error && "border-royal-crimson/50 focus:border-royal-crimson",
            className
          )}
          {...props}
        />
        <motion.div 
          className="absolute bottom-0 left-0 h-[2px] bg-royal-gold w-0 group-focus-within:w-full transition-all duration-500"
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1">{error}</p>}
    </div>
  );
}

interface RoyalSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function RoyalSelect({ label, options, error, className, ...props }: RoyalSelectProps) {
  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <select
          className={cn(
            "w-full bg-royal-obsidian border-b border-x-0 border-t-0 border-royal-gold/20 py-4 px-1 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none rounded-none transition-all duration-300 focus:border-royal-gold group-hover:border-royal-gold/40 appearance-none",
            error && "border-royal-crimson/50 focus:border-royal-crimson",
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
          className="absolute bottom-0 left-0 h-[2px] bg-royal-gold w-0 group-focus-within:w-full transition-all duration-500"
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1">{error}</p>}
    </div>
  );
}

export function RoyalTextArea({ label, error, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <div className="space-y-2 w-full">
      <label className="block text-royal-gold/60 text-xs uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <textarea
          className={cn(
            "w-full bg-royal-obsidian border border-royal-gold/10 rounded-xl py-4 px-4 text-white outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 shadow-none transition-all duration-300 focus:border-royal-gold group-hover:border-royal-gold/20 placeholder:text-royal-gold/20 min-h-[120px] resize-none",
            error && "border-royal-crimson/50 focus:border-royal-crimson",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-royal-crimson text-[10px] mt-1">{error}</p>}
    </div>
  );
}
