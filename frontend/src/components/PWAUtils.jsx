import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const PWAUtils = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Check if PWA is already installed
    const checkPWAInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
        setIsPWAInstalled(true);
      }
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('✅ PWA was installed');
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check PWA installation status
    checkPWAInstallation();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);
          console.log('✅ Service Worker registered successfully:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdateNotification(true);
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('✅ User accepted PWA installation');
        setIsPWAInstalled(true);
      } else {
        console.log('❌ User dismissed PWA installation');
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleUpdateClick = () => {
    if (swRegistration) {
      swRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdateNotification(false);
  };

  // Don't show install prompt if PWA is already installed
  if (isPWAInstalled) {
    return null;
  }

  return (
    <>
      {/* PWA Installation Prompt */}
      {showInstallPrompt && (
        <div className="pwa-prompt">
          <div className="pwa-prompt-content">
            <h3>Install MedCounsel</h3>
            <p>Add to your home screen for quick access and offline use!</p>
            <button onClick={handleInstallClick}>
              <Download className="h-4 w-4 inline mr-2" />
              Install
            </button>
            <button onClick={handleDismissInstall}>
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* PWA Update Notification */}
      {showUpdateNotification && (
        <div className="pwa-update">
          <div className="pwa-update-content">
            <p>New version available! 🚀</p>
            <button onClick={handleUpdateClick}>
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Update Now
            </button>
            <button onClick={handleDismissUpdate}>
              Later
            </button>
          </div>
        </div>
      )}

      {/* Online/Offline Status Indicator */}
      <div className={`pwa-status ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3 inline mr-1" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 inline mr-1" />
            Offline
          </>
        )}
      </div>

      {/* Floating Install Button (only show when install prompt is dismissed) */}
      {!showInstallPrompt && deferredPrompt && (
        <button
          className="install-pwa-btn show"
          onClick={handleInstallClick}
          title="Install MedCounsel App"
          aria-label="Install MedCounsel App"
        >
          <Download className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default PWAUtils;
