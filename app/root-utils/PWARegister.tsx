import { useRegisterSW } from "virtual:pwa-register/react";
import styles from "./PWARegister.module.css";

export function PWARegister() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered:", r);
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Optional: Show prompt when update is available or app is offline-ready
  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.message}>
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click reload to update.</span>
        )}
      </div>
      <div className={styles.actions}>
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className={styles.reloadButton}
          >
            Reload
          </button>
        )}
        <button onClick={close} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
}
