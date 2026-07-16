import { Variants } from 'motion/react';

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainer = (staggerDelay: number = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerDelay }
  }
});

export const cardHover = {
  whileHover: {
    y: -3,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  whileTap: { scale: 0.98 }
};

export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 26 }
  },
  exit: { opacity: 0, scale: 0.96, y: 6, transition: { duration: 0.15 } }
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, x: 8 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
  },
  exit: { opacity: 0, x: -8, transition: { duration: 0.2 } }
};

export const numberCountUp = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 }
};

export const goldPulse: Variants = {
  idle: { boxShadow: '0 0 0 0 rgba(255,215,0,0)' },
  alert: {
    boxShadow: [
      '0 0 0 0 rgba(255,215,0,0.4)',
      '0 0 0 8px rgba(255,215,0,0)',
    ],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeOut' }
  }
};
