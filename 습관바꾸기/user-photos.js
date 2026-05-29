const UserPhotos = (() => {
  const DB_NAME = "habit-day-photos";
  const DB_VERSION = 1;
  const STORE = "photos";
  const SETTINGS_KEY = "habit-day-photo-settings";
  const MAX_PHOTOS = 24;
  const MAX_FILE_BYTES = 12 * 1024 * 1024;

  let dbPromise = null;
  let readyPromise = null;
  const cache = {
    photos: [],
    settings: {
      enabled: true,
      celebrationId: null,
    },
  };

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      if (typeof parsed.enabled === "boolean") {
        cache.settings.enabled = parsed.enabled;
      }

      if (parsed.celebrationId) {
        cache.settings.celebrationId = parsed.celebrationId;
      }
    } catch {
      /* keep defaults */
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(cache.settings));
  }

  function openDb() {
    if (!window.indexedDB) {
      return Promise.reject(new Error("This browser cannot store photos on your device."));
    }

    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const database = request.result;

          if (!database.objectStoreNames.contains(STORE)) {
            database.createObjectStore(STORE, { keyPath: "id" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    return dbPromise;
  }

  async function readAllPhotos() {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const store = transaction.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const rows = request.result || [];
        rows.sort((a, b) => b.createdAt - a.createdAt);
        resolve(rows);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function putPhoto(photo) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.put(photo);

      request.onsuccess = () => resolve(photo);
      request.onerror = () => reject(request.error);
    });
  }

  async function deletePhoto(id) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function compressImage(file, maxDim = 1200, quality = 0.82) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return canvas.toDataURL("image/jpeg", quality);
  }

  function syncDocumentFlag() {
    document.documentElement.dataset.userPhotos =
      usesUserPhotos() || getStarredPerfectUrl() ? "on" : "off";
  }

  function notifyChange() {
    syncDocumentFlag();
    window.dispatchEvent(new CustomEvent("habit-photos-change"));
  }

  async function refreshCache() {
    loadSettings();
    cache.photos = await readAllPhotos();

    if (
      cache.settings.celebrationId &&
      !cache.photos.some((photo) => photo.id === cache.settings.celebrationId)
    ) {
      cache.settings.celebrationId = cache.photos[0]?.id || null;
      saveSettings();
    }

    syncDocumentFlag();
  }

  function init() {
    if (!readyPromise) {
      readyPromise = refreshCache();
    }

    return readyPromise;
  }

  function ready() {
    return init();
  }

  function getPhotos() {
    return cache.photos.slice();
  }

  function getSettings() {
    return { ...cache.settings };
  }

  function hasUserPhotos() {
    return cache.photos.length > 0;
  }

  function usesUserPhotos() {
    return cache.settings.enabled && hasUserPhotos();
  }

  function isEnabled() {
    return usesUserPhotos();
  }

  function getCelebrationUrl() {
    if (!cache.photos.length) {
      return null;
    }

    const starred = cache.photos.find((photo) => photo.id === cache.settings.celebrationId);

    return starred?.dataUrl || cache.photos[0].dataUrl;
  }

  function getScenePool() {
    if (!cache.photos.length) {
      return [];
    }

    const pool = cache.photos.filter((photo) => photo.id !== cache.settings.celebrationId);

    return pool.length ? pool : cache.photos;
  }

  function getThemeAssetPool(theme) {
    if (theme === "friends") {
      return [...FRIENDS_SCENE_POOL];
    }

    if (theme === "kuromi") {
      return [...KUROMI_SCENE_POOL];
    }

    return [];
  }

  function getThemePerfectAsset(theme) {
    if (theme === "friends") {
      return FRIENDS_ASSETS.bunny;
    }

    if (theme === "kuromi") {
      return KUROMI_ASSETS.celebrate;
    }

    return null;
  }

  function getUserSceneUrls() {
    return getScenePool().map((photo) => photo.dataUrl);
  }

  function getUserPerfectUrls() {
    const urls = [];
    const starred = cache.photos.find((photo) => photo.id === cache.settings.celebrationId);

    if (starred) {
      urls.push(starred.dataUrl);
    }

    cache.photos.forEach((photo) => {
      if (!urls.includes(photo.dataUrl)) {
        urls.push(photo.dataUrl);
      }
    });

    return urls;
  }

  function pickFromUrlPool(pool, dateKey, salt = 0) {
    if (!pool.length) {
      return null;
    }

    return pool[getFriendsSceneHash(dateKey, salt) % pool.length];
  }

  function getMergedPartialPool(theme) {
    const pool = getThemeAssetPool(theme);

    if (usesUserPhotos()) {
      return [...pool, ...getUserSceneUrls()];
    }

    return pool;
  }

  function getStarredPerfectUrl() {
    if (!cache.settings.celebrationId) {
      return null;
    }

    const photo = cache.photos.find((item) => item.id === cache.settings.celebrationId);

    return photo?.dataUrl || null;
  }

  function resolvePerfectPhotoUrl(theme) {
    const starred = getStarredPerfectUrl();

    if (starred) {
      return starred;
    }

    if (usesUserPhotos()) {
      const userUrl = getCelebrationUrl();

      if (userUrl) {
        return userUrl;
      }
    }

    return getThemePerfectAsset(theme);
  }

  function resolveThemedCalendarPhoto(data, dateKey, theme) {
    const { total, done, percent } = getDayProgress(data, dateKey);
    const isThemed = theme === "friends" || theme === "kuromi";

    if (total === 0 || done === 0) {
      return null;
    }

    if (!isThemed && !usesUserPhotos() && !getStarredPerfectUrl()) {
      return null;
    }

    if (percent === 100) {
      return resolvePerfectPhotoUrl(theme);
    }

    return pickFromUrlPool(getMergedPartialPool(theme), dateKey);
  }

  function resolveCelebrationUrl(theme) {
    return resolvePerfectPhotoUrl(theme);
  }

  async function setEnabled(enabled) {
    cache.settings.enabled = enabled;
    saveSettings();
    notifyChange();
  }

  async function setCelebrationId(id) {
    cache.settings.celebrationId = id;
    cache.settings.enabled = true;
    saveSettings();
    notifyChange();
  }

  async function addFromFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Please choose an image file.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Image is too large. Try a file under 12 MB.");
    }

    if (cache.photos.length >= MAX_PHOTOS) {
      throw new Error(`You can save up to ${MAX_PHOTOS} photos. Delete one first.`);
    }

    const dataUrl = await compressImage(file);
    const photo = {
      id: makeId(),
      name: file.name.replace(/\.[^.]+$/, "") || "Photo",
      dataUrl,
      createdAt: Date.now(),
    };

    await putPhoto(photo);
    await refreshCache();
    notifyChange();

    return photo;
  }

  async function remove(id) {
    await deletePhoto(id);

    if (cache.settings.celebrationId === id) {
      cache.settings.celebrationId = null;
      saveSettings();
    }

    await refreshCache();
    notifyChange();
  }

  return {
    MAX_PHOTOS,
    init,
    ready,
    getPhotos,
    getSettings,
    hasUserPhotos,
    usesUserPhotos,
    isEnabled,
    getCelebrationUrl,
    getStarredPerfectUrl,
    resolveThemedCalendarPhoto,
    resolveCelebrationUrl,
    setEnabled,
    setCelebrationId,
    addFromFile,
    remove,
    refreshCache,
  };
})();
