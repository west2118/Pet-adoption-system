import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { router } from '@/app/router';

const SPLASH_HOLD_MS = 1600;
const SPLASH_FADE_MS = 400;

const App = (): React.JSX.Element => {
  // The first paint is covered by the pre-React splash in index.html. Give its
  // wordmark/progress animations time to finish, then fade it out instead of
  // yanking it the moment React commits (which happens before it is ever seen
  // on a fast cached load).
  useEffect(() => {
    const splash = document.getElementById('app-boot');
    if (!splash) return;

    let removeTimer: ReturnType<typeof setTimeout> | undefined;
    const holdMs = Math.max(0, SPLASH_HOLD_MS - performance.now());

    const fadeTimer = setTimeout(() => {
      splash.classList.add('boot-done');
      removeTimer = setTimeout(() => splash.remove(), SPLASH_FADE_MS);
    }, holdMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;