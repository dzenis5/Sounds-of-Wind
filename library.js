
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
  margin: 0;
  padding: 0; /* was 20px — this was the culprit */
  min-height: 100vh;
  overflow-x: hidden;
  background-color: #0a0a2e;
}

.gif-title {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;           /* stays above background, below UI */
  width: 25%;
  max-width: 300px;
  min-width: 100px;      /* never gets smaller than this */
  height: auto;
  pointer-events: none;
}

.gif-title img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

@media (max-width: 768px) {
  .gif-title {
    width: 40%;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .gif-title {
    width: 50%;
    min-width: 100px;
  }
}

/* Home page */
.home-btn {
  position: fixed;
  top: 20px;         
  right: 50px;
  z-index: 100;
  cursor: pointer;
  width: 150px;
  height: 150px;
}

.home-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Grid */
.library-grid {
  margin-top: 200px;
  padding: 20px;
  color: white;
  display: grid;
  grid-template-columns: repeat(6, 1fr);   /* always 6 per row */
  gap: 24px;
  align-items: start;
}

.boat-panel-inline {
  grid-column: 1 / -1;    /* spans all columns */
  background: #1a2a4a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-family: sans-serif;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  max-height: 80vh;
  overflow-y: auto;
}

.loading-text {
  color: white;
  opacity: 0.6;
  font-size: 0.9rem;
}

/* Boat card */
.boat-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.boat-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
}

.boat-card-song {
  font-size: 0.85rem;
  font-weight: bold;
  text-shadow: 0 1px 4px rgba(0,0,0,0.8);
}

.boat-card-gif {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

.boat-card-route {
  font-size: 0.65rem;
  opacity: 0.8;
}

/* Boat detail panel */
/* Boat Window */
.boat-window {
  position: fixed;
  z-index: 300;
  background: #1a2a4a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  width: 320px;
  color: white;
  font-family: sans-serif;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  max-height: 80vh;        /* never taller than 80% of screen height */
  overflow-y: auto;        /* scrolls inside the window when content overflows */
}

.boat-window-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.boat-window-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boat-window-info .song-title {
  font-size: 1.2rem;
  font-weight: bold;
}

.boat-window-info .song-route {
  font-size: 0.9rem;
  opacity: 0.7;
}

.boat-window-icons {
  display: flex;
  align-items: center;      /* vertical alignment: center, flex-start (top), flex-end (bottom) */
  justify-content: flex-end; /* horizontal: flex-start (left), center, flex-end (right) */
  gap: 12px;                /* space between icons */
  padding-top: 4px;         /* nudge down from the top */
}

.boat-window-icons img {
  width: 35px;
  height: 35px;
  object-fit: contain;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}

/* Play button */
.boat-window-icons img[title="Play"],
.boat-window-icons img[title="Pause"] {
  width: 60px;
  height: 60px;
}

/* Choir / Solo */
.boat-window-icons img[title="Choir"],
.boat-window-icons img[title="Solo"] {
  width: 60px;
  height: 60px;
}

/* Close */
.boat-window-icons img[title="Close"] {
  width: 28px;
  height: 28px;
}

.boat-window-icons img:hover {
  opacity: 1;
}

.boat-window-hint {
  font-style: italic;
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 8px;
}

.waveform-canvas {
  width: 100%;
  height: 60px;
  margin-top: 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
}

.boat-window-audio {
  width: 100%;
  margin-top: 8px;
  border-radius: 6px;
}

.boat-window-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: auto;    /* pushes it down as far as possible */
  padding-top: 16px;
}

.boat-window-footer img {
  object-fit: contain;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.boat-window-footer img:hover {
  opacity: 1;
}

.record-btn {
  width: 100px;
  height: 100px;
}

.accept-discard-btn {
  width: 55px;
  height: 55px;
}

.saved-audio {
  width: 100%;
  margin-top: 8px;
  border-radius: 6px;
}

.boat-window-icons img[title="Choir"],
.boat-window-icons img[title="Solo"] {
  width: 55px;
  height: 55px;
}

.boat-window-icons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.waveform-canvas {
  width: 100%;
  height: 60px;
  margin-top: 8px;
  border-radius: 6px;
  background: rgba(255,255,255,0.05);
}

.saved-audio {
  width: 500px;
  height: 36px;              /* controls the height */
  margin-top: 8px;
  border-radius: 20px;       /* rounded pill shape */
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  display: block;
  outline: none;
}

.boat-window-audio {
  width: 100%;
  height: 36px;
  margin-top: 8px;
  border-radius: 20px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  display: block;
  outline: none;
}

.song-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.song-title-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-title-icons img[title="Play"],
.song-title-icons img[title="Pause"] {
  width: 45px;
  height: 45px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.song-title-icons img[title="Choir"],
.song-title-icons img[title="Solo"] {
  width: 45px;
  height: 45px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.song-title-icons img:hover {
  opacity: 1;
}

/* Two column panel layout */
.panel-layout {
  display: flex;
  flex-direction: row-reverse;   /* puts comment box on the right */
  gap: 20px;
  align-items: flex-start;
}

.comment-section {
  width: 280px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: stretch;   /* stretches to match the right panel height */
  max-height: 400px;
}

.comment-title {
  font-size: 0.9rem;
  font-weight: bold;
  opacity: 0.9;
  margin-bottom: 4px;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 250px;
}

.comment-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-author {
  font-size: 0.75rem;
  font-weight: bold;
  opacity: 0.9;
}

.comment-text {
  font-size: 0.8rem;
  opacity: 0.75;
  line-height: 1.4;
}

.comment-input-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comment-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.82rem;
  outline: none;
  font-family: sans-serif;
}

.comment-input::placeholder {
  opacity: 0.4;
}

.comment-submit {
  padding: 7px;
  background: white;
  color: #1a2a4a;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
  transition: opacity 0.2s;
}

.comment-submit:hover {
  opacity: 0.85;
}

.audio-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.audio-row .saved-audio {
  flex: 1;
  margin-top: 0;
}

.delete-audio-btn {
  display: none;
  width: 20px;
  height: 20px;
  background: rgba(200, 50, 50, 0.9);
  color: white;
  border-radius: 50%;
  font-size: 0.6rem;
  text-align: center;
  line-height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.comment-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-comment-btn {
  display: none;
  width: 18px;
  height: 18px;
  background: rgba(200, 50, 50, 0.9);
  color: white;
  border-radius: 50%;
  font-size: 0.6rem;
  text-align: center;
  line-height: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.moderator-mode .delete-audio-btn,
.moderator-mode .delete-comment-btn {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

/* Show delete buttons only in moderator mode */
.moderator-mode .delete-audio-btn,
.moderator-mode .delete-comment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;  /* pushes footer to bottom */
}
.boat-panel-inline {
  position: relative;   /* needed for absolute close button */
}

.panel-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
  z-index: 10;
}

.panel-close-btn:hover {
  opacity: 1;
}

.info-btn {
  position: fixed;
  bottom: 150px;          /* sits above the add button */
  right: 50px;           /* 50px from the right */
  z-index: 100;
  cursor: pointer;
  width: 150px;
  height: 150px;
}

.info-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.add-btn {
  position: fixed;
  bottom: 20px;
  right: 50px;
  z-index: 100;
  cursor: pointer;
  width: 150px;
  height: 150px;
}

.add-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.info-window {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 300;
  background: #1a2a4a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  width: 340px;
  color: white;
  font-family: sans-serif;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  max-height: 80vh;
  overflow-y: auto;
}

.info-window-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.info-window-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.info-window-header img {
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
}

.info-window-header img:hover {
  opacity: 1;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialogue {
  background: #1a2a4a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
  color: white;
  font-family: sans-serif;
}

.dialogue h2 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
  text-align: center;
}

.dialogue label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.dialogue input {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.95rem;
  outline: none;
}

.dialogue input::placeholder {
  opacity: 0.4;
}

.dialogue-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.dialogue-buttons button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
}

.dialogue-buttons button:first-child {
  background: white;
  color: #1a2a4a;
  font-weight: bold;
}

.dialogue-buttons button:last-child {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.boat-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 4px;
}

.boat-option {
  width: 50px;
  height: 50px;
  object-fit: contain;
  cursor: pointer;
  border-radius: 8px;
  border: 2px solid transparent;
  padding: 3px;
  transition: border-color 0.2s;
}

.boat-option:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.boat-option.selected {
  border-color: white;
  background: rgba(255, 255, 255, 0.15);
}



@media (max-width: 768px) {

  .library-grid {
    grid-template-columns: repeat(2, 1fr);
    margin-top: 80px;   /* was 120px — title gif is smaller on mobile */
    padding: 10px;
    gap: 12px;
  }

  /* All fixed buttons: pull them closer to screen edge */
  .home-btn {
    top: 8px;
    right: 8px;        /* was 10px — fine, but be consistent */
    width: 55px;
    height: 55px;
  }

  .info-btn {
    bottom: 80px;
    right: 8px;
    width: 55px;
    height: 55px;
  }

  .add-btn {
    bottom: 12px;
    right: 8px;
    width: 55px;
    height: 55px;
  }

  /* Stack comment and recordings vertically */
  .panel-layout {
    flex-direction: column;
  }

  .comment-section {
    width: 100%;
    max-height: 200px;
  }
}
