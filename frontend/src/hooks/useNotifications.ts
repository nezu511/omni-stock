import { useEffect, useState } from 'react';
import { useLang } from '../contexts/LanguageContext';

const API_BASE = 'http://localhost:3001';

// Safari を含むすべてのブラウザで通知許可をリクエストするには
// ユーザーの操作（クリック）から呼び出す必要がある。
// 自動呼び出しは Chrome では動くが Safari では無視される。
export function useNotifications() {
  const { i18n } = useLang();

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  // ユーザーのクリックから呼び出す許可リクエスト関数
  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  useEffect(() => {
    if (!('Notification' in window)) return;

    function notify(title: string, body: string) {
      if (Notification.permission !== 'granted') return;
      new Notification(title, { body });
    }

    const es = new EventSource(`${API_BASE}/api/events`);

    es.addEventListener('low_stock', (e) => {
      const d = JSON.parse(e.data);
      notify(i18n.notifications.lowStockTitle, i18n.notifications.lowStockBody(d.name, d.quantity, d.minThreshold));
    });

    es.addEventListener('item_arrived', (e) => {
      const d = JSON.parse(e.data);
      notify(i18n.notifications.itemArrivedTitle, i18n.notifications.itemArrivedBody(d.name));
    });

    es.addEventListener('reagent_requested', (e) => {
      const d = JSON.parse(e.data);
      notify(i18n.notifications.reagentRequestedTitle, i18n.notifications.reagentRequestedBody(d.reagentName, d.requestedBy));
    });

    es.addEventListener('reagent_arrived', (e) => {
      const d = JSON.parse(e.data);
      notify(i18n.notifications.reagentArrivedTitle, i18n.notifications.reagentArrivedBody(d.reagentName));
    });

    return () => es.close();
  }, [i18n]);

  return { permission, requestPermission };
}
