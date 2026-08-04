import React from 'react';

export const IllustrationForage: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 400 260" 
      className={`w-full max-w-[340px] h-auto bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-forage"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="excellence-brand-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        <linearGradient id="montabert-green" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="metallic-steel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="dark-metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="brass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="55%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>

        <linearGradient id="yellow-hose" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id="blue-hose" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="rock-wall-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="25%" stopColor="#334155" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <pattern id="gallery-rock-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 0,15 Q 15,10 30,15" stroke="#334155" strokeWidth="0.8" fill="none" opacity="0.3" />
          <path d="M 15,0 L 15,30" stroke="#1e293b" strokeWidth="0.8" fill="none" opacity="0.2" />
        </pattern>
      </defs>

      {/* Souterrain rock background */}
      <rect width="380" height="260" fill="#0f172a" />
      <rect width="380" height="260" fill="url(#gallery-rock-pattern)" opacity="0.8" />

      {/* Rock face on the left side */}
      <path d="M 0,0 L 55,0 Q 65,60 55,120 Q 70,180 50,260 L 0,260 Z" fill="url(#rock-wall-grad)" />
      {/* Rock strata lines */}
      <path d="M 0,40 Q 30,45 55,42" stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M 0,150 Q 25,152 52,148" stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M 0,210 Q 35,215 50,212" stroke="#ca8a04" strokeWidth="1" fill="none" opacity="0.4" />

      {/* Borehole on the rock face */}
      <rect x="52" y="93" width="15" height="10" fill="#090d16" />
      <path d="M 52,93 L 67,93 M 52,103 L 67,103" stroke="#475569" strokeWidth="1" />

      {/* FLOOR & GALLERY CAR WHEEL / STRUT */}
      <rect x="0" y="235" width="380" height="25" fill="#1e293b" />
      <line x1="0" y1="235" x2="380" y2="235" stroke="#475569" strokeWidth="1.5" />
      {/* Ground debris */}
      <polygon points="120,235 128,228 135,235" fill="#334155" />
      <polygon points="180,235 192,225 205,235" fill="#475569" />

      {/* DRILL STEEL / FLEURET ASSEMBLY */}
      <line x1="50" y1="98" x2="150" y2="98" stroke="url(#metallic-steel)" strokeWidth="4.5" />
      {/* Hexagonal shank collar */}
      <rect x="140" y="94" width="10" height="8" fill="url(#dark-metal)" stroke="#1e293b" strokeWidth="0.8" />
      {/* Spiral drill threads representation */}
      <path d="M 55,96 L 138,96" stroke="#475569" strokeWidth="0.8" strokeDasharray="3 4" />

      {/* MONTABERT T23 BODY */}
      {/* Chuck sleeve */}
      <path d="M 150,91 L 165,91 L 165,105 L 150,105 Z" fill="url(#dark-metal)" stroke="#1e293b" strokeWidth="1.2" />

      {/* Cylinder body in original green */}
      <path d="M 165,85 L 215,85 L 215,111 L 165,111 Z" fill="url(#montabert-green)" stroke="#047857" strokeWidth="1.5" />
      {/* Ribs / cooling channels */}
      <rect x="173" y="88" width="4" height="20" fill="#047857" opacity="0.5" />
      <rect x="183" y="88" width="4" height="20" fill="#047857" opacity="0.5" />
      <rect x="193" y="88" width="4" height="20" fill="#047857" opacity="0.5" />
      <rect x="203" y="88" width="4" height="20" fill="#047857" opacity="0.5" />

      {/* Tension side rods */}
      <line x1="148" y1="87" x2="235" y2="87" stroke="url(#metallic-steel)" strokeWidth="2.2" />
      <line x1="148" y1="109" x2="235" y2="109" stroke="url(#metallic-steel)" strokeWidth="2.2" />
      <rect x="146" y="85" width="3" height="4" fill="#020617" />
      <rect x="146" y="107" width="3" height="4" fill="#020617" />
      <rect x="234" y="85" width="3" height="4" fill="#020617" />
      <rect x="234" y="107" width="3" height="4" fill="#020617" />

      {/* Backhead cap */}
      <path d="M 215,88 L 235,88 L 235,108 L 215,108 Z" fill="url(#dark-metal)" stroke="#1e293b" strokeWidth="1.2" />

      {/* MONTABERT BRAND LABEL ON BODY */}
      <rect x="172" y="93" width="36" height="10" fill="#b91c1c" rx="1.5" />
      {/* "M" Logo */}
      <rect x="174" y="95" width="6" height="6" fill="#ffffff" rx="0.5" />
      <text x="177" y="100.5" fill="#b91c1c" fontSize="5.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">M</text>
      <text x="192" y="100" fill="#ffffff" fontSize="4.5" fontWeight="black" fontFamily="sans-serif" letterSpacing="0.2">ONTABERT</text>

      {/* Rubber U-Handle */}
      <path d="M 233,90 L 252,80 C 255,78 258,80 256,84 L 243,103 Z" fill="#0f172a" stroke="#000" strokeWidth="1.2" />
      {/* Handle rubber texture grip */}
      <path d="M 245,84 L 249,82" stroke="#334155" strokeWidth="1.5" />
      <path d="M 241,90 L 245,88" stroke="#334155" strokeWidth="1.5" />

      {/* SWIVEL JOINT ON RIGHT EDGE OF DRILL BODY */}
      <rect x="222" y="111" width="10" height="8" fill="url(#dark-metal)" stroke="#1e293b" strokeWidth="1" />
      <circle cx="227" cy="115" r="3" fill="#fbbf24" stroke="#ca8a04" strokeWidth="1" />

      {/* TELESCOPIC JACKLEG / POUSSOIR */}
      {/* Pivot connection and outer cylinder tube */}
      <line x1="227" y1="117" x2="282" y2="198" stroke="url(#dark-metal)" strokeWidth="6" strokeLinecap="round" />
      <line x1="227" y1="117" x2="282" y2="198" stroke="url(#metallic-steel)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Telescopic inner rod extended */}
      <line x1="282" y1="198" x2="305" y2="231" stroke="url(#metallic-steel)" strokeWidth="3" strokeLinecap="round" />
      {/* Anchor spade claw foot */}
      <path d="M 305,231 L 298,235 L 314,238 L 311,228 Z" fill="#1e293b" stroke="#000" strokeWidth="1" />

      {/* HIGH-PRESSURE HOSES & INLETS */}
      {/* Air connection inlet */}
      <rect x="228" y="80" width="6" height="8" fill="url(#brass-grad)" stroke="#1e293b" strokeWidth="0.8" />
      {/* Yellow Air Hose */}
      <path d="M 231,80 C 240,60 270,55 315,65" stroke="url(#yellow-hose)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 231,80 C 240,60 270,55 315,65" stroke="#1e293b" strokeWidth="5" fill="none" strokeDasharray="2 7" strokeLinecap="round" opacity="0.6" />

      {/* Water connection inlet */}
      <rect x="215" y="108" width="6" height="7" fill="url(#brass-grad)" stroke="#1e293b" strokeWidth="0.8" />
      {/* Blue Water Hose */}
      <path d="M 218,115 C 225,135 250,150 295,145" stroke="url(#blue-hose)" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* WATER SPRAY & DUST SUPPRESSION FLUSH AT BOREHOLE MOUTH */}
      <ellipse cx="52" cy="98" rx="8" ry="14" fill="#38bdf8" opacity="0.3" />
      <ellipse cx="48" cy="98" rx="5" ry="8" fill="#e0f2fe" opacity="0.5" />
      {/* Droplets & gravel flying out */}
      <circle cx="44" cy="88" r="1.5" fill="#60a5fa" />
      <circle cx="42" cy="106" r="1.2" fill="#60a5fa" />
      <circle cx="36" cy="98" r="1" fill="#94a3b8" />
      <circle cx="40" cy="94" r="1.5" fill="#3b82f6" opacity="0.8" />
      <circle cx="46" cy="104" r="0.8" fill="#f8fafc" />

      {/* TECHNICAL LABELS & TITLE BADGE */}
      <rect x="75" y="15" width="165" height="28" rx="4" fill="#1e293b" opacity="0.9" />
      <text x="157.5" y="27" fill="#10b981" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">MONTABERT T23</text>
      <text x="157.5" y="38" fill="#94a3b8" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">Jackleg Perforateur / Pneumatique EXCELLENCE</text>

      {/* Hose tag labels */}
      <text x="315" y="55" fill="#fbbf24" fontSize="7" fontWeight="black" fontFamily="sans-serif">AIR COMPRIMÉ</text>
      <text x="300" y="158" fill="#3b82f6" fontSize="7" fontWeight="black" fontFamily="sans-serif">EAU DE RINÇAGE</text>

      {/* MANDATORY EXCELLENCE BRANDING */}
      {/* Top horizontal band (height 4px) */}
      <rect x="0" y="0" width="400" height="4" fill="url(#excellence-brand-grad)" opacity="0.7" />

      {/* Right vertical band (width 20px) */}
      <rect x="380" y="0" width="20" height="260" fill="url(#excellence-brand-grad)" opacity="0.92" />
      
      {/* Brand text read vertically downward */}
      <text 
        x="390" 
        y="130" 
        fill="#ffffff" 
        fontSize="8" 
        fontWeight="bold" 
        letterSpacing="2" 
        textAnchor="middle" 
        transform="rotate(90, 390, 130)"
        fontFamily="sans-serif"
      >
        EXCELLENCE
      </text>
    </svg>
  );
};
