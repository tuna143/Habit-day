const HabitPhotos = (() => {
  const DB_NAME = "habit-day-habit-snaps";
  const DB_VERSION = 1;
  const STORE = "snaps";
  const MAX_FILE_BYTES = 8 * 1024 * 1024;

  let dbPromise = null;
  let readyPromise = null;

  function snapKey(dateKey, habitId) {
    return `${dateKey}|${habitId}`;
  }

  function openDb() {
    if (!window.indexedDB) {
      return Promise.reject(new Error("This browser cannot store habit photos."));
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

  async function compressImage(file, maxDim = 960, quality = 0.82) {
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

  async function getSnap(dateKey, habitId) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const store = transaction.objectStore(STORE);
      const request = store.get(snapKey(dateKey, habitId));

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async function getSnapsForDate(dateKey) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readonly");
      const store = transaction.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const map = {};

        (request.result || []).forEach((row) => {
          if (row.dateKey === dateKey && row.dataUrl) {
            map[row.habitId] = row.dataUrl;
          }
        });

        resolve(map);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async function saveSnap(dateKey, habitId, file) {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Please choose a photo.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Photo is too large (max 8 MB).");
    }

    const dataUrl = await compressImage(file);
    const database = await openDb();
    const record = {
      id: snapKey(dateKey, habitId),
      dateKey,
      habitId,
      dataUrl,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  async function removeSnap(dateKey, habitId) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.delete(snapKey(dateKey, habitId));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function removeSnapsForHabit(habitId) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const rows = request.result || [];
        rows
          .filter((row) => row.habitId === habitId)
          .forEach((row) => store.delete(row.id));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  }

  async function removeSnapsForDate(dateKey) {
    const database = await openDb();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const rows = request.result || [];
        rows
          .filter((row) => row.dateKey === dateKey)
          .forEach((row) => store.delete(row.id));
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  }

  function ready() {
    if (!readyPromise) {
      readyPromise = openDb();
    }

    return readyPromise;
  }

  return {
    ready,
    getSnap,
    getSnapsForDate,
    saveSnap,
    removeSnap,
    removeSnapsForHabit,
    removeSnapsForDate,
  };
})();
