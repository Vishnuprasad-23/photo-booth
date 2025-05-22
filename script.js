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
const textFontSelect = document.getElementById('text-font');
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
  let layoutClass = currentOrientation;
  if (layoutSelect.value === '2x2') {
    layoutClass = 'grid-2x2';
    currentLayout = 4;
  } else if (layoutSelect.value === '2x3') {
    layoutClass = 'grid-2x3';
    currentLayout = 6;
  } else {
    currentLayout = Number(layoutSelect.value);
  }

  photoStrip.className = `flex gap-4 p-6 rounded-lg shadow-md border-2 border-gold relative max-w-3xl ${layoutClass}`;
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
    textDiv.style.fontFamily = textFontSelect.value;
    photoStrip.appendChild(textDiv);
    downloadBtn.classList.remove('hidden');
  } else {
    downloadBtn.classList.add('hidden');
  }
}

function downloadPhotoStrip() {
  // Determine photo dimensions based on screen size
  const screenWidth = window.innerWidth;
  let photoWidth, photoHeight;
  if (screenWidth <= 480) {
    photoWidth = 120;
    photoHeight = 90;
  } else if (screenWidth <= 768) {
    photoWidth = 150;
    photoHeight = 112.5;
  } else {
    photoWidth = 200;
    photoHeight = 150;
  }

  const padding = screenWidth <= 768 ? 8 : 16; // Matches CSS gap-4 (4 * 4px) or reduced for mobile
  const textHeight = screenWidth <= 768 ? 30 : 50;

  // Frame dimensions (including borders)
  const framePadding = {
    none: { width: screenWidth <= 480 ? 2 : screenWidth <= 768 ? 4 : 4, height: screenWidth <= 480 ? 2 : screenWidth <= 768 ? 4 : 4 },
    polaroid: { width: screenWidth <= 480 ? 8 : screenWidth <= 768 ? 10 : 20, height: screenWidth <= 480 ? 16 : screenWidth <= 768 ? 20 : 40 },
    gold: { width: screenWidth <= 480 ? 4 : screenWidth <= 768 ? 6 : 10, height: screenWidth <= 480 ? 4 : screenWidth <= 768 ? 6 : 10 },
    dotted: { width: screenWidth <= 480 ? 2 : screenWidth <= 768 ? 4 : 6, height: screenWidth <= 480 ? 2 : screenWidth <= 768 ? 4 : 6 }
  };
  const frameExtra = framePadding[currentFrame];
  const totalPhotoWidth = photoWidth + frameExtra.width;
  const totalPhotoHeight = photoHeight + frameExtra.height;

  // Determine layout type and calculate canvas size
  let stripWidth, stripHeight;
  let isGrid = false;
  let rows, cols;

  if (layoutSelect.value === '2x2') {
    currentLayout = 4;
    cols = screenWidth <= 480 ? 1 : 2; // Stack vertically on very small screens
    rows = screenWidth <= 480 ? 4 : 2;
    stripWidth = (totalPhotoWidth + padding) * (screenWidth <= 480 ? 1 : 2) + 24;
    stripHeight = (totalPhotoHeight + padding) * (screenWidth <= 480 ? 4 : 2) + (photos.length > 0 ? textHeight + padding : 0) + 24;
    isGrid = true;
  } else if (layoutSelect.value === '2x3') {
    currentLayout = 6;
    cols = screenWidth <= 480 ? 1 : 2;
    rows = screenWidth <= 480 ? 6 : 3;
    stripWidth = (totalPhotoWidth + padding) * (screenWidth <= 480 ? 1 : 2) + 24;
    stripHeight = (totalPhotoHeight + padding) * (screenWidth <= 480 ? 6 : 3) + (photos.length > 0 ? textHeight + padding : 0) + 24;
    isGrid = true;
  } else {
    if (currentOrientation === 'vertical') {
      stripWidth = totalPhotoWidth + 24;
      stripHeight = (totalPhotoHeight + padding) * photos.length + (photos.length > 0 ? textHeight + padding : 0) + 24;
    } else {
      stripWidth = (totalPhotoWidth + padding) * photos.length + 24;
      stripHeight = totalPhotoHeight + (photos.length > 0 ? textHeight + padding : 0) + 24;
    }
  }

  const stripCanvas = document.createElement('canvas');
  stripCanvas.width = stripWidth;
  stripCanvas.height = stripHeight;
  const ctx = stripCanvas.getContext('2d');

  // Set background
  ctx.fillStyle = bgColorPicker.value;
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  // Load and draw images
  let loadedImages = 0;
  const totalImages = photos.length;

  photos.forEach((photo, index) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = photo.src;
    img.onload = () => {
      loadedImages++;

      // Calculate position
      let xOffset = 12 + frameExtra.width / 2;
      let yOffset = 12 + frameExtra.height / 2;

      if (isGrid) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        xOffset += col * (totalPhotoWidth + padding);
        yOffset += row * (totalPhotoHeight + padding);
      } else if (currentOrientation === 'vertical') {
        yOffset += index * (totalPhotoHeight + padding);
      } else {
        xOffset += index * (totalPhotoWidth + padding);
      }

      // Draw frame background (e.g., Polaroid)
      if (photo.frame === 'polaroid') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(
          xOffset - (frameExtra.width / 2),
          yOffset - (frameExtra.height / 4),
          photoWidth + frameExtra.width,
          photoHeight + frameExtra.height
        );
        // Add shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
        ctx.fillRect(
          xOffset - (frameExtra.width / 2),
          yOffset - (frameExtra.height / 4),
          photoWidth + frameExtra.width,
          photoHeight + frameExtra.height
        );
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Draw the image
      ctx.drawImage(img, xOffset, yOffset, photoWidth, photoHeight);

      // Draw frame borders
      if (photo.frame === 'gold') {
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = frameExtra.width / 2;
        ctx.strokeRect(xOffset - (frameExtra.width / 4), yOffset - (frameExtra.height / 4), photoWidth + (frameExtra.width / 2), photoHeight + (frameExtra.height / 2));
      } else if (photo.frame === 'dotted') {
        ctx.strokeStyle = '#1a2a44';
        ctx.lineWidth = frameExtra.width / 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(xOffset - (frameExtra.width / 4), yOffset - (frameExtra.height / 4), photoWidth + (frameExtra.width / 2), photoHeight + (frameExtra.height / 2));
        ctx.setLineDash([]);
      } else if (photo.frame === 'none') {
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = frameExtra.width / 2;
        ctx.strokeRect(xOffset - (frameExtra.width / 4), yOffset - (frameExtra.height / 4), photoWidth + (frameExtra.width / 2), photoHeight + (frameExtra.height / 2));
      }

      // Draw text overlay after all images are loaded
      if (loadedImages === totalImages && regardant.length > 0) {
        let textY;
        if (isGrid) {
          textY = 12 + (totalPhotoHeight + padding) * rows + padding;
        } else {
          textY = currentOrientation === 'vertical'
            ? 12 + (totalPhotoHeight + padding) * photos.length
            : 12 + totalPhotoHeight + padding;
        }

        // Draw text background
        ctx.fillStyle = '#f8f1e9';
        ctx.fillRect(12, textY, stripWidth - 24, textHeight);

        // Draw text
        const fontSize = screenWidth <= 768 ? '0.875rem' : textSizeSelect.value;
        ctx.font = `${fontSize} "${textFontSelect.value}"`;
        ctx.fillStyle = textColorPicker.value;
        ctx.textAlign = textAlignmentSelect.value;
        ctx.textBaseline = 'middle';
        const textX = textAlignmentSelect.value === 'center' ? stripWidth / 2 :
                     textAlignmentSelect.value === 'left' ? 24 : stripWidth - 24;
        ctx.fillText(textInput.value || 'Your Text Here', textX, textY + textHeight / 2);

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
  if (layoutSelect.value === '2x2') {
    currentLayout = 4;
  } else if (layoutSelect.value === '2x3') {
    currentLayout = 6;
  } else {
    currentLayout = Number(layoutSelect.value);
  }
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
textFontSelect.addEventListener('change', renderPhotoStrip);
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