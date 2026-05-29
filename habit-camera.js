const HabitCamera = (() => {
  const overlay = document.querySelector("#habitCameraOverlay");
  const video = document.querySelector("#habitCameraVideo");
  const shutterButton = document.querySelector("#habitCameraShutter");
  const cancelButton = document.querySelector("#habitCameraCancel");
  const fallbackInput = document.querySelector("#habitCameraInput");

  let stream = null;
  let pendingResolve = null;

  function supportsInline() {
    return Boolean(navigator.mediaDevices?.getUserMedia && overlay && video);
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (video) {
      video.srcObject = null;
    }
  }

  function hideOverlay() {
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
    document.body.classList.remove("habit-camera-open");
  }

  function showOverlay() {
    if (!overlay) {
      return;
    }

    overlay.hidden = false;
    document.body.classList.add("habit-camera-open");
  }

  function finish(result) {
    const resolve = pendingResolve;
    pendingResolve = null;
    stopStream();
    hideOverlay();

    if (resolve) {
      resolve(result);
    }
  }

  function captureFrame() {
    if (!video || !video.videoWidth) {
      return null;
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          resolve(new File([blob], `habit-${Date.now()}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88
      );
    });
  }

  async function startStream() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
  }

  function openFilePicker() {
    return new Promise((resolve) => {
      if (!fallbackInput) {
        resolve(null);
        return;
      }

      const onChange = () => {
        fallbackInput.removeEventListener("change", onChange);
        const file = fallbackInput.files?.[0] || null;
        fallbackInput.value = "";
        resolve(file);
      };

      fallbackInput.addEventListener("change", onChange);
      fallbackInput.value = "";
      fallbackInput.click();
    });
  }

  async function capturePhoto() {
    if (!supportsInline()) {
      return openFilePicker();
    }

    showOverlay();

    try {
      await startStream();
    } catch {
      hideOverlay();
      stopStream();
      return openFilePicker();
    }

    return new Promise((resolve) => {
      pendingResolve = resolve;
    });
  }

  if (shutterButton) {
    shutterButton.addEventListener("click", async () => {
      const file = await captureFrame();
      finish(file);
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", () => finish(null));
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay.querySelector(".habit-camera-backdrop")) {
        finish(null);
      }
    });
  }

  return {
    supportsInline,
    capturePhoto,
  };
})();
