import { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Contenido principal */}
      <main className="pb-16">
        {children}
      </main>

      {/* Navegación inferior */}
      <BottomNavigation />
    </div>
  );
};