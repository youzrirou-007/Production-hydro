import React from 'react';

export const IllustrationSoufflage: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 260 320" 
      className={`w-full max-w-[220px] h-auto bg-slate-950 rounded-xl overflow-hidden shadow-lg border border-slate-800/50 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-soufflage"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="hydromines-brand-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        <linearGradient id="copper-metallic" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="25%" stopColor="#ea580c" />
          <stop offset="60%" stopColor="#ffedd5" />
          <stop offset="85%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>

        <radialGradient id="hole-depth" cx="90%" cy="50%" r="90%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>

        <linearGradient id="air-jet-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0.1" />
        </linearGradient>

        <linearGradient id="rock-schist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Shadow filter */}
        <filter id="glow-air" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Solid dark mine atmosphere background */}
      <rect width="260" height="320" fill="#090d16" />

      {/* Rock cross section container */}
      <rect x="35" y="50" width="205" height="220" fill="url(#rock-schist-grad)" stroke="#1e293b" strokeWidth="1.5" />
      
      {/* Geologic veins inside rock */}
      <path d="M 35,80 Q 120,95 240,75" stroke="#ca8a04" strokeWidth="1.2" fill="none" opacity="0.3" />
      <path d="M 35,220 Q 110,235 240,210" stroke="#ca8a04" strokeWidth="1.5" fill="none" opacity="0.25" />

      {/* Free Face of Rock Tunnel at x=35 */}
      <rect x="5" y="50" width="30" height="220" fill="#0f172a" opacity="0.4" />
      <path d="M 35,46 L 35,274" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />

      {/* THE FORAGE HOLE Ø38mm */}
      <path d="M 35,130 L 210,130 C 215,130 215,168 210,168 L 35,168 Z" fill="url(#hole-depth)" />
      
      {/* Realist Chipped Edges at borehole mouth */}
      <path d="M 35,130 Q 33,128 35,126 Q 37,128 35,130" stroke="#475569" strokeWidth="1" fill="#1e293b" />
      <path d="M 35,168 Q 32,170 35,172 Q 38,170 35,168" stroke="#475569" strokeWidth="1" fill="#1e293b" />

      {/* Spirals / Marks of trépan inside hole */}
      <path d="M 60,131 Q 65,135 62,145 Q 58,155 63,167" stroke="#334155" strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 100,131 Q 105,135 102,145 Q 98,155 103,167" stroke="#334155" strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 140,131 Q 145,135 142,145 Q 138,155 143,167" stroke="#334155" strokeWidth="0.8" fill="none" opacity="0.6" />
      <path d="M 180,131 Q 185,135 182,145 Q 178,155 183,167" stroke="#1e293b" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* CANNE DE SOUFFLAGE EN CUIVRE */}
      <line x1="5" y1="149" x2="150" y2="149" stroke="url(#copper-metallic)" strokeWidth="6" strokeLinecap="round" />
      {/* Nozzle reducer sleeve */}
      <rect x="144" y="145" width="7" height="8" rx="1" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />

      {/* HIGH-PRESSURE AIR FLUX ANIMATED */}
      <path d="M 152,149 L 210,149" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5 4" filter="url(#glow-air)">
        <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
      </path>

      {/* Turbulences air loops echoing back along walls */}
      <path d="M 210,149 C 205,135 140,134 35,133" fill="none" stroke="url(#air-jet-grad)" strokeWidth="2.5" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
      </path>
      <path d="M 210,149 C 205,163 140,164 35,165" fill="none" stroke="url(#air-jet-grad)" strokeWidth="2.5" strokeDasharray="6 4">
        <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
      </path>

      {/* DUST & WATER EVACUATION CLOUD AT BOREHOLE MOUTH */}
      <ellipse cx="28" cy="149" rx="12" ry="22" fill="#cbd5e1" opacity="0.2" />
      <ellipse cx="20" cy="149" rx="8" ry="14" fill="#94a3b8" opacity="0.3" />
      {/* Solid debris flying out */}
      <circle cx="26" cy="132" r="1.5" fill="#3b82f6" opacity="0.8" />
      <circle cx="16" cy="140" r="1.2" fill="#94a3b8" />
      <circle cx="24" cy="165" r="1" fill="#64748b" />
      <circle cx="14" cy="155" r="1.5" fill="#3b82f6" opacity="0.8" />

      {/* Clean shiny sparkle in borehole center indicating absolute cleanliness */}
      <path d="M 185,142 L 187,145 L 191,146 L 187,147 L 185,150 L 183,147 L 179,146 L 183,145 Z" fill="#eab308" />
      <circle cx="185" cy="146" r="1" fill="#ffffff" />
      <circle cx="115" cy="138" r="0.8" fill="#eab308" />

      {/* TECHNICAL LABELS & TITLE */}
      <text x="135" y="75" fill="#ffffff" fontSize="9" fontWeight="black" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">SOUFFLAGE & PROPRETÉ</text>
      
      {/* Diameter / Length annotations */}
      <g transform="translate(45, 185)">
        <line x1="0" y1="15" x2="160" y2="15" stroke="#ef4444" strokeWidth="1" />
        <line x1="0" y1="10" x2="0" y2="20" stroke="#ef4444" strokeWidth="1" />
        <line x1="160" y1="10" x2="160" y2="20" stroke="#ef4444" strokeWidth="1" />
        <rect x="55" y="5" width="50" height="14" rx="3" fill="#ef4444" />
        <text x="80" y="15" fill="#ffffff" fontSize="7.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">L = 2.4m</text>
      </g>

      <g transform="translate(145, 95)">
        <text x="10" y="15" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Ø 38mm</text>
        <path d="M 5,12 L 2,25" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" />
      </g>

      {/* EXPLICIT SAFETY / CLEANLINESS BADGE */}
      <g transform="translate(38, 230)">
        <rect x="0" y="0" width="165" height="30" rx="6" fill="#047857" stroke="#059669" strokeWidth="1" />
        <text x="82.5" y="13" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">✓ TROU PARFAIT NETTOYÉ</text>
        <text x="82.5" y="23" fill="#a7f3d0" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Sans résidus de silice | Sans eau résiduelle</text>
      </g>

      {/* MANDATORY HYDROMINES BRANDING */}
      {/* Top horizontal band (height 4px) */}
      <rect x="0" y="0" width="260" height="4" fill="url(#hydromines-brand-grad)" opacity="0.7" />

      {/* Right vertical band (width 20px) */}
      <rect x="240" y="0" width="20" height="320" fill="url(#hydromines-brand-grad)" opacity="0.92" />
      
      {/* Brand text read vertically downward */}
      <text 
        x="250" 
        y="160" 
        fill="#ffffff" 
        fontSize="8" 
        fontWeight="bold" 
        letterSpacing="2" 
        textAnchor="middle" 
        transform="rotate(90, 250, 160)"
        fontFamily="sans-serif"
      >
        HYDROMINES
      </text>
    </svg>
  );
};
