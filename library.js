// ── Navigation ────────────────────────────────────────────────────────────

function openHome() {
  window.location.href = 'index.html';
}

// ── Moderator Mode ────────────────────────────────────────────────────────

let moderatorMode = false;
const MODERATOR_PASSWORD = 'diginat';

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    if (moderatorMode) {
      moderatorMode = false;
      document.body.classList.remove('moderator-mode');
    } else {
      const input = prompt('Enter moderator password:');
      if (input === null) return;
      if (input === MODERATOR_PASSWORD) {
        moderatorMode = true;
        document.body.classList.add('moderator-mode');
      } else {
        alert('Incorrect password.');
      }
    }
  }
});

// ── Image Retry ───────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      const src = img.src;
      img.src = ''; img.src = src;
    }
  });
});

// ── Library Load ──────────────────────────────────────────────────────────

const allBoats = [];

async function loadLibrary() {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';
  allBoats.length = 0;

  if (!window.sb) {
    grid.innerHTML = '<p class="loading-text">Could not connect to database.</p>';
    return;
  }

  try {
    const { data, error } = await window.sb
      .from('boats')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = '<p class="loading-text">No boats yet.</p>';
      return;
    }

    data.forEach(boat => {
      allBoats.push(boat);
      const card = document.createElement('div');
      card.classList.add('boat-card');
      card.innerHTML = `
        <div class="boat-card-song">${boat.song}</div>
        <img class="boat-card-gif" src="boat/${boat.boatFile}" alt="${boat.song}">
        <div class="boat-card-route">From ${boat.from} to ${boat.to}</div>
      `;
      card.addEventListener('click', function() { openBoatPanel(boat, this); });
      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading library:', err);
    grid.innerHTML = '<p class="loading-text">Error loading boats.</p>';
  }
}

if (window.supabaseReady) {
  loadLibrary();
} else {
  window.addEventListener('supabaseReady', () => loadLibrary());
  setTimeout(() => {
    if (allBoats.length === 0 && window.sb) loadLibrary();
  }, 2000);
}

// ── Boat Panel ────────────────────────────────────────────────────────────

function openBoatPanel(boat, cardEl) {
  const existing = document.getElementById('boat-panel');
  if (existing) {
    if (existing.dataset.boatId === String(boat.id)) {
      existing.remove();
      return;
    }
    existing.remove();
  }

  const panel = document.createElement('div');
  panel.id               = 'boat-panel';
  panel.dataset.boatId   = boat.id;
  panel.dataset.choirMode = 'false';
  panel.classList.add('boat-panel-inline');

  panel.innerHTML = `
    <img src="icons/discard.png" class="panel-close-btn" title="Close"
      onclick="document.getElementById('boat-panel').remove()">

    <div class="panel-layout panel-layout--three">

      <div class="panel-right">
        <div class="boat-window-header">
          <div class="boat-window-info">
            <div class="song-title-row">
              <div class="song-title">${boat.song}</div>
              <div class="song-title-icons">
                <img src="icons/play.png" title="Play" id="play-btn" onclick="togglePlayAll()">
                <img src="icons/solo.png" title="Solo" id="choir-btn" onclick="toggleChoir()">
              </div>
            </div>
            <div class="song-route">From ${boat.from} to ${boat.to}</div>
            <div class="boat-window-hint" id="record-hint">Press record to add a song</div>
            <div id="saved-audio-container"></div>
          </div>
        </div>
        <canvas class="waveform-canvas" id="waveform-canvas" style="display:none;"></canvas>
        <div class="boat-window-footer" id="boat-footer">
          <img src="icons/record.png" class="record-btn" title="Record" onclick="startRecording()">
        </div>
      </div>

      <div class="memories-section">
        <div class="memories-title">Memories</div>
        <div class="memories-subtext">Upload photos or videos that relate to this song</div>
        <div class="memories-grid" id="memories-grid-${boat.id}">
          <p class="loading-text">Loading memories...</p>
        </div>
        <div class="memories-upload-row">
          <img src="icons/upload.png" class="memories-upload-icon" onclick="triggerMemoryUpload('${boat.id}')">
          <img src="icons/camera.png" class="memories-upload-icon" onclick="openCameraPreview('${boat.id}')">
        </div>
      </div>

      <div class="comment-section">
        <div class="comment-title">Comments</div>
        <div class="comment-list" id="comment-list-${boat.id}">
          <p class="loading-text">Loading comments...</p>
        </div>
        <div class="comment-input-row">
          <input type="text" id="comment-name" placeholder="Your name" class="comment-input">
          <input type="text" id="comment-text" placeholder="Add a comment..." class="comment-input">
          <button onclick="submitComment('${boat.id}')" class="comment-submit">Post</button>
        </div>
      </div>

    </div>
  `;

  // Insert after last card in the same row
  const grid     = document.getElementById('library-grid');
  const cards    = Array.from(grid.querySelectorAll('.boat-card'));
  const clickedY = cardEl.getBoundingClientRect().top;
  let lastInRow  = cardEl;
  cards.forEach(card => {
    if (Math.abs(card.getBoundingClientRect().top - clickedY) < 5) lastInRow = card;
  });
  lastInRow.insertAdjacentElement('afterend', panel);

  loadAudioForBoat(boat.id);
  loadComments(boat.id);
  loadMemories(boat.id);
}

async function loadAudioForBoat(boatId) {
  const container = document.getElementById('saved-audio-container');
  if (!container) return;
  try {
    const { data, error } = await window.sb
      .from('audio')
      .select('*')
      .eq('boat_id', boatId)
      .order('id', { ascending: true });
    if (error) throw error;
    if (data && data.length > 0) {
      document.getElementById('record-hint').style.display = 'none';
      data.forEach(row => {
        const audioRow = document.createElement('div');
        audioRow.classList.add('audio-row');
        audioRow.dataset.audioId = row.id;
        audioRow.innerHTML = `
          <audio class="saved-audio" src="${row.url}" controls></audio>
          <div class="delete-audio-btn" onclick="deleteAudio('${row.id}', this)">✕</div>
        `;
        container.appendChild(audioRow);
      });
      document.getElementById('record-hint').style.display = 'block';
    }
  } catch (err) {
    console.error('Error loading audio:', err);
  }
}

async function loadMemories(boatId) {
  const grid = document.getElementById(`memories-grid-${boatId}`);
  if (!grid) return;
  try {
    const { data, error } = await window.sb
      .from('memories')
      .select('*')
      .eq('boat_id', boatId)
      .order('id', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      grid.innerHTML = '<p style="opacity:0.5;font-size:0.8rem;">No memories yet.</p>';
      return;
    }
    grid.innerHTML = '';
    data.forEach((row, index) => {
      appendMemory(grid, row.id, row.url, row.media_type, index, boatId);
    });
  } catch (err) {
    console.error('Error loading memories:', err);
  }
}

function appendMemory(grid, memoryId, url, mediaType, index, boatId) {
  const item = document.createElement('div');
  item.classList.add('memory-item');
  item.dataset.memoryId = memoryId;
  item.dataset.index = index;

  const media = mediaType === 'video'
    ? `<video src="${url}" controls class="memory-media"></video>`
    : `<img src="${url}" class="memory-media" alt="memory">`;

  item.innerHTML = `
    ${media}
    <div class="delete-memory-btn" onclick="deleteMemory('${memoryId}', this)">✕</div>
  `;

  item.querySelector('.memory-media').addEventListener('click', () => {
    openLightbox(boatId, index);
  });

  grid.appendChild(item);
}

async function triggerMemoryUpload(boatId) {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = async function() {
    const file = input.files[0];
    if (!file) return;

    const grid         = document.getElementById(`memories-grid-${boatId}`);
    const uploadingEl  = document.createElement('p');
    uploadingEl.style.cssText = 'font-size:0.75rem;opacity:0.6;font-style:italic;';
    uploadingEl.textContent   = 'Uploading…';
    grid.appendChild(uploadingEl);

    try {
      const memoryId  = Date.now().toString();
      const ext       = file.name.split('.').pop();
      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      const path      = `memories/${boatId}/${memoryId}.${ext}`;

      const { error: uploadError } = await window.sb.storage
        .from('recordings')
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = window.sb.storage
        .from('recordings')
        .getPublicUrl(path);
      const downloadURL = urlData.publicUrl;

      const { error: dbError } = await window.sb
        .from('memories')
        .insert({ id: memoryId, boat_id: boatId, url: downloadURL, media_type: mediaType });
      if (dbError) throw dbError;

      uploadingEl.remove();
      grid.querySelector('p')?.remove();
      appendMemory(grid, memoryId, downloadURL, mediaType);

    } catch (err) {
      uploadingEl.textContent = 'Upload failed. Please try again.';
      console.error('Memory upload error:', err);
    }
  };
  input.click();
}

async function deleteMemory(memoryId, btn) {
  if (!moderatorMode) return;
  if (!confirm('Delete this memory?')) return;
  const item = btn.closest('.memory-item');
  try {
    const media = item.querySelector('img, video');
    if (media?.src) {
      const parts = media.src.split('/recordings/');
      if (parts[1]) {
        await window.sb.storage.from('recordings').remove([decodeURIComponent(parts[1])]);
      }
    }
    const { error } = await window.sb.from('memories').delete().eq('id', memoryId);
    if (error) throw error;
    item.remove();
  } catch (err) {
    console.error('Error deleting memory:', err);
  }
}

// ── Lightbox ──────────────────────────────────────────────────────────────

let lightboxBoatId  = null;
let lightboxIndex   = 0;
let lightboxItems   = [];

async function openLightbox(boatId, startIndex) {
  lightboxBoatId = boatId;

  // Fetch all memories for this boat to build the full list
  const { data, error } = await window.sb
    .from('memories')
    .select('*')
    .eq('boat_id', boatId)
    .order('id', { ascending: true });
  if (error || !data) return;

  lightboxItems = data;
  lightboxIndex = startIndex;

  const existing = document.getElementById('lightbox');
  if (existing) existing.remove();

  const lb = document.createElement('div');
  lb.id = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox-backdrop" onclick="closeLightbox()"></div>
    <div class="lightbox-content">
      <div id="lightbox-media-wrap"></div>
      <button class="lightbox-arrow lightbox-arrow--left"  onclick="stepLightbox(-1)">&#8249;</button>
      <button class="lightbox-arrow lightbox-arrow--right" onclick="stepLightbox(1)">&#8250;</button>
      <button class="lightbox-close" onclick="closeLightbox()">✕</button>
      <div class="lightbox-counter" id="lightbox-counter"></div>
    </div>
  `;
  document.body.appendChild(lb);
  renderLightboxMedia();

  document.addEventListener('keydown', lightboxKeyHandler);
}

function renderLightboxMedia() {
  const wrap = document.getElementById('lightbox-media-wrap');
  if (!wrap) return;
  const item = lightboxItems[lightboxIndex];
  if (!item) return;

  wrap.innerHTML = item.media_type === 'video'
    ? `<video src="${item.url}" controls autoplay class="lightbox-media"></video>`
    : `<img src="${item.url}" class="lightbox-media" alt="memory">`;

  document.getElementById('lightbox-counter').textContent =
    `${lightboxIndex + 1} / ${lightboxItems.length}`;

  // Hide arrows if only one item
  document.querySelector('.lightbox-arrow--left').style.display =
    lightboxItems.length <= 1 ? 'none' : '';
  document.querySelector('.lightbox-arrow--right').style.display =
    lightboxItems.length <= 1 ? 'none' : '';
}

function stepLightbox(dir) {
  lightboxIndex = (lightboxIndex + dir + lightboxItems.length) % lightboxItems.length;
  renderLightboxMedia();
}

function closeLightbox() {
  document.getElementById('lightbox')?.remove();
  document.removeEventListener('keydown', lightboxKeyHandler);
}

function lightboxKeyHandler(e) {
  if (e.key === 'ArrowLeft')  stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
  if (e.key === 'Escape')     closeLightbox();
}

// ── Camera Preview ────────────────────────────────────────────────────────

// ── Camera Preview ────────────────────────────────────────────────────────

let cameraStream        = null;
let cameraMediaRecorder = null;
let videoChunks         = [];
let cameraBoatId        = null;
let currentFacingMode   = 'user';

// Canvas-based recording state
let canvasRecordStream  = null;
let canvasDrawLoop      = null;
let recordingCanvas     = null;
let recordingCtx        = null;

function openCameraPreview(boatId) {
  cameraBoatId      = boatId;
  currentFacingMode = 'environment';
  const existing = document.getElementById('camera-preview');
  if (existing) existing.remove();

  const preview = document.createElement('div');
  preview.id = 'camera-preview';
  preview.innerHTML = `
    <div class="camera-backdrop" onclick="closeCameraPreview()"></div>
    <div class="camera-window">
      <button class="camera-close" onclick="closeCameraPreview()">✕</button>
      <button class="camera-flip-btn" onclick="flipCamera()" title="Flip camera">⟳</button>
      <video id="camera-feed" autoplay playsinline muted class="camera-feed"></video>
      <canvas id="camera-canvas" style="display:none;"></canvas>
      <img id="camera-photo-preview" style="display:none;" class="camera-feed" alt="captured">
      <video id="camera-video-preview" style="display:none;" controls class="camera-feed"></video>
      <div class="camera-btn-row" id="camera-btn-row">
        <img src="icons/photo.png" class="camera-action-btn" title="Take Photo"   onclick="takePhoto()">
        <img src="icons/video.png" class="camera-action-btn" title="Record Video" onclick="startVideoRecording()">
      </div>
    </div>
  `;
  document.body.appendChild(preview);
  startCameraStream();
}

async function startCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: true
    });
    const feed = document.getElementById('camera-feed');
    if (feed) {
      feed.srcObject = cameraStream;
      feed.classList.toggle('camera-feed--mirrored', currentFacingMode === 'user');
    }
  } catch (err) {
    alert('Could not access camera.');
    console.error(err);
  }
}

async function flipCamera() {
  currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

  // Stop old stream tracks but keep the MediaRecorder running
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: true
    });
    const feed = document.getElementById('camera-feed');
    if (feed) {
      feed.srcObject = cameraStream;
      feed.classList.toggle('camera-feed--mirrored', currentFacingMode === 'user');
    }
    // Canvas draw loop picks up the new feed automatically on next frame
  } catch (err) {
    alert('Could not switch camera.');
    console.error(err);
  }
}

function closeCameraPreview() {
  stopCanvasDrawLoop();
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  if (cameraMediaRecorder && cameraMediaRecorder.state !== 'inactive') {
    cameraMediaRecorder.stop();
    cameraMediaRecorder = null;
  }
  document.getElementById('camera-preview')?.remove();
}

// ── Photo ─────────────────────────────────────────────────────────────────

function takePhoto() {
  const feed   = document.getElementById('camera-feed');
  const canvas = document.getElementById('camera-canvas');
  canvas.width  = feed.videoWidth;
  canvas.height = feed.videoHeight;

  const ctx        = canvas.getContext('2d');
  const isMirrored = currentFacingMode === 'user';

  if (isMirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(feed, 0, 0);

  const photoPreview         = document.getElementById('camera-photo-preview');
  photoPreview.src           = canvas.toDataURL('image/jpeg');
  photoPreview.style.display = 'block';
  if (isMirrored) photoPreview.classList.add('camera-feed--mirrored');
  document.getElementById('camera-feed').style.display = 'none';

  document.getElementById('camera-btn-row').innerHTML = `
    <img src="icons/accept.png"  class="camera-action-btn" title="Accept"  onclick="acceptPhoto()">
    <img src="icons/discard.png" class="camera-action-btn" title="Discard" onclick="discardCapture()">
  `;
}

async function acceptPhoto() {
  const canvas = document.getElementById('camera-canvas');
  canvas.toBlob(async blob => {
    await uploadMemory(blob, 'image', 'jpg');
    closeCameraPreview();
  }, 'image/jpeg', 0.9);
}

// ── Video (canvas-based so flipping works mid-recording) ──────────────────

function stopCanvasDrawLoop() {
  if (canvasDrawLoop) { cancelAnimationFrame(canvasDrawLoop); canvasDrawLoop = null; }
}

function startCanvasDrawLoop(feed, canvas, ctx) {
  function draw() {
    if (!document.getElementById('camera-preview')) return; // preview closed
    const mirrored = currentFacingMode === 'user';
    ctx.save();
    if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(feed, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    canvasDrawLoop = requestAnimationFrame(draw);
  }
  draw();
}

function startVideoRecording() {
  if (!cameraStream) return;
  videoChunks = [];

  const feed        = document.getElementById('camera-feed');
  recordingCanvas   = document.createElement('canvas');
  recordingCanvas.width  = feed.videoWidth  || 640;
  recordingCanvas.height = feed.videoHeight || 480;
  recordingCtx      = recordingCanvas.getContext('2d');

  // Draw camera feed onto the hidden canvas every frame
  startCanvasDrawLoop(feed, recordingCanvas, recordingCtx);

  // Capture canvas + audio into a combined stream
  const videoTrack = recordingCanvas.captureStream(30).getVideoTracks()[0];
  const audioTrack = cameraStream.getAudioTracks()[0];
  canvasRecordStream = new MediaStream(
    [videoTrack, audioTrack].filter(Boolean)
  );

  const mimeType      = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  cameraMediaRecorder = new MediaRecorder(canvasRecordStream, { mimeType });

  cameraMediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) videoChunks.push(e.data);
  };

  cameraMediaRecorder.onstop = function() {
    stopCanvasDrawLoop();
    const blob = new Blob(videoChunks, { type: mimeType });
    const url  = URL.createObjectURL(blob);

    const feed         = document.getElementById('camera-feed');
    const videoPreview = document.getElementById('camera-video-preview');
    if (feed)         feed.style.display         = 'none';
    if (videoPreview) { videoPreview.src = url; videoPreview.style.display = 'block'; }

    document.getElementById('camera-btn-row').innerHTML = `
      <img src="icons/accept.png"  class="camera-action-btn" title="Accept"  onclick="acceptVideo('${url}', '${mimeType}')">
      <img src="icons/discard.png" class="camera-action-btn" title="Discard" onclick="discardCapture()">
    `;
  };

  cameraMediaRecorder.start(1000);

  document.getElementById('camera-btn-row').innerHTML = `
    <img src="icons/stop.png" class="camera-action-btn" title="Stop" onclick="stopVideoRecording()">
  `;
}

function stopVideoRecording() {
  if (cameraMediaRecorder && cameraMediaRecorder.state !== 'inactive') {
    cameraMediaRecorder.stop();
    cameraMediaRecorder = null;
  }
}

async function acceptVideo(url, mimeType) {
  const blob = await fetch(url).then(r => r.blob());
  const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
  await uploadMemory(blob, 'video', ext);
  closeCameraPreview();
}

// ── Shared upload ─────────────────────────────────────────────────────────

function discardCapture() {
  const feed         = document.getElementById('camera-feed');
  const photoPreview = document.getElementById('camera-photo-preview');
  const videoPreview = document.getElementById('camera-video-preview');
  feed.style.display         = 'block';
  photoPreview.style.display = 'none';
  videoPreview.style.display = 'none';
  photoPreview.src           = '';
  videoPreview.src           = '';
  photoPreview.classList.remove('camera-feed--mirrored');

  document.getElementById('camera-btn-row').innerHTML = `
    <img src="icons/photo.png" class="camera-action-btn" title="Take Photo"   onclick="takePhoto()">
    <img src="icons/video.png" class="camera-action-btn" title="Record Video" onclick="startVideoRecording()">
  `;
}

async function uploadMemory(blob, mediaType, ext) {
  const grid = document.getElementById(`memories-grid-${cameraBoatId}`);

  const uploadingEl = document.createElement('p');
  uploadingEl.style.cssText = 'font-size:0.75rem;opacity:0.6;font-style:italic;grid-column:1/-1;';
  uploadingEl.textContent   = 'Uploading…';
  if (grid) grid.appendChild(uploadingEl);

  try {
    const memoryId = Date.now().toString();
    const path     = `memories/${cameraBoatId}/${memoryId}.${ext}`;

    const { error: uploadError } = await window.sb.storage
      .from('recordings')
      .upload(path, blob, { contentType: blob.type });
    if (uploadError) throw uploadError;

    const { data: urlData } = window.sb.storage
      .from('recordings')
      .getPublicUrl(path);
    const downloadURL = urlData.publicUrl;

    const { error: dbError } = await window.sb
      .from('memories')
      .insert({ id: memoryId, boat_id: cameraBoatId, url: downloadURL, media_type: mediaType });
    if (dbError) throw dbError;

    if (grid) {
      uploadingEl.remove();
      grid.querySelector('p')?.remove();
      appendMemory(grid, memoryId, downloadURL, mediaType, grid.children.length, cameraBoatId);
    }
  } catch (err) {
    if (uploadingEl) uploadingEl.textContent = 'Upload failed. Please try again.';
    console.error('Memory upload error:', err);
  }
}

// ── Recording ─────────────────────────────────────────────────────────────

let mediaRecorder = null;
let audioChunks   = [];
let waveformAnim  = null;
let analyser      = null;
let audioCtx      = null;
let playAllActive = false;

function startRecording() {
  const panel   = document.getElementById('boat-panel');
  const isChoir = panel && panel.dataset.choirMode === 'true';

  const micConstraints = isChoir
    ? { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }
    : { audio: { echoCancellation: true,  noiseSuppression: true,  autoGainControl: true  } };

  navigator.mediaDevices.getUserMedia(micConstraints).then(async function(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
    analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    analyser.fftSize = 256;

    if (isChoir) {
      document.querySelectorAll('#saved-audio-container audio').forEach(a => {
        a.currentTime = 0; a.play();
      });
    }

    document.getElementById('record-hint').style.display = 'none';
    const canvas = document.getElementById('waveform-canvas');
    canvas.style.display = 'block';
    drawWaveform(analyser, canvas);

    document.getElementById('boat-footer').innerHTML = `
      <img src="icons/stop.png" class="record-btn" title="Stop" onclick="stopRecording()">
    `;

    const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
    audioChunks   = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = function() {
      stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(waveformAnim);
      audioCtx.close();

      document.querySelectorAll('#saved-audio-container audio').forEach(a => {
        a.pause(); a.currentTime = 0;
      });

      const blob = new Blob(audioChunks, { type: mimeType });
      const url  = URL.createObjectURL(blob);

      document.getElementById('waveform-canvas').style.display = 'none';
      document.getElementById('boat-footer').innerHTML = `
        <audio id="preview-audio" class="boat-window-audio" src="${url}" controls></audio>
      `;

      const acceptDiscard = document.createElement('div');
      acceptDiscard.id = 'accept-discard-row';
      acceptDiscard.style.cssText = 'display:flex;justify-content:center;gap:16px;margin-top:8px;';
      acceptDiscard.innerHTML = `
        <img src="icons/accept.png"  class="accept-discard-btn" title="Accept"  onclick="acceptRecording('${url}')">
        <img src="icons/discard.png" class="accept-discard-btn" title="Discard" onclick="discardRecording()">
      `;
      document.getElementById('boat-panel').appendChild(acceptDiscard);
      updatePreviewChoir();
    };

    mediaRecorder.start(1000); // collect a chunk every second — fixes long recordings
  }).catch(() => alert('Microphone access was denied.'));
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

async function acceptRecording(url) {
  document.getElementById('accept-discard-row')?.remove();
  document.getElementById('boat-footer').innerHTML = `
    <img src="icons/record.png" class="record-btn" title="Record" onclick="startRecording()">
  `;

  const container = document.getElementById('saved-audio-container');
  container.querySelector('p')?.remove();

  const uploadingRow = document.createElement('div');
  uploadingRow.id = 'uploading-row';
  uploadingRow.style.cssText = 'font-size:0.75rem;opacity:0.6;margin-top:8px;font-style:italic;';
  uploadingRow.textContent = 'Uploading…';
  container.appendChild(uploadingRow);

  try {
    const blob    = await fetch(url).then(r => r.blob());
    const audioId = Date.now().toString();
    const ext     = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const panel   = document.getElementById('boat-panel');
    const boatId  = panel?.dataset.boatId;
    const path    = `${boatId}/${audioId}.${ext}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await window.sb.storage
      .from('recordings')
      .upload(path, blob, { contentType: blob.type });
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = window.sb.storage
      .from('recordings')
      .getPublicUrl(path);
    const downloadURL = urlData.publicUrl;

    // Save record to audio table
    const { error: dbError } = await window.sb
      .from('audio')
      .insert({ id: audioId, boat_id: boatId, url: downloadURL });
    if (dbError) throw dbError;

    uploadingRow.remove();

    const audioRow = document.createElement('div');
    audioRow.classList.add('audio-row');
    audioRow.dataset.audioId = audioId;
    audioRow.innerHTML = `
      <audio class="saved-audio" src="${downloadURL}" controls></audio>
      <div class="delete-audio-btn" onclick="deleteAudio('${audioId}', this)">✕</div>
    `;
    container.appendChild(audioRow);
    document.getElementById('record-hint').style.display = 'block';

  } catch (err) {
    uploadingRow.textContent = 'Upload failed. Please try again.';
    console.error('Upload error:', err);
  }
}

function discardRecording() {
  document.getElementById('accept-discard-row')?.remove();
  document.getElementById('record-hint').style.display = 'block';
  document.getElementById('boat-footer').innerHTML = `
    <img src="icons/record.png" class="record-btn" title="Record" onclick="startRecording()">
  `;
}

function drawWaveform(analyser, canvas) {
  const ctx       = canvas.getContext('2d');
  const bufferLen = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLen);
  function draw() {
    waveformAnim = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    const sliceW = canvas.width / bufferLen;
    let drawX = 0;
    for (let i = 0; i < bufferLen; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(drawX, y) : ctx.lineTo(drawX, y);
      drawX += sliceW;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  draw();
}

// ── Choir & Playback ──────────────────────────────────────────────────────

function toggleChoir() {
  const panel = document.getElementById('boat-panel');
  if (!panel) return;
  const isChoir = panel.dataset.choirMode === 'true';
  panel.dataset.choirMode = isChoir ? 'false' : 'true';
  const btn = document.getElementById('choir-btn');
  btn.src   = isChoir ? 'icons/solo.png'  : 'icons/choir.png';
  btn.title = isChoir ? 'Solo'            : 'Choir';
  if (!isChoir) {
    const hint = document.getElementById('record-hint');
    if (hint) {
      hint.textContent = 'Tip: use headphones for best choir recording';
      setTimeout(() => { hint.textContent = 'Press record to add a song'; }, 4000);
    }
  }
  updatePreviewChoir();
}

function updatePreviewChoir() {
  const preview = document.getElementById('preview-audio');
  if (!preview) return;
  const panel   = document.getElementById('boat-panel');
  const isChoir = panel && panel.dataset.choirMode === 'true';
  preview.onplay = preview.onpause = preview.onended = null;
  if (isChoir) {
    preview.onplay  = () => document.querySelectorAll('#saved-audio-container audio').forEach(a => { a.currentTime = preview.currentTime; a.play(); });
    preview.onpause = () => document.querySelectorAll('#saved-audio-container audio').forEach(a => a.pause());
    preview.onended = () => document.querySelectorAll('#saved-audio-container audio').forEach(a => { a.pause(); a.currentTime = 0; });
  }
}

function togglePlayAll() {
  const audios = Array.from(document.querySelectorAll('#saved-audio-container audio'));
  if (audios.length === 0) return;
  const btn = document.getElementById('play-btn');
  if (!playAllActive) {
    playAllActive = true;
    btn.src = 'icons/pause.png'; btn.title = 'Pause';
    audios.forEach(a => { a.currentTime = 0; a.play(); });
    let finished = 0;
    audios.forEach(a => {
      a.onended = function() {
        if (++finished === audios.length) {
          playAllActive = false;
          btn.src = 'icons/play.png'; btn.title = 'Play';
        }
      };
    });
  } else {
    playAllActive = false;
    btn.src = 'icons/play.png'; btn.title = 'Play';
    audios.forEach(a => { a.pause(); a.currentTime = 0; });
  }
}

// ── Comments ──────────────────────────────────────────────────────────────

async function loadComments(boatId) {
  const list = document.getElementById(`comment-list-${boatId}`);
  if (!list) return;
  try {
    const { data, error } = await window.sb
      .from('comments')
      .select('*')
      .eq('boat_id', boatId)
      .order('timestamp', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      list.innerHTML = '<p style="opacity:0.5;font-size:0.8rem;">No comments yet.</p>';
      return;
    }
    list.innerHTML = '';
    data.forEach(c => {
      const item = document.createElement('div');
      item.classList.add('comment-item');
      item.dataset.commentId = c.id;
      item.innerHTML = `
        <div class="comment-item-header">
          <span class="comment-author">${c.name}</span>
          <div class="delete-comment-btn" onclick="deleteComment('${boatId}', '${c.id}', this)">✕</div>
        </div>
        <span class="comment-text">${c.text}</span>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading comments:', err);
  }
}

async function submitComment(boatId) {
  const nameEl = document.getElementById('comment-name');
  const textEl = document.getElementById('comment-text');
  const name   = nameEl.value.trim();
  const text   = textEl.value.trim();
  if (!name || !text) { alert('Please enter your name and a comment.'); return; }
  try {
    const commentId = Date.now().toString();
    const { error } = await window.sb.from('comments').insert({
      id:        commentId,
      boat_id:   boatId,
      name,
      text,
      timestamp: commentId
    });
    if (error) throw error;
    nameEl.value = '';
    textEl.value = '';
    loadComments(boatId);
  } catch (err) {
    console.error('Error posting comment:', err);
    alert('Could not post comment.');
  }
}

async function deleteComment(boatId, commentId, btn) {
  if (!moderatorMode) return;
  if (!confirm('Delete this comment?')) return;
  try {
    const { error } = await window.sb.from('comments').delete().eq('id', commentId);
    if (error) throw error;
    btn.closest('.comment-item').remove();
  } catch (err) {
    console.error('Error deleting comment:', err);
  }
}

async function deleteAudio(audioId, btn) {
  if (!moderatorMode) return;
  if (!confirm('Delete this recording?')) return;
  const row = btn.closest('.audio-row');
  try {
    const audio = row.querySelector('audio');
    if (audio?.src) {
      const parts = audio.src.split('/recordings/');
      if (parts[1]) {
        await window.sb.storage.from('recordings').remove([decodeURIComponent(parts[1])]);
      }
    }
    const { error } = await window.sb.from('audio').delete().eq('id', audioId);
    if (error) throw error;
    row.remove();
  } catch (err) {
    console.error('Error deleting audio:', err);
  }
}

// ── Info Window ───────────────────────────────────────────────────────────

function toggleInfo() {
  const existing = document.getElementById('info-window');
  if (existing) { existing.remove(); return; }

  const savedText = `Sound of Wind is an archive meant to connect those in the diaspora. This project stems from the strong choir culture in Latvia and its diasporas, and honors the legacy of it.

Each boat is a digital choir cover of a song, that each of us took with us into the diaspora.

HOW TO USE:
1. Add a song - click on the big plus button and add a beloved song from your home town.
2. Record - Once your boat is added, record your song.
3. Accept - listen back to your recording and decide if it's the right one.
4. Choir - by pressing the person icon at the top of the window you can activate choir mode. This means when you record you can hear all the previous recordings.
5. Explore - if you recognize a song, add your part to it too.
6. Library - view the full list of boats in the library tab (the three boats). There you can listen back and share stories about specific songs or travels.`;

  const win = document.createElement('div');
  win.id = 'info-window';
  win.classList.add('info-window');
  win.innerHTML = `
    <div class="info-window-header">
      <h2>Sounds of Wind</h2>
      <img src="icons/discard.png" title="Close" onclick="toggleInfo()">
    </div>
    <p style="margin:0;font-size:0.9rem;line-height:1.6;opacity:0.85;white-space:pre-wrap;">${savedText}</p>
  `;
  document.body.appendChild(win);
}

// ── Add Boat ──────────────────────────────────────────────────────────────

function handleAdd() {
  const addIcon = document.getElementById('add-icon');
  if (addIcon) {
    addIcon.src = 'icons/add1.png';
    setTimeout(() => { addIcon.src = 'icons/add.png'; }, 300);
  }
  openDialogue();
}

function openDialogue() {
  const overlay = document.createElement('div');
  overlay.id = 'overlay';
  overlay.classList.add('overlay');
  overlay.innerHTML = `
    <div class="dialogue">
      <h2>Add a Boat</h2>
      <label>Song Name</label>
      <input type="text" id="input-song" placeholder="Enter song name">
      <label>Starting Location</label>
      <input type="text" id="input-from" placeholder="Enter song origin">
      <label>Destination</label>
      <input type="text" id="input-to" placeholder="Enter your current location">
      <label>Choose a Boat</label>
      <div class="boat-selector">
        <img src="boat/blue_boat.gif"   class="boat-option" data-boat="blue_boat.gif"   title="Blue">
        <img src="boat/green_boat.gif"  class="boat-option" data-boat="green_boat.gif"  title="Green">
        <img src="boat/orange_boat.gif" class="boat-option" data-boat="orange_boat.gif" title="Orange">
        <img src="boat/pink_boat.gif"   class="boat-option" data-boat="pink_boat.gif"   title="Pink">
        <img src="boat/purple_boat.gif" class="boat-option" data-boat="purple_boat.gif" title="Purple">
        <img src="boat/red_boat.gif"    class="boat-option" data-boat="red_boat.gif"    title="Red">
        <img src="boat/white_boat.gif"  class="boat-option" data-boat="white_boat.gif"  title="White">
        <img src="boat/yellow_boat.gif" class="boat-option" data-boat="yellow_boat.gif" title="Yellow">
      </div>
      <p id="boat-error" style="color:salmon;font-size:0.75rem;display:none;">Please select a boat.</p>
      <div class="dialogue-buttons">
        <button onclick="submitBoat()">Submit</button>
        <button onclick="closeDialogue()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.querySelectorAll('.boat-option').forEach(img => {
    img.addEventListener('click', function() {
      document.querySelectorAll('.boat-option').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

function closeDialogue() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.remove();
}

async function submitBoat() {
  const song     = document.getElementById('input-song').value.trim();
  const from     = document.getElementById('input-from').value.trim();
  const to       = document.getElementById('input-to').value.trim();
  const selected = document.querySelector('.boat-option.selected');
  if (!song || !from || !to) { alert('Please fill in all three fields.'); return; }
  if (!selected) { document.getElementById('boat-error').style.display = 'block'; return; }

  const boatFile = selected.getAttribute('data-boat');
  closeDialogue();

  const boatId  = Date.now().toString();
  const newBoat = {
    id:       boatId,
    song,
    from,
    to,
    boatFile,
    x: Math.random() * 600 + 100,
    y: Math.random() * 300 + 100
  };

  try {
    const { error } = await window.sb.from('boats').insert(newBoat);
    if (error) throw error;
    loadLibrary();
  } catch (err) {
    console.error('Error saving boat:', err);
    alert('Could not save boat.');
  }
}
