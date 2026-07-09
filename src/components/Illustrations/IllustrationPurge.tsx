import React from 'react';

export const IllustrationPurge: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 400 240" 
      className={`w-full max-w-[320px] h-auto bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-purge"
    >
      <defs>
        {/* Shading / Shadow effects */}
        <filter id="shadow-purge" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
        </filter>
        
        {/* Gradients */}
        <linearGradient id="hydromines-brand-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        <linearGradient id="schist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id="slab-grad" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id="steel-shaft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="30%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        <linearGradient id="grip-rubber" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        <radialGradient id="gold-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#eab308" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#d97706" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="beam-light" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#fef08a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>

        {/* Rock texture pattern */}
        <pattern id="schist-texture" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 0 10 Q 20 15 40 10" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
          <path d="M 0 30 Q 20 25 40 30" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.5" />
          <path d="M 10 0 L 15 40" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.2" />
          <path d="M 30 0 L 25 40" stroke="#334155" strokeWidth="0.5" fill="none" opacity="0.2" />
        </pattern>
      </defs>

      {/* Dark mine atmosphere background */}
      <rect width="400" height="240" fill="#0f172a" />

      {/* Rock cross section / background with schist texture */}
      <rect width="380" height="240" fill="url(#schist-grad)" />
      <rect width="380" height="240" fill="url(#schist-texture)" />

      {/* Headlight beam of miner */}
      <polygon points="10,230 140,40 190,110" fill="url(#beam-light)" />

      {/* Geological layers & strata lines */}
      <path d="M 0,60 Q 100,80 200,50 T 380,70" stroke="#1e293b" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M 0,160 Q 120,140 240,170 T 380,150" stroke="#0f172a" strokeWidth="2.5" fill="none" opacity="0.8" />
      <path d="M 0,100 Q 150,110 380,90" stroke="#ca8a04" strokeWidth="1.5" fill="none" opacity="0.3" /> {/* Quartz vein */}

      {/* Fissure principale (main crack) separating the unstable slab */}
      <path 
        d="M 150,0 C 145,30 155,60 150,90 C 145,110 160,120 180,125 C 240,130 320,120 380,125" 
        stroke="#090d16" 
        strokeWidth="5" 
        fill="none" 
        filter="url(#shadow-purge)" 
      />
      
      {/* Secondary cracks on the wall */}
      <path d="M 220,125 Q 230,150 250,165" stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M 150,45 Q 180,40 210,42" stroke="#1e293b" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M 110,0 Q 115,25 105,40" stroke="#0f172a" strokeWidth="2" fill="none" opacity="0.6" />

      {/* Unstable slab (Dalle instable) ready to fall */}
      <path 
        d="M 153,3 L 151,88 C 151,88 158,110 178,122 C 238,127 320,117 377,122 L 377,3 Z" 
        fill="url(#slab-grad)" 
        stroke="#1e293b" 
        strokeWidth="1.5" 
      />
      {/* Texture on the slab itself */}
      <path d="M 180,20 Q 250,15 320,25" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M 190,60 Q 260,70 340,55" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M 210,100 Q 280,95 350,98" stroke="#1e293b" strokeWidth="1" fill="none" opacity="0.5" />

      {/* Shaling off debris falling down */}
      <g>
        {/* Falling rocks */}
        <polygon points="152,105 158,102 160,108 154,110" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
        <polygon points="168,115 174,110 176,118 170,120" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
        <polygon points="185,135 192,130 195,138 188,141" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
        {/* Motion lines for falling debris */}
        <line x1="154" y1="112" x2="154" y2="122" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
        <line x1="172" y1="122" x2="172" y2="135" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
        <line x1="190" y1="143" x2="190" y2="158" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
      </g>

      {/* Debris already on the floor */}
      <path d="M 10,240 Q 50,232 100,240" fill="#334155" opacity="0.9" />
      <polygon points="20,240 32,235 45,240" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
      <polygon points="55,240 68,232 80,240" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
      <polygon points="85,240 92,237 98,240" fill="#64748b" stroke="#1e293b" strokeWidth="0.5" />

      {/* Safety distance indicator 2.5m */}
      <g transform="translate(0, 180)">
        <line x1="20" y1="15" x2="150" y2="15" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
        {/* Dimension ticks */}
        <line x1="20" y1="10" x2="20" y2="20" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="150" y1="10" x2="150" y2="20" stroke="#ef4444" strokeWidth="1.5" />
        {/* Arrows */}
        <path d="M 20,15 L 28,11 L 28,19 Z" fill="#ef4444" />
        <path d="M 150,15 L 142,11 L 142,19 Z" fill="#ef4444" />
        {/* Badge & Label */}
        <rect x="52" y="3" width="66" height="22" rx="4" fill="#ef4444" />
        <text x="85" y="14" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="Arial">D. SÉCURITÉ</text>
        <text x="85" y="22" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial">&gt; 2.5 m</text>
      </g>

      {/* PINCE À PURGER (Scaling bar) */}
      <g>
        {/* Rubber grip sleeve at the back handle of the bar */}
        <line x1="25" y1="215" x2="70" y2="175" stroke="url(#grip-rubber)" strokeWidth="6" strokeLinecap="round" />
        {/* Grip texture ridges */}
        <line x1="33" y1="208" x2="37" y2="204" stroke="#475569" strokeWidth="1" />
        <line x1="41" y1="201" x2="45" y2="197" stroke="#475569" strokeWidth="1" />
        <line x1="49" y1="194" x2="53" y2="190" stroke="#475569" strokeWidth="1" />
        <line x1="57" y1="187" x2="61" y2="183" stroke="#475569" strokeWidth="1" />

        {/* Steel shaft of the purge bar */}
        <line x1="65" y1="179" x2="148" y2="105" stroke="url(#steel-shaft)" strokeWidth="4" />
        
        {/* Joint/Collar block */}
        <rect x="141" y="105" width="6" height="7" transform="rotate(-42, 144, 108)" fill="url(#steel-shaft)" stroke="#1e293b" strokeWidth="0.8" />

        {/* Double-biseauted Type 2 tip (Bec de purge), engaged in the crack */}
        <g transform="translate(148, 105) rotate(-42)">
          {/* Main forged head */}
          <path d="M 0,-2 L 15,-4 L 18,-1 L 18,1 L 15,4 L 0,2 Z" fill="url(#steel-shaft)" stroke="#1e293b" strokeWidth="0.8" />
          {/* Double bevel tip with special hardened steel look (bec trempé) */}
          <path d="M 15,-4 L 25,-1 L 25,1 L 15,4 Z" fill="#475569" stroke="#0f172a" strokeWidth="0.6" />
          {/* Shiny edge line representing sharpness */}
          <line x1="25" y1="-1" x2="25" y2="1" stroke="#f1f5f9" strokeWidth="1" />
        </g>
      </g>

      {/* GOLD GLOW AT THE PURGE CONTACT POINT */}
      <circle cx="152" cy="100" r="18" fill="url(#gold-glow)" />
      {/* Sparks */}
      <path d="M 152,100 L 155,95 L 160,100 L 155,105 Z" fill="#fef08a" />
      <path d="M 149,97 L 151,92 L 153,97 L 151,102 Z" fill="#fbbf24" />
      <circle cx="157" cy="94" r="1" fill="#ffffff" />
      <circle cx="146" cy="104" r="0.8" fill="#fbbf24" />

      {/* TEXT ANNOTATIONS / LABELS */}
      <rect x="180" y="70" width="75" height="15" rx="3" fill="#1e293b" opacity="0.85" />
      <text x="217.5" y="80" fill="#cbd5e1" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">DALLE INSTABLE</text>
      
      <rect x="55" y="125" width="85" height="15" rx="3" fill="#1e293b" opacity="0.85" />
      <text x="97.5" y="135" fill="#38bdf8" fontSize="6.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">PINCE À PURGER (SMI)</text>

      {/* MANDATORY HYDROMINES BRANDING */}
      {/* Top horizontal band (height 4px) */}
      <rect x="0" y="0" width="400" height="4" fill="url(#hydromines-brand-grad)" opacity="0.7" />

      {/* Right vertical band (width 20px) */}
      <rect x="380" y="0" width="20" height="240" fill="url(#hydromines-brand-grad)" opacity="0.92" />
      
      {/* Brand text read vertically downward */}
      <text 
        x="390" 
        y="120" 
        fill="#ffffff" 
        fontSize="8" 
        fontWeight="bold" 
        letterSpacing="2" 
        textAnchor="middle" 
        transform="rotate(90, 390, 120)"
        fontFamily="sans-serif"
      >
        HYDROMINES
      </text>
    </svg>
  );
};
