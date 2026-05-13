'use client';

interface GoldLeafFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function GoldLeafFrame({ children, className = '' }: GoldLeafFrameProps) {
  return (
    <div className={`relative p-1 ${className}`}>
      {/* Decorative Gold Corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-royal-gold rounded-tl-lg z-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-royal-gold rounded-tr-lg z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-royal-gold rounded-bl-lg z-20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-royal-gold rounded-br-lg z-20 pointer-events-none" />
      
      {/* Delicate Inner Frame */}
      <div className="absolute inset-0 border border-royal-gold/30 rounded-xl z-10 pointer-events-none" />
      
      {/* The Profile Photo Container */}
      <div className="relative rounded-lg overflow-hidden z-0">
        {children}
      </div>
      
      {/* Subtle Gold Leaf SVG Overlay (Optional: can add more intricate paths here) */}
      <div className="absolute inset-[-4px] border border-royal-gold/10 rounded-2xl pointer-events-none" />
    </div>
  );
}
