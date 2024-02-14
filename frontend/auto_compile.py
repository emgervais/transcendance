#!/usr/bin/python3
import time
import os
from pathlib import Path
from threading import Timer
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import compiler

"""
In this script's directory, the folders containing a "base.html" file will be compiled when their content is updated.
The result will be an html named like the directory.
It will be located in DEST.
The folder hierarchy here is replicated in DEST.
"""

ROOT = Path(__file__).resolve().parent
DEST = os.path.join(ROOT.parent, "static")

def src_dest(root):
    rel_path = os.path.relpath(root, ROOT)
    for dir_name in os.listdir(root):
        dir_path = os.path.join(root, dir_name)
        if not os.path.isdir(dir_path):
            continue
        src = os.path.join(dir_path, "base.html")
        if not os.path.exists(src):
            for src, dest in src_dest(dir_path):
                yield src, dest
            continue
        dest = os.path.join(DEST, rel_path, dir_name + ".html")
        yield src, dest

def save_template(dest, html):
    dirname = os.path.dirname(dest)
    if not os.path.exists(dirname):
        os.makedirs(dirname)                
    with open(dest, 'w', encoding='utf8') as f:
        f.write(html)    

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
            for src, dest in src_dest(ROOT):
                html = compiler.compile(os.path.dirname(src), src)
                print(f"-- Recompiling \"{dest}\" ----")
                save_template(dest, html)
                self._start_timer()

if __name__ == "__main__":
    event_handler = Recompiler()
    event_handler.on_any_event()
    observer = Observer()
    observer.schedule(event_handler, ROOT, recursive=True)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
