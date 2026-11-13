/* Click handling for locally generated notifications. No polling, caching, or push. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(openNotifications(event.notification.data?.url));
});

async function openNotifications(source) {
  const base = new URL(self.registration.scope);
  let destination = base;
  if (typeof source === 'string') {
    try {
      const url = new URL(source);
      if (url.origin === base.origin && url.pathname.startsWith(base.pathname)) destination = url;
    } catch {
      // Older notifications can lack a usable page URL.
    }
  }
  destination.hash = 'notifications';
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const appPath = path => path.replace(/\/index\.html$/, '/');
  for (const client of windows) {
    const url = new URL(client.url);
    if (url.origin !== destination.origin || appPath(url.pathname) !== appPath(destination.pathname)) continue;
    if (url.href === destination.href) return client.focus();
    try {
      const navigated = await client.navigate(destination.href);
      if (navigated) return navigated.focus();
    } catch {
      // The matching window may have closed during navigation.
    }
  }
  return self.clients.openWindow(destination.href);
}
