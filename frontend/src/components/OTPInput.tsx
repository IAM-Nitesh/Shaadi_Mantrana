'use client';

import { useRef, useState, useEffect, KeyboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false 
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));

  // Sync with parent value
  useEffect(() => {
    const digits = value.padEnd(length, '').slice(0, length).split('');
    setOtp(digits);
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;
    
    const newDigit = digit.replace(/\D/g, '');
    if (newDigit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = newDigit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto-focus next input
    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const digits = pastedData.padEnd(length, '').slice(0, length).split('');
    setOtp(digits);
    onChange(pastedData);
    
    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 md:gap-3">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
        />
      ))}
    </div>
  );
}

