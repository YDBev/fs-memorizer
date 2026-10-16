# 🪂 USPA Formation Skydiving Memorizer & Anki Decks

A complete memorization platform and native Anki deck collection built from the official USPA Skydiver's Competition Manual (SCM August 2026 Edition).

Covers all competition formation disciplines:
- **Indoor 2-Way VFS** (USIS CaRMa / AXIS Flight School): 44 cards (Belly/Back, Head-Up, Head-Down, Half-Eagle, Half-Cradle & INTER rules)
- **FS 4-Way**: 22 Blocks + 16 Randoms (A–Q)
- **FS 8-Way**: 22 Blocks + 16 Randoms (A–Q)
- **FS 10-Way**: 12 Formations
- **FS 16-Way**: 12 Blocks + 9 Randoms (A–J)
- **VFS 4-Way** (Vertical Formation Skydiving): 22 Blocks + 16 Randoms
- **MFS 2-Way** (Mixed Formation Skydiving): 22 Blocks + 16 Randoms
- **Rules & Symbols**: Body Scoring Zones (Front/Rear), Sub-Group Turn Degrees, Clarification Symbols, Camera Dart Angles

---

## 🚀 Quick Start (Interactive Memorization Website)

You can launch the web application in two ways:

### Option 1: Direct File Launch (No server needed)
Simply open `index.html` in your browser (double-click in Finder or open with Safari / Chrome):
```bash
open index.html
```

### Option 2: Local Web Server
Run the included python launcher:
```bash
python3 serve.py
```
This automatically opens [http://localhost:8080](http://localhost:8080) in your default browser.

---

## 🎯 Website Features & Modes

1. **🗂️ Flashcards (Spaced Practice)**:
   - 3D card flip with high-res formation diagrams
   - **3 Test Modes**:
     - *Diagram ➔ Name/Code* (Visual Recognition)
     - *Name/Code ➔ Diagram* (Mental Dirt-Dive Recall)
     - *Inter Rotations Only* (Sub-group turns & degrees for blocks)
   - **Confidence Ratings (Leitner System)**: Again (1), Hard (2), Good (3), Easy (4)
   - **Keyboard Shortcuts**:
     - `Space` / `Enter`: Flip card
     - `1` / `←`: Rate Again
     - `2` / `↓`: Rate Hard
     - `3` / `↑`: Rate Good
     - `4` / `→`: Rate Easy

2. **⚡ Speed Quiz**:
   - Rapid-fire 4-option multiple-choice drill to build instant sub-second recognition.
   - Smart distractors sampled from the same discipline.
   - Instant green/red visual and audio feedback, streak multiplier, and final accuracy score.
   - Keyboard shortcuts: `1`, `2`, `3`, `4` to pick option, `Enter` to continue.

3. **🎯 Competition Draw Generator & Dirt Dive**:
   - Generates official competition rounds (e.g. 5–6 points mixing blocks and randoms).
   - Displays draw cards in sequence on an authentic competition board.
   - **"Walk Dirt Dive" mode**: Step through the sequence point-by-point with `Space` or arrow keys to rehearse the dive in your mind before jumping.

4. **⌨️ Type-In Recall Drill**:
   - Active recall practice: look at the masked formation diagram and type the name or code.
   - Lenient typo-tolerant parser matches codes and names.

5. **📖 Pool Explorer**:
   - Complete visual catalog with instant search by code, name, or rotation.
   - Filter by blocks or randoms.
   - **"Mask Labels" toggle**: Self-test mode hides all names and numbers directly on the grid so you can test your knowledge across the entire pool at once!
   - Click any card for a high-res inspection modal.

6. **🎵 Synthesized Audio Feedback & Dark/Light Themes**:
   - Native Web Audio API tones (swoosh, success chime, buzz, step clicks) with zero external audio assets.
   - Toggle dark/light mode with state saved to `localStorage`.

---

## 📦 Anki Decks (.apkg)

Pre-built native `.apkg` packages with high-resolution extracted formation diagrams and custom dark/light cards are located in the `anki_decks/` directory:

| Deck File | Disciplines / Content | Card Count | Embedded Images |
| :--- | :--- | :--- | :--- |
| **`USPA_Formation_Skydiving_Complete.apkg`** | **All Disciplines (Recommended Master)** | **233 cards** | **460 images** |
| `USPA_Indoor_2Way_VFS.apkg` | Indoor 2-Way VFS (BB, HU, HD, Blocks & Rules) | 44 cards | 86 images |
| `USPA_FS_4Way.apkg` | FS 4-Way (Blocks 1–22, Randoms A–Q) | 38 cards | 76 images |
| `USPA_FS_8Way.apkg` | FS 8-Way (Blocks 1–22, Randoms A–Q) | 38 cards | 76 images |
| `USPA_FS_10Way.apkg` | FS 10-Way Formations 1–12 | 12 cards | 24 images |
| `USPA_FS_16Way.apkg` | FS 16-Way (Blocks 1–12, Randoms A–J) | 21 cards | 42 images |
| `USPA_VFS_4Way.apkg` | VFS 4-Way (Blocks 1–22, Randoms A–Q) | 38 cards | 152 images |
| `USPA_MFS_2Way.apkg` | MFS 2-Way (Blocks 1–22, Randoms A–Q) | 38 cards | 76 images |
| `USPA_Rules_and_Symbols.apkg` | Scoring Zones, Turn Symbols, Darts | 4 cards | 4 images |

### How to Import:
- **Anki Desktop**: Simply double-click any `.apkg` file.
- **AnkiMobile (iOS)**: AirDrop the `.apkg` or download in Safari and choose *Open in AnkiMobile*.
- **AnkiDroid (Android)**: Tap 3 dots ➔ *Import* ➔ select the downloaded `.apkg`.

---

## 📂 Project Directory Structure

```
fs_memorizer/
├── index.html                   # Main web app layout
├── serve.py                     # Python server & auto-browser opener
├── extract_and_build.py         # Image extraction & JSON dataset script
├── build_anki_decks.py          # Genanki deck generator script
├── README.md                    # Documentation
├── anki_decks/                  # Generated .apkg files
│   ├── USPA_Formation_Skydiving_Complete.apkg
│   ├── USPA_FS_4Way.apkg
│   ├── USPA_FS_8Way.apkg
│   ├── USPA_FS_10Way.apkg
│   ├── USPA_FS_16Way.apkg
│   ├── USPA_VFS_4Way.apkg
│   ├── USPA_MFS_2Way.apkg
│   └── USPA_Rules_and_Symbols.apkg
└── assets/
    ├── css/
    │   └── styles.css           # Modern aerospace UI styling
    ├── js/
    │   └── app.js               # Flashcards, quiz, draw generator & audio logic
    ├── data/
    │   ├── formations.json      # Structured dataset of all 189 formations
    │   └── formations_data.js   # Client-side bundle for offline file:// loading
    └── images/                  # 378 high-res cropped formation diagrams (full & masked)
```
