const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('capture-btn');
const uploadInput = document.getElementById('upload-input');
const uploadBtn = document.getElementById('upload-btn');
const photoStrip = document.getElementById('photo-strip');
const modeSelect = document.getElementById('mode');
const layoutSelect = document.getElementById('layout');
const orientationSelect = document.getElementById('orientation');
const timerSelect = document.getElementById('timer');
const timerSection = document.getElementById('timer-section');
const filterSelect = document.getElementById('filter');
const frameSelect = document.getElementById('frame');
const textInput = document.getElementById('text-overlay');
const textColorPicker = document.getElementById('text-color');
const textSizeSelect = document.getElementById('text-size');
const textAlignmentSelect = document.getElementById('text-alignment');
const captureSection = document.getElementById('capture-section');
const uploadSection = document.getElementById('upload-section');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const downloadBtn = document.getElementById('download-btn');
const bgColorPicker = document.getElementById('bg-color-picker');
const bgColorSelect = document.getElementById('bg-color-select');
const feedback = document.getElementById('feedback');
const timerCountdown = document.getElementById('timer-countdown');

let photos = [];
let historyManager = new HistoryManager();
let currentLayout = 4;
let currentFilter = 'none';
let currentFrame = 'none';
let currentOrientation = 'vertical';

function setupWebcam() {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error('Error accessing webcam:', err);
      showFeedback('Error accessing webcam', feedback);
    });
}

function stopWebcam() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}

function capturePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  
  // Unflip the captured image
  context.scale(-1, 1);
  context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  context.scale(-1, 1); // Reset the scale
  
  const dataUrl = canvas.toDataURL('image/png');
  addPhoto(dataUrl);
  showFeedback('Photo captured', feedback);
}

function addPhoto(dataUrl) {
  if (photos.length < currentLayout) {
    applyFilterToImage(dataUrl, currentFilter, (filteredDataUrl) => {
      photos.push({ src: filteredDataUrl, filter: currentFilter, frame: currentFrame });
      historyManager.addState(photos);
      updateUndoRedoButtons();
      updateButtonStates();
      renderPhotoStrip();
    });
  } else {
    showFeedback('Maximum photos reached for this layout', feedback);
  }
}

function handleUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      addPhoto(reader.result);
      showFeedback('Photo uploaded', feedback);
    };
    reader.readAsDataURL(file);
  }
}

function renderPhotoStrip() {
  photoStrip.innerHTML = '';
  photoStrip.className = `flex gap-4 p-6 rounded-lg shadow-md border-2 border-gold relative max-w-3xl ${currentOrientation}`;
  photoStrip.style.backgroundColor = bgColorPicker.value;

  photos.forEach((photo, index) => {
    const img = document.createElement('img');
    img.src = photo.src;
    img.className = `photo frame-${photo.frame}`;
    photoStrip.appendChild(img);
  });

  if (photos.length > 0) {
    const textDiv = document.createElement('div');
    textDiv.className = 'text-overlay';
    textDiv.textContent = textInput.value || 'Your Text Here';
    textDiv.style.color = textColorPicker.value;
    textDiv.style.fontSize = textSizeSelect.value;
    textDiv.style.textAlign = textAlignmentSelect.value;
    photoStrip.appendChild(textDiv);
    downloadBtn.classList.remove('hidden');
  } else {
    downloadBtn.classList.add('hidden');
  }
}

function downloadPhotoStrip() {
  // Calculate dimensions
  const photoWidth = 200;
  const photoHeight = 150;
  const frameExtraWidth = currentFrame === 'polaroid' ? 20 : currentFrame === 'gold' ? 10 : currentFrame === 'dotted' ? 6 : 4;
  const frameExtraHeight = currentFrame === 'polaroid' ? 40 : currentFrame === 'gold' ? 10 : currentFrame === 'dotted' ? 6 : 4;
  const textHeight = 50;
  const padding = 16;

  let stripWidth, stripHeight;
  if (currentOrientation === 'vertical') {
    stripWidth = photoWidth + frameExtraWidth;
    stripHeight = (photoHeight + frameExtraHeight) * photos.length + (photos.length - 1) * padding + (photos.length > 0 ? textHeight + padding : 0);
  } else {
    stripWidth = (photoWidth + frameExtraWidth) * photos.length + (photos.length - 1) * padding;
    stripHeight = photoHeight + frameExtraHeight + (photos.length > 0 ? textHeight + padding : 0);
  }

  const stripCanvas = document.createElement('canvas');
  stripCanvas.width = stripWidth;
  stripCanvas.height = stripHeight;
  const ctx = stripCanvas.getContext('2d');

  // Set background color
  ctx.fillStyle = bgColorPicker.value;
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  // Load all images and draw them
  let loadedImages = 0;
  const totalImages = photos.length;

  photos.forEach((photo, index) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = photo.src;
    img.onload = () => {
      loadedImages++;

      let xOffset = 0;
      let yOffset = 0;

      if (currentOrientation === 'vertical') {
        yOffset = index * (photoHeight + frameExtraHeight + padding);
      } else {
        xOffset = index * (photoWidth + frameExtraWidth + padding);
      }

      // Draw frame background if Polaroid
      if (photo.frame === 'polaroid') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          currentOrientation === 'vertical' ? -10 : xOffset - 10,
          currentOrientation === 'vertical' ? yOffset - 10 : -10,
          photoWidth + 20,
          photoHeight + 40
        );
      }

      // Draw the image
      ctx.drawImage(img, xOffset, yOffset, photoWidth, photoHeight);

      // Draw frame borders
      if (photo.frame === 'gold') {
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = 5;
        ctx.strokeRect(xOffset - 2.5, yOffset - 2.5, photoWidth + 5, photoHeight + 5);
      } else if (photo.frame === 'dotted') {
        ctx.strokeStyle = '#1a2a44';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(xOffset - 1.5, yOffset - 1.5, photoWidth + 3, photoHeight + 3);
        ctx.setLineDash([]);
      }

      // Draw text overlay after all images are loaded
      if (loadedImages === totalImages && photos.length > 0) {
        const textY = currentOrientation === 'vertical' ? (photoHeight + frameExtraHeight) * photos.length + (photos.length - 1) * padding + padding : photoHeight + frameExtraHeight + padding;
        ctx.fillStyle = '#f8f1e9';
        ctx.fillRect(0, textY, stripWidth, textHeight);
        ctx.font = `${textSizeSelect.value} Caveat`;
        ctx.fillStyle = textColorPicker.value;
        ctx.textAlign = textAlignmentSelect.value;
        ctx.textBaseline = 'middle';
        ctx.fillText(textInput.value || 'Your Text Here', stripWidth / 2, textY + textHeight / 2);

        // Download the canvas
        const link = document.createElement('a');
        link.download = 'photo-strip.png';
        link.href = stripCanvas.toDataURL('image/png');
        link.click();
        showFeedback('Photo strip downloaded', feedback);
      }
    };
    img.onerror = () => {
      loadedImages++;
      console.error('Error loading image:', photo.src);
      if (loadedImages === totalImages) {
        showFeedback('Some images failed to load, but download completed', feedback);
      }
    };
  });
}

function toggleMode() {
  if (modeSelect.value === 'capture') {
    captureSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
    timerSection.classList.remove('hidden');
    setupWebcam();
  } else {
    captureSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    timerSection.classList.add('hidden');
    stopWebcam();
  }
  updateButtonStates();
}

function handleCaptureWithTimer() {
  if (photos.length >= currentLayout) {
    showFeedback('Maximum photos reached for this layout', feedback);
    return;
  }
  const timerValue = parseInt(timerSelect.value);
  if (timerValue > 0) {
    startCountdown(timerValue, timerCountdown, capturePhoto);
  } else {
    capturePhoto();
  }
}

function updateUndoRedoButtons() {
  undoBtn.disabled = !historyManager.canUndo();
  redoBtn.disabled = !historyManager.canRedo();
}

function updateButtonStates() {
  const isMaxReached = photos.length >= currentLayout;
  captureBtn.disabled = isMaxReached;
  uploadBtn.disabled = isMaxReached;
}

function undo() {
  const previousState = historyManager.undo();
  if (previousState) {
    photos = previousState;
    updateUndoRedoButtons();
    updateButtonStates();
    renderPhotoStrip();
  }
}

function redo() {
  const nextState = historyManager.redo();
  if (nextState) {
    photos = nextState;
    updateUndoRedoButtons();
    updateButtonStates();
    renderPhotoStrip();
  }
}

modeSelect.addEventListener('change', () => {
  photos = [];
  historyManager = new HistoryManager();
  updateUndoRedoButtons();
  updateButtonStates();
  renderPhotoStrip();
  toggleMode();
});

layoutSelect.addEventListener('change', () => {
  currentLayout = Number(layoutSelect.value);
  photos = photos.slice(0, currentLayout);
  historyManager = new HistoryManager();
  historyManager.addState(photos);
  updateUndoRedoButtons();
  updateButtonStates();
  renderPhotoStrip();
});

orientationSelect.addEventListener('change', () => {
  currentOrientation = orientationSelect.value;
  renderPhotoStrip();
});

timerSelect.addEventListener('change', () => {
  renderPhotoStrip();
});

filterSelect.addEventListener('change', () => {
  currentFilter = filterSelect.value;
  video.style.filter = currentFilter;
  const promises = photos.map((photo, index) => {
    return new Promise((resolve) => {
      applyFilterToImage(photo.src, currentFilter, (filteredDataUrl) => {
        photos[index] = { ...photo, src: filteredDataUrl, filter: currentFilter };
        resolve();
      });
    });
  });
  Promise.all(promises).then(() => renderPhotoStrip());
});

frameSelect.addEventListener('change', () => {
  currentFrame = frameSelect.value;
  photos = photos.map(photo => ({ ...photo, frame: currentFrame }));
  renderPhotoStrip();
});

textInput.addEventListener('input', renderPhotoStrip);
textColorPicker.addEventListener('input', renderPhotoStrip);
textSizeSelect.addEventListener('change', renderPhotoStrip);
textAlignmentSelect.addEventListener('change', renderPhotoStrip);

bgColorPicker.addEventListener('input', () => {
  bgColorSelect.value = bgColorPicker.value;
  renderPhotoStrip();
});

bgColorSelect.addEventListener('change', () => {
  bgColorPicker.value = bgColorSelect.value;
  renderPhotoStrip();
});

captureBtn.addEventListener('click', handleCaptureWithTimer);
uploadBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', handleUpload);
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
downloadBtn.addEventListener('click', downloadPhotoStrip);

// Initialize
toggleMode();