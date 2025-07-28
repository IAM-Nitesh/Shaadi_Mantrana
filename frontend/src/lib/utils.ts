// Copied from shadcn/ui utils
export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
} 