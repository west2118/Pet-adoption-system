import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export const PublicLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      {/*
        The navbar is fixed, so it overlays the page. The landing page owns a full
        100vh hero that the bar sits on top of; every other public page needs the
        clearance instead.
      */}
      <main className={cn('flex-1', pathname !== '/' && 'pt-20')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};