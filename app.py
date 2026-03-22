import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from collections import Counter
import re
import asyncio
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path
import json

LOG_FILE = Path("mock_contest_log.txt")  # change to your live path

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = set()
scores = Counter()

# --- regex: station_callsign
STATION_RE = re.compile(r"<station_callsign:\d+>\s*([A-Z0-9/]+)", re.IGNORECASE)


# Serve basic HTML UI
@app.get("/")
async def root():
    with open("templates/index.html") as f:
        return HTMLResponse(f.read())


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)
    try:
        await websocket.send_text(json.dumps(scores.most_common()))
        while True:
            await asyncio.sleep(1)
    except Exception:
        pass
    finally:
        clients.remove(websocket)


async def broadcast_scores():
    data = json.dumps(scores.most_common())
    for ws in tuple(clients):
        try:
            await ws.send_text(data)
        except Exception:
            clients.remove(ws)


# --- process new data chunk ---
def process_text_chunk(text: str):
    """Extract all stations from block and update scores"""
    # Extract only ADIF-like lines
    adif_lines = [
        line for line in text.splitlines()
        if line.strip().startswith("<") or "<eor>" in line.lower()
    ]
    joined = "\n".join(adif_lines).upper()
    matches = STATION_RE.findall(joined)
    if matches:
        for m in matches:
            scores[m] += 1


# --- one-time file ingest on startup ---
def load_existing_log():
    """Load all historical data from file."""
    if not LOG_FILE.exists():
        print(f"⚠️  Log file not found: {LOG_FILE}")
        return
    try:
        with open(LOG_FILE, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        process_text_chunk(content)
        print(f"✅ Loaded {sum(scores.values())} total QSOs from log.")
    except Exception as e:
        print(f"Error loading log: {e}")


# --- event handler for future changes ---
class LogUpdateHandler(FileSystemEventHandler):
    def __init__(self, loop):
        self.loop = loop

    def on_modified(self, event):
        if event.is_directory or not LOG_FILE.samefile(event.src_path):
            return
        try:
            with open(LOG_FILE, "rb") as f:
                lines = f.readlines()[-100:]
            chunk = b"".join(lines).decode(errors="ignore")
        except Exception:
            return

        process_text_chunk(chunk)
        asyncio.run_coroutine_threadsafe(broadcast_scores(), self.loop)


# --- LIFECYCLE: startup ---
@app.on_event("startup")
async def startup_event():
    load_existing_log()  # read all existing QSOs once
    loop = asyncio.get_running_loop()
    observer = Observer()
    observer.schedule(LogUpdateHandler(loop), ".", recursive=False)
    observer.start()
    print("📡 Scoreboard watcher started.")