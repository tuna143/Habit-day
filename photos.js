const photosEnabled = document.querySelector("#photosEnabled");
const photoInput = document.querySelector("#photoInput");
const photosGrid = document.querySelector("#photosGrid");
const photosCount = document.querySelector("#photosCount");
const photosStatus = document.querySelector("#photosStatus");
const photosEmpty = document.querySelector("#photosEmpty");

function setStatus(message, isError = false) {
  if (!photosStatus) {
    return;
  }

  photosStatus.textContent = message;
  photosStatus.classList.toggle("is-error", isError);
}

function renderPhotos() {
  const photos = UserPhotos.getPhotos();
  const settings = UserPhotos.getSettings();

  photosEnabled.checked = settings.enabled;
  photosCount.textContent = `${photos.length} / ${UserPhotos.MAX_PHOTOS}`;
  photosEmpty.hidden = photos.length > 0;
  photosGrid.innerHTML = "";

  photos.forEach((photo) => {
    const item = document.createElement("li");
    item.className = "photos-card";
    const isCelebration = photo.id === settings.celebrationId;

    const wrap = document.createElement("div");
    wrap.className = "photos-card-image-wrap";

    const image = document.createElement("img");
    image.className = "photos-card-image";
    image.src = photo.dataUrl;
    image.alt = photo.name;
    image.loading = "lazy";
    wrap.append(image);

    const name = document.createElement("p");
    name.className = "photos-card-name";
    name.textContent = photo.name;

    const actions = document.createElement("div");
    actions.className = "photos-card-actions";

    const starButton = document.createElement("button");
    starButton.type = "button";
    starButton.className = `ghost-button photos-star${isCelebration ? " is-active" : ""}`;
    starButton.dataset.action = "celebration";
    starButton.dataset.id = photo.id;
    starButton.textContent = isCelebration ? "★ 100%" : "Set 100%";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ghost-button photos-delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = photo.id;
    deleteButton.setAttribute("aria-label", "Delete photo");
    deleteButton.textContent = "Delete";

    actions.append(starButton, deleteButton);
    item.append(wrap, name, actions);
    photosGrid.append(item);
  });
}

photosGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const { action, id } = button.dataset;

  try {
    if (action === "delete") {
      await UserPhotos.remove(id);
      setStatus("Photo removed.");
    }

    if (action === "celebration") {
      await UserPhotos.setCelebrationId(id);
      setStatus("★ This photo shows on 100% days, calendar & celebration.");
    }

    renderPhotos();
  } catch (error) {
    setStatus(error.message || "Something went wrong.", true);
  }
});

photosEnabled.addEventListener("change", async () => {
  try {
    await UserPhotos.setEnabled(photosEnabled.checked);
    setStatus(
      photosEnabled.checked
        ? "Your photos will mix with theme images."
        : "Only default theme images (no uploads)."
    );
    renderPhotos();
  } catch (error) {
    setStatus(error.message || "Could not save setting.", true);
  }
});

photoInput.addEventListener("change", async () => {
  const file = photoInput.files?.[0];

  if (!file) {
    return;
  }

  setStatus("Adding photo…");

  try {
    await UserPhotos.addFromFile(file);
    setStatus("Photo added.");
    renderPhotos();
  } catch (error) {
    setStatus(error.message || "Could not add photo.", true);
  }

  photoInput.value = "";
});

window.addEventListener("habit-photos-change", renderPhotos);

UserPhotos.ready()
  .then(() => {
    renderPhotos();
    setStatus("");
  })
  .catch(() => {
    setStatus("Could not load your photos.", true);
  });
