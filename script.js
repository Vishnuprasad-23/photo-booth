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
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  addPhoto(dataUrl);
  showFeedback('Photo captured', feedback);
}

function addPhoto(dataUrl) {
  if (photos.length < currentLayout) {
    photos.push({ src: dataUrl, filter: currentFilter, frame: currentFrame });
    historyManager.addState(photos);
    updateUndoRedoButtons();
    renderPhotoStrip();
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
    img.style.filter = photo.filter;
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
  html2canvas(photoStrip, { backgroundColor: null }).then((canvas) => {
    const link = document.createElement('a');
    link.download = 'photo-strip.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showFeedback('Photo strip downloaded', feedback);
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
}

function handleCaptureWithTimer() {
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

function undo() {
  const previousState = historyManager.undo();
  if (previousState) {
    photos = previousState;
    updateUndoRedoButtons();
    renderPhotoStrip();
  }
}

function redo() {
  const nextState = historyManager.redo();
  if (nextState) {
    photos = nextState;
    updateUndoRedoButtons();
    renderPhotoStrip();
  }
}

modeSelect.addEventListener('change', () => {
  photos = [];
  historyManager = new HistoryManager();
  updateUndoRedoButtons();
  renderPhotoStrip();
  toggleMode();
});

layoutSelect.addEventListener('change', () => {
  currentLayout = Number(layoutSelect.value);
  photos = [];
  historyManager = new HistoryManager();
  updateUndoRedoButtons();
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
  renderPhotoStrip();
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