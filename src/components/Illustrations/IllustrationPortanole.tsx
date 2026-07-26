import React from 'react';

export const IllustrationPortanole: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg 
      viewBox="0 0 220 160" 
      className={`w-full max-w-[240px] h-auto bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      id="svg-portanole"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="excellence-brand-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        <linearGradient id="safety-yellow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>

        <linearGradient id="brushed-steel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <linearGradient id="bronze-venturi" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <radialGradient id="cave-shading" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      {/* Dark mine background */}
      <rect width="200" height="160" fill="url(#cave-shading)" />
      
      {/* Structural mine gallery wall profile */}
      <path d="M 10,160 C 10,30, 190,30, 190,160" stroke="#334155" strokeWidth="1.5" fill="none" opacity="0.25" />
      
      {/* Rough rocky floor */}
      <path d="M 0,140 Q 50,138, 100,142 T 200,139 L 200,160 L 0,160 Z" fill="#0f172a" />
      <line x1="0" y1="140" x2="200" y2="140" stroke="#475569" strokeWidth="1.5" />

      {/* PORTANOLE VESSEL ASSEMBLY (No Wheels, No Tires) */}
      <g transform="translate(45, 12)">
        {/* Grounding line / Mât de mise à la terre */}
        <line x1="10" y1="128" x2="10" y2="115" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="1 1" />
        <path d="M 6,128 L 14,128 M 8,131 L 12,131 M 9,134 L 11,134" stroke="#eab308" strokeWidth="1" />

        {/* Heavy-duty steel skid base / Traîneau de mine */}
        <path d="M 0,128 L 65,128 L 72,122 L 65,122 L 5,122 Z" fill="url(#brushed-steel)" stroke="#334155" strokeWidth="0.8" />
        {/* Supporting legs holding the tank */}
        <rect x="15" y="100" width="8" height="23" fill="url(#brushed-steel)" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="42" y="100" width="8" height="23" fill="url(#brushed-steel)" stroke="#1e293b" strokeWidth="0.8" />

        {/* Main Pressurized Vessel body (Cylindrical tank) */}
        <rect x="10" y="50" width="45" height="52" rx="4" fill="url(#safety-yellow)" stroke="#854d0e" strokeWidth="1.2" />
        {/* Welding seams on the tank */}
        <line x1="10" y1="76" x2="55" y2="76" stroke="#ca8a04" strokeWidth="1.5" opacity="0.6" />
        
        {/* Brand Text / Label on Vessel */}
        <rect x="15" y="60" width="35" height="11" rx="1" fill="#1e293b" stroke="#ca8a04" strokeWidth="0.5" />
        <text x="32.5" y="68" fill="#eab308" fontSize="5.5" fontWeight="black" textAnchor="middle" fontFamily="monospace" letterSpacing="0.5">SMI-ANFO</text>

        {/* Wide Charging Funnel (Entonnoir de chargement) on top */}
        <path d="M 12,50 L 53,50 L 48,34 L 17,34 Z" fill="url(#brushed-steel)" stroke="#475569" strokeWidth="1" />
        {/* Safety Grid representation inside the funnel */}
        <line x1="20" y1="38" x2="45" y2="38" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 1.5" />
        <line x1="22" y1="44" x2="43" y2="44" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="2 1.5" />

        {/* Sturdy steel tubular handles (Poignées de portage) */}
        <path d="M 10,70 L -2,70 L -2,85 L 10,85" fill="none" stroke="url(#brushed-steel)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 55,70 L 67,70 L 67,85 L 55,85" fill="none" stroke="url(#brushed-steel)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Pressure Gauge & Safety Relief Valve */}
        {/* Tiny brass fitting */}
        <rect x="42" y="28" width="4" height="6" fill="#ca8a04" />
        {/* Pressure gauge circle */}
        <circle cx="44" cy="24" r="5" fill="#ffffff" stroke="#334155" strokeWidth="1" />
        <line x1="44" y1="24" x2="46" y2="21" stroke="#ef4444" strokeWidth="0.8" /> {/* Needle */}
        
        {/* Compressed Air Inlet connection (Vanne d'air) */}
        {/* Air inlet valve */}
        <rect x="6" y="85" width="4" height="6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.5" />
        {/* Red control handle */}
        <line x1="4" y1="88" x2="-1" y2="84" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
        {/* Incoming yellow high-pressure air hose connection */}
        <path d="M 6,88 Q -15,92 -20,115" stroke="#eab308" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 6,88 Q -15,92 -20,115" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 4" opacity="0.6" />

        {/* Venturi Injector Block at the very bottom (Chambre d'injection) */}
        <path d="M 22,102 L 43,102 L 40,116 L 25,116 Z" fill="url(#bronze-venturi)" stroke="#78350f" strokeWidth="1" />
        
        {/* Antistatic discharge hose coupling */}
        <rect x="29" y="116" width="7" height="4" fill="url(#brushed-steel)" stroke="#1e293b" strokeWidth="0.8" />

        {/* Semi-rigid antistatic loading hose (Flexible noir/coils carbone) */}
        {/* Curves out of the injector towards the right side */}
        <path d="M 32.5,120 Q 32.5,135 65,130 T 115,100" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
        {/* Reinforcement wire / conductive carbon coil lines */}
        <path d="M 32.5,120 Q 32.5,135 65,130 T 115,100" fill="none" stroke="#cbd5e1" strokeWidth="3.5" strokeDasharray="1 3.5" strokeLinecap="round" opacity="0.6" />

        {/* Hose injection tip inserted in borehole (imagined) */}
        <g transform="translate(115, 100) rotate(-30)">
          {/* Stainless steel lance tip */}
          <rect x="0" y="-2" width="12" height="4" fill="url(#brushed-steel)" stroke="#1e293b" strokeWidth="0.8" />
        </g>
      </g>

      {/* ANFO SPRAY FLOW INDICATORS (AT THE HOSE TIP) */}
      <g transform="translate(170, 100)">
        {/* Blowing ANFO granules/prills */}
        <circle cx="5" cy="-6" r="1" fill="#fef08a" opacity="0.9" />
        <circle cx="9" cy="-1" r="0.8" fill="#fef08a" opacity="0.8">
          <animate attributeName="cx" values="9;24" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="cy" values="-1;-5" dur="0.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0" dur="0.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="12" cy="-9" r="1" fill="#fbbf24" opacity="0.95">
          <animate attributeName="cx" values="12;28" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="cy" values="-9;-15" dur="0.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.95;0" dur="0.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="2" r="0.7" fill="#fef08a" opacity="0.75">
          <animate attributeName="cx" values="6;20" dur="0.9s" repeatCount="indefinite" />
          <animate attributeName="cy" values="2;5" dur="0.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.75;0" dur="0.9s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* DETAILED TECHNICAL ANNOTATIONS */}
      {/* Skid label */}
      <text x="110" y="148" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">Patins de glissement acier (Sled)</text>
      
      {/* Venturi label */}
      <text x="115" y="138" fill="#f59e0b" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">Injecteur Venturi pneumatique</text>
      <path d="M 112,136 Q 100,136 78,124" stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1.5 1.5" fill="none" />

      {/* Air label */}
      <text x="8" y="105" fill="#eab308" fontSize="6" fontWeight="bold" fontFamily="sans-serif">Air 7 bar</text>

      {/* Funnel label */}
      <text x="13" y="26" fill="#cbd5e1" fontSize="6" fontWeight="bold" fontFamily="sans-serif">Grille de sécurité & Remplissage</text>
      <path d="M 62,32 Q 80,36 84,40" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="1.5 1.5" fill="none" />

      {/* Main title banner */}
      <rect x="5" y="10" width="95" height="13" rx="2.5" fill="#1e293b" opacity="0.85" />
      <text x="52.5" y="19" fill="#eab308" fontSize="5.5" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">PORTANOLE PORTATIVE</text>

      {/* MANDATORY EXCELLENCE BRANDING BAR (Right rail) */}
      <rect x="200" y="0" width="20" height="160" fill="url(#excellence-brand-grad)" opacity="0.92" />
      
      <text 
        x="210" 
        y="80" 
        fill="#ffffff" 
        fontSize="8" 
        fontWeight="bold" 
        letterSpacing="2" 
        textAnchor="middle" 
        transform="rotate(90, 210, 80)"
        fontFamily="sans-serif"
      >
        EXCELLENCE
      </text>
    </svg>
  );
};

