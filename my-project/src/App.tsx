import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/AppProviders';
import { router } from '@/app/router';

const App = (): React.JSX.Element => {
  // The first paint is covered by the pre-React splash in index.html; drop it as soon
  // as React has something to show so the two never overlap.
  useEffect(() => {
    document.getElementById('app-boot')?.remove();
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;