"use client";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "white" | "dark";
}

export function Logo({ 
  className = "", 
  size = "md", 
  showText = true,
  variant = "default" 
}: LogoProps) {
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-lg" },
    md: { icon: "w-9 h-9", text: "text-xl" },
    lg: { icon: "w-12 h-12", text: "text-2xl" },
  };

  const textColors = {
    default: "text-foreground group-hover:text-ember",
    white: "text-white",
    dark: "text-slate-900",
  };

  return (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      {/* Logo Icon - Ember W */}
      <div className={`${sizes[size].icon} relative`}>
        <svg 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="emberGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E85D3D" />
              <stop offset="50%" stopColor="#F07847" />
              <stop offset="100%" stopColor="#F59E5E" />
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect 
            x="0" 
            y="0" 
            width="40" 
            height="40" 
            rx="10" 
            fill="url(#emberGradient)"
          />
          
          {/* W letterform */}
          <text
            x="20"
            y="28"
            textAnchor="middle"
            fill="white"
            fontFamily="serif"
            fontWeight="bold"
            fontSize="22"
          >
            W
          </text>
        </svg>
      </div>
      
      {/* Wordmark */}
      {showText && (
        <span className={`font-serif font-semibold tracking-tight transition-colors ${sizes[size].text} ${textColors[variant]}`}>
          Willpowered
        </span>
      )}
    </div>
  );
}

// Standalone icon version for favicon-like uses
export function LogoIcon({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id="emberGradientIcon" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E85D3D" />
          <stop offset="50%" stopColor="#F07847" />
          <stop offset="100%" stopColor="#F59E5E" />
        </linearGradient>
      </defs>
      
      <rect 
        x="0" 
        y="0" 
        width="40" 
        height="40" 
        rx="10" 
        fill="url(#emberGradientIcon)"
      />
      
      <text
        x="20"
        y="28"
        textAnchor="middle"
        fill="white"
        fontFamily="serif"
        fontWeight="bold"
        fontSize="22"
      >
        W
      </text>
    </svg>
  );
}
