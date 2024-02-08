#!/usr/bin/python3
from threading import Timer
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEvent, FileSystemEventHandler, LoggingEventHandler
import compile

TEMPLATES_ROOT = "templates/"
BASE = "base.html"
OUTPUT = "index.html"

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

    def on_any_event(self, event: FileSystemEvent) -> None:
        if self.timer is None or not self.timer.is_alive():
            html = compile.compile(TEMPLATES_ROOT, BASE)
            print(f"-- Recompiling \"{OUTPUT}\" ----")
            with open(OUTPUT, 'w', encoding='utf8') as f:
                f.write(html)
            self._start_timer()

if __name__ == "__main__":
    event_handler = Recompiler()
    observer = Observer()
    observer.schedule(event_handler, TEMPLATES_ROOT, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()