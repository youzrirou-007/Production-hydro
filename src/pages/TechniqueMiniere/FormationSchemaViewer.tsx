import React from 'react';
import { HOLES_DATA, HOLES_DATA_9, HOLES_DATA_12_INTL, HOLES_DATA_9_INTL } from './data';
import type { GabaritType, HoleInfo } from './types';

export type FormationBlastStep = 'tous' | 'bouchon' | 'g1' | 'g2' | 'g3' | 'g4' | 'radier_parements' | 'voute';

interface FormationSchemaViewerProps {
  gabarit: GabaritType;
  highlightStep: FormationBlastStep;
  className?: string;
}

// Reproduit exactement la logique de SchemaTab.tsx — source de vérité identique, sans dupliquer le composant complet
const getStepGroup = (hole: HoleInfo, gab: GabaritType): FormationBlastStep => {
  if (hole.type === 'vide') return 'tous';
  const is9 = gab.startsWith('9m2');
  if (hole.type === 'charge') return 'bouchon';
  if (hole.type === 'g1') return 'g1';
  if (hole.type === 'g2') return 'g2';
  if (hole.type === 'g3') return 'g3';
  if (!is9 && hole.type === 'g4') return 'g4';
  if (hole.type === 'radier' || hole.type === 'parement') return 'radier_parements';
  return 'voute';
};

export const FormationSchemaViewer: React.FC<FormationSchemaViewerProps> = ({ gabarit, highlightStep, className }) => {
  const holes: HoleInfo[] =
    gabarit === '9m2' ? HOLES_DATA_9 :
    gabarit === '9m2_intl' ? HOLES_DATA_9_INTL :
    gabarit === '12m2_intl' ? HOLES_DATA_12_INTL :
    HOLES_DATA;

  return (
    <svg viewBox="0 0 1000 800" className={className || 'w-full h-full'}>
      <defs>
        <radialGradient id="formationGoldGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0" />
        </radialGradient>
      </defs>

      {holes.map(hole => {
        const isVide = hole.type === 'vide';
        const stepGroup = getStepGroup(hole, gabarit);
        const isActive = highlightStep === 'tous' || stepGroup === highlightStep;
        const isDone = highlightStep !== 'tous' && (() => {
          const order: FormationBlastStep[] = ['bouchon', 'g1', 'g2', 'g3', 'g4', 'radier_parements', 'voute'];
          const activeIdx = order.indexOf(highlightStep);
          const holeIdx = order.indexOf(stepGroup);
          return holeIdx !== -1 && holeIdx < activeIdx;
        })();

        const opacity = isVide ? 0.25 : isActive ? 1 : isDone ? 0.35 : 0.12;
        const fill = isVide ? '#94a3b8' : isActive ? '#ffd700' : '#64748b';
        const radius = isVide ? 7 : 9;

        return (
          <g key={hole.id} opacity={opacity} style={{ transition: 'opacity 0.5s ease' }}>
            {isActive && !isVide && (
              <circle cx={hole.x} cy={hole.y} r={22} fill="url(#formationGoldGlow)" />
            )}
            <circle
              cx={hole.x}
              cy={hole.y}
              r={radius}
              fill={fill}
              stroke={isActive ? '#8B1A1A' : '#334155'}
              strokeWidth={isActive ? 2 : 1}
            />
          </g>
        );
      })}
    </svg>
  );
};
