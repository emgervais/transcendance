#!/usr/bin/python3
import time
import os
from pathlib import Path
from threading import Timer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import compiler


TEMPLATES_ROOT = os.path.join(Path(__file__).resolve().parent, "templates")
parent_dir = Path(__file__).resolve().parent.parent

SRC_DEST = [
    ("base.html", os.path.join(parent_dir, "static", "index.html")),
]

class Recompiler(FileSystemEventHandler):
    COOLDOWN = 1
    def __init__(self):
        super().__init__()
        self.timer = None    

    def _start_timer(self):
        self.timer = Timer(self.COOLDOWN, self._reset_timer)
        self.timer.start()

    def _reset_timer(self):
        self.timer = None

    def on_any_event(self, event=None) -> None:
        if self.timer is None or not self.timer.is_alive():
            for base, output in SRC_DEST:
                html = compiler.compile(TEMPLATES_ROOT, base)
                print(f"-- Recompiling \"{output}\" ----")
                with open(output, 'w', encoding='utf8') as f:
                    f.write(html)
                self._start_timer()

if __name__ == "__main__":
    event_handler = Recompiler()
    event_handler.on_any_event()
    observer = Observer()
    observer.schedule(event_handler, TEMPLATES_ROOT, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
