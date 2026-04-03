import threading
import sys
import time
import traceback

def load_models():
    print("Importing...")
    import app.models.user
    print("Done importing")

t = threading.Thread(target=load_models)
t.start()
time.sleep(2)
if t.is_alive():
    print("Thread is still alive after 2 seconds! Dumping stack trace:")
    for thread_id, frame in sys._current_frames().items():
        if thread_id == t.ident:
            traceback.print_stack(frame)
            sys.exit(1)
print("Finished normally.")
