import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';

/**
 * Fades routed pages in and out. Mounted inside each layout so the chrome
 * (navbar, sidebars, footer) stays put while only the page content animates.
 * Keyed on `pathname` so query-string changes (filters, pagination) do not
 * replay the whole-page transition.
 */
export const PageTransition = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="min-h-full"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
};
