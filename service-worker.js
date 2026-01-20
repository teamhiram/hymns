const CACHE_NAME = 'hymns-v5';
const urlsToCache = [
  './',
  './index.html',
  './json-data-set/jp-dai-uta-web.json',
  './json-data-set/jp-dai-zen-web.json',
  './json-data-set/ch-dai-web.json',
  './json-data-set/jp-sup-uta-web.json',
  './json-data-set/jp-sup-zen-web.json',
  './fonts/GlowSansSC-Compressed-Light.otf',
  './fonts/GlowSansSC-Compressed-Regular.otf',
  './fonts/GlowSansSC-Compressed-Medium.otf',
  './fonts/GlowSansSC-Normal-Light.otf',
  './fonts/GlowSansSC-Normal-Regular.otf',
  './fonts/GlowSansSC-Normal-Medium.otf'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✓ Opened cache:', CACHE_NAME);
        // 各リソースを個別にキャッシュして、一部が失敗しても続行
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`⚠️ Failed to cache ${url}:`, error.message);
              // 相対パスで再試行
              if (url.startsWith('./')) {
                const altUrl = url.substring(2);
                return cache.add(altUrl).catch(err => {
                  console.warn(`⚠️ Failed to cache ${altUrl} (alternative):`, err.message);
                  return null;
                });
              }
              return null;
            });
          })
        ).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
          const failed = results.filter(r => r.status === 'rejected' || r.value === null).length;
          console.log(`✓ Cached ${successful} resources, ${failed} failed`);
          
          // キャッシュされたアイテムを確認
          return cache.keys().then(keys => {
            console.log(`✓ Cache contains ${keys.length} items:`);
            keys.forEach((request, index) => {
              if (index < 10) {
                console.log(`  ${index + 1}. ${request.url}`);
              }
            });
            if (keys.length > 10) {
              console.log(`  ... and ${keys.length - 10} more`);
            }
          });
        });
      })
      .then(() => {
        // インストール完了後、即座にアクティベート
        console.log('✓ Service Worker installed, skipping wait');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('✗ Service Worker installation failed:', error);
        // エラーが発生しても続行（部分的にキャッシュされていればOK）
        return self.skipWaiting();
      })
  );
});

// 複数のURLパターンでキャッシュを検索するヘルパー関数
async function findInCache(url) {
  const urlObj = new URL(url);
  const baseUrl = urlObj.origin + urlObj.pathname;
  const searchPatterns = [
    url,                    // 完全一致
    baseUrl,                // パス名のみ
    './' + urlObj.pathname.split('/').pop(),  // 相対パス（ファイル名のみ）
    urlObj.pathname,        // パス名（先頭の/なし）
    url.split('?')[0],      // クエリパラメータ除去
    url.split('#')[0],      // フラグメント除去
  ];

  // 重複を除去
  const uniquePatterns = [...new Set(searchPatterns)];

  for (const pattern of uniquePatterns) {
    try {
      const cached = await caches.match(pattern);
      if (cached) {
        console.log(`Cache hit: ${pattern} (requested: ${url})`);
        return cached;
      }
    } catch (e) {
      // 無視して次を試す
    }
  }

  // すべてのキャッシュを検索
  const cacheNames = await caches.keys();
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (const request of keys) {
      if (request.url === url || request.url === baseUrl || 
          request.url.endsWith(urlObj.pathname) ||
          request.url.includes(urlObj.pathname.split('/').pop())) {
        const cached = await cache.match(request);
        if (cached) {
          console.log(`Cache hit (deep search): ${request.url} (requested: ${url})`);
          return cached;
        }
      }
    }
  }

  return null;
}

// フェッチイベントでネットワーク優先（Network First戦略）
self.addEventListener('fetch', (event) => {
  // GETリクエストのみ処理
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = event.request.url;
  const isNavigation = event.request.mode === 'navigate' || 
                       event.request.destination === 'document';

  event.respondWith(
    (async () => {
      try {
        // まずネットワークから取得を試みる（オンラインファースト）
        console.log('→ Fetching from network:', requestUrl);
        try {
          const response = await fetch(event.request);
          
          // 有効なレスポンスの場合のみキャッシュに保存
          if (response && response.status === 200 && response.type === 'basic') {
            // レスポンスをクローン（一度しか読み取れないため）
            const responseToCache = response.clone();

            // キャッシュに保存（非同期、エラーを無視）
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('✓ Cached:', requestUrl);
              })
              .catch((error) => {
                console.warn('Failed to cache:', requestUrl, error);
              });
          }

          console.log('✓ Serving from network:', requestUrl);
          return response;
        } catch (fetchError) {
          // ネットワークエラー時、キャッシュから取得を試みる
          console.warn('✗ Network fetch failed, trying cache:', requestUrl, fetchError);
          
          // キャッシュを確認（複数のパターンで検索）
          const cachedResponse = await findInCache(requestUrl);
          
          if (cachedResponse) {
            console.log('✓ Serving from cache (offline):', requestUrl);
            return cachedResponse;
          }
          
          // オフライン時、ページナビゲーションの場合はindex.htmlを返す
          if (isNavigation) {
            const indexCache = await findInCache('./index.html') || 
                               await findInCache('index.html') ||
                               await findInCache('/index.html');
            if (indexCache) {
              console.log('✓ Serving index.html as fallback');
              return indexCache;
            }
          }
          
          // JSONファイルの場合は、複数のパターンで再試行
          if (requestUrl.endsWith('.json')) {
            const jsonCache = await findInCache(requestUrl);
            if (jsonCache) {
              console.log('✓ Serving JSON from cache:', requestUrl);
              return jsonCache;
            }
          }
          
          // フォントファイルの場合も再試行
          if (requestUrl.includes('/fonts/')) {
            const fontCache = await findInCache(requestUrl);
            if (fontCache) {
              console.log('✓ Serving font from cache:', requestUrl);
              return fontCache;
            }
          }
          
          // 最終的なフォールバック
          if (isNavigation) {
            return new Response('Offline: Please ensure you have visited this site while online to cache resources.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html; charset=utf-8'
              })
            });
          }
          
          throw fetchError;
        }
      } catch (error) {
        console.error('✗ Service Worker error:', error);
        // 最終的なフォールバック
        if (isNavigation) {
          const indexCache = await findInCache('./index.html') || 
                            await findInCache('index.html');
          if (indexCache) {
            return indexCache;
          }
        }
        throw error;
      }
    })()
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // すべてのクライアントを制御下に置く（即座に新しいService Workerを有効化）
      return self.clients.claim();
    })
    .then(() => {
      // すべてのクライアントにメッセージを送信してリロードを促す
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED' });
        });
      });
    })
  );
});

