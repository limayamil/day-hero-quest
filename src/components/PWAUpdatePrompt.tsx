import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setShowPrompt(true);
    }
  }, [needRefresh, offlineReady]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    close();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <Card className="p-4 shadow-lg border-success bg-card/95 backdrop-blur-sm max-w-sm w-full">
        <div className="space-y-3">
          {needRefresh ? (
            <>
              <div className="flex items-center gap-2 text-success font-medium">
                <RefreshCw className="h-4 w-4" />
                <span>Nueva actualización disponible</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Hay una nueva versión de la app disponible. Actualiza para obtener las últimas mejoras.
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpdate} className="flex-1" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={close} variant="outline" size="sm">
                  Después
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-success font-medium">
                <Download className="h-4 w-4" />
                <span>App lista para usar offline</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La aplicación está lista y puede funcionar sin conexión a internet.
              </p>
              <Button onClick={close} size="sm" className="w-full">
                Entendido
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}