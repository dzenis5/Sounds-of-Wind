 function openHome() {
  window.location.href = 'index.html';
}

console.log('library.js loaded');
const allBoats = [];

async function loadLibrary() {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';
  allBoats.length = 0;

  if (!window.db || !window.fsGetDocs) {
    console.error('Firebase not ready');
    grid.innerHTML = '<p class="loading-text">Could not connect to database.</p>';
    return;
  }

  try {
    const snapshot = await window.fsGetDocs(window.fsCollection(window.db, 'boats'));

    if (snapshot.empty) {
      grid.innerHTML = '<p class="loading-text">No boats yet.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const boat = docSnap.data();
      boat.audios = Object.values(boat.audios || {});
      allBoats.push(boat);

      const card = document.createElement('div');
      card.classList.add('boat-card');
      card.innerHTML = `
        <div class="boat-card-song">${boat.song}</div>
        <img class="boat-card-gif" src="boat/${boat.boatFile}" alt="${boat.song}">
        <div class="boat-card-route">From ${boat.from} to ${boat.to}</div>
      `;

      card.addEventListener('click', function() {
        openBoatPanel(boat, this);
      });
      grid.appendChild(card);  
    });

  } catch(err) {
    console.error('Error loading library:', err);
    grid.innerHTML = '<p class="loading-text">Error loading boats.</p>';
  }
}

// Wait for Firebase then load
if (window.firebaseReady) {
  loadLibrary();
} else {
  window.addEventListener('firebaseReady', () => loadLibrary());
}

function openBoatPanel(boat, cardEl) {
  const existing = document.getElementById('boat-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'boat-panel';
  panel.classList.add('boat-panel-inline');
  panel.dataset.boatId    = boat.id;
  panel.dataset.choirMode = 'false';

  panel.innerHTML = `

  <!-- Close button pinned to top right of whole panel -->
  <img src="icons/discard.png" class="panel-close-btn" title="Close" onclick="document.getElementById('boat-panel').remove()">

  <div class="panel-layout">

    <!-- Right: comment section -->
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

    <!-- Left: recordings and controls -->
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
          <div id="saved-audio-container">
            ${boat.audios.length === 0
              ? '<p style="opacity:0.6; font-size:0.85rem; margin-top:8px;">No recordings yet.</p>'
              : boat.audios.map(src => `<audio controls src="${src}" class="saved-audio"></audio>`).join('')
            }
          </div>
        </div>
      </div>
      <canvas class="waveform-canvas" id="waveform-canvas" style="display:none;"></canvas>
      <div class="boat-window-footer" id="boat-footer">
        <img src="icons/record.png" class="record-btn" title="Record" onclick="startRecording()">
      </div>
    </div>

  </div>
`;

  // Find which row the clicked card is in and insert after the last card in that row
  const grid     = document.getElementById('library-grid');
  const cards    = Array.from(grid.querySelectorAll('.boat-card'));
  const clickedY = cardEl.getBoundingClientRect().top;

  // Find the last card in the same row (same top position)
  let lastInRow  = cardEl;
  cards.forEach(card => {
    if (Math.abs(card.getBoundingClientRect().top - clickedY) < 5) {
      lastInRow = card;
    }
  });

  lastInRow.insertAdjacentElement('afterend', panel);
  loadComments(boat.id);
}

let mediaRecorder = null;
let audioChunks   = [];
let waveformAnim  = null;
let analyser      = null;
let audioCtx      = null;
let playAllActive = false;

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const panel   = document.getElementById('boat-panel');
    const isChoir = panel && panel.dataset.choirMode === 'true';
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

    audioChunks   = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = function() {
      stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(waveformAnim);
      audioCtx.close();

      document.querySelectorAll('#saved-audio-container audio').forEach(a => {
        a.pause(); a.currentTime = 0;
      });

      const blob = new Blob(audioChunks, { type: 'audio/webm' });
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

    mediaRecorder.start();
  }).catch(function() {
    alert('Microphone access was denied.');
  });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

function acceptRecording(url) {
  document.getElementById('accept-discard-row')?.remove();
  document.getElementById('boat-footer').innerHTML = `
    <img src="icons/record.png" class="record-btn" title="Record" onclick="startRecording()">
  `;
  document.getElementById('record-hint').style.display = 'block';

  fetch(url).then(r => r.blob()).then(blob => {
    const reader = new FileReader();
    reader.onloadend = async function() {
      const base64 = reader.result;
      const container = document.getElementById('saved-audio-container');

      // Remove "no recordings" text if present
      const empty = container.querySelector('p');
      if (empty) empty.remove();

      const a = document.createElement('audio');
      a.controls = true;
      a.src = base64;
      a.style.cssText = 'width:100%; margin-top:8px;';
      container.appendChild(a);

      // Save to Firestore
      const panel  = document.getElementById('boat-panel');
      const boatId = panel?.dataset.boatId;
      if (boatId) {
        const boat = allBoats.find(b => b.id === boatId);
        if (boat) {
          boat.audios.push(base64);
          const data = { ...boat, audios: Object.fromEntries(boat.audios.map((a, i) => [i, a])) };
          try {
            await window.fsSetDoc(window.fsDoc(window.db, 'boats', boatId), data);
          } catch(err) {
            console.error('Save error:', err);
          }
        }
      }
    };
    reader.readAsDataURL(blob);
  });
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

function toggleChoir() {
  const panel = document.getElementById('boat-panel');
  if (!panel) return;
  const isChoir = panel.dataset.choirMode === 'true';
  panel.dataset.choirMode = isChoir ? 'false' : 'true';
  const btn = document.getElementById('choir-btn');
  btn.src   = isChoir ? 'icons/solo.png'  : 'icons/choir.png';
  btn.title = isChoir ? 'Solo'            : 'Choir';
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

async function loadComments(boatId) {
  const list = document.getElementById(`comment-list-${boatId}`);
  if (!list) return;

  try {
    const snapshot = await window.fsGetDocs(
      window.fsCollection(window.db, 'boats', boatId, 'comments')
    );

    if (snapshot.empty) {
      list.innerHTML = '<p style="opacity:0.5; font-size:0.8rem;">No comments yet.</p>';
      return;
    }

    list.innerHTML = '';
    snapshot.forEach(doc => {
      const c = doc.data();
      const item = document.createElement('div');
      item.classList.add('comment-item');
      item.innerHTML = `
        <span class="comment-author">${c.name}</span>
        <span class="comment-text">${c.text}</span>
      `;
      list.appendChild(item);
    });
  } catch(err) {
    console.error('Error loading comments:', err);
  }
}

async function submitComment(boatId) {
  const nameEl = document.getElementById('comment-name');
  const textEl = document.getElementById('comment-text');

  const name = nameEl.value.trim();
  const text = textEl.value.trim();

  if (!name || !text) { alert('Please enter your name and a comment.'); return; }

  try {
    const commentId = Date.now().toString();
    await window.fsSetDoc(
      window.fsDoc(window.db, 'boats', boatId, 'comments', commentId),
      { name, text, timestamp: commentId }
    );

    nameEl.value = '';
    textEl.value = '';
    loadComments(boatId);
  } catch(err) {
    console.error('Error posting comment:', err);
    alert('Could not post comment.');
  }
}

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

function handleAdd() {
  const addIcon = document.getElementById('add-icon');
  addIcon.src = 'icons/add.png';
  setTimeout(function() { addIcon.src = 'icons/add.png'; }, 300);
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
      <input type="text" id="input-from" placeholder="Enter starting location">
      <label>Destination</label>
      <input type="text" id="input-to" placeholder="Enter destination">
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

  // Save directly to Firestore with a random position for index page
  const boatId = Date.now().toString();
  const newBoat = {
    id:       boatId,
    song,
    from,
    to,
    boatFile,
    x:        Math.random() * 600 + 100,   // random position for index page
    y:        Math.random() * 300 + 100,
    audios:   {}
  };

  try {
    await window.fsSetDoc(window.fsDoc(window.db, 'boats', boatId), newBoat);
    // Reload library to show the new boat
    loadLibrary();
  } catch(err) {
    console.error('Error saving boat:', err);
    alert('Could not save boat.');
  }
}

// Retry loading images that failed
document.addEventListener('DOMContentLoaded', function() {
  retryBrokenImages();
});

function retryBrokenImages() {
  document.querySelectorAll('img').forEach(img => {
    if (!img.complete || img.naturalWidth === 0) {
      const src = img.src;
      img.src = '';
      img.src = src;
    }
  });
}