import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
      // Auto-hide after 5 seconds
      setTimeout(() => setShowOffline(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOffline && isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <Alert className={`max-w-sm shadow-lg border-2 ${
        isOnline
          ? 'border-success bg-success/10 text-success'
          : 'border-warning bg-warning/10 text-warning'
      }`}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="font-medium">
            {isOnline
              ? '¡Conexión restablecida!'
              : 'Sin conexión - La app funciona offline'
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}