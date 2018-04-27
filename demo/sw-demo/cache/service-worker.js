let CacheName = 'sw-v2';
var filesToCache = [
  '/index.html',
  '/js/jquer.js',
  '/css/index.css',
  '/static/'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(CacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache).then(function() {
        return self.skipWaiting();
      }).catch(function(error) {
        console.log('Failed to cache:', error);
      });
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        console.log(`key-----------${key}`);
        if (key !== CacheName) { 
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log('[Service Worker] Fetch', event.request.url);
  event.respondWith(
      caches.match(event.request).then(function (response) {
        // 如果 Service Worker有自己的返回，就直接返回，减少一次 http 请求
        if (response) {
            return response;
        }

        // 如果 service worker 没有返回，那就得直接请求真实远程服务
        var requestToCache = event.request.clone(); // 把原始请求拷过来
        return fetch(requestToCache).then(function (httpRes) {

            // http请求的返回已被抓到，可以处置了。

            // 请求失败了，直接返回失败的结果就好了。
            if (!httpRes || httpRes.status !== 200) {
                return httpRes;
            }

            // 请求成功的话，将请求缓存起来。
            var responseToCache = httpRes.clone();
            // 选择性缓存数据
            if (/\.js$|\.css$|\.jpg$|\.png$|\.html$/.test(requestToCache.url) && !/sw/.test(requestToCache.url)) {
              caches.open(CacheName)
                .then(function (cache) {
                  cache.put(requestToCache, responseToCache);
                })
            }

            return httpRes;
        });
      })
  );
});