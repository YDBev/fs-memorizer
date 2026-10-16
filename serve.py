#!/usr/bin/env python3
import http.server
import socket
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError, OSError):
            pass

    # Disable noisy logging for individual image assets
    def log_message(self, format, *args):
        if len(args) > 0 and isinstance(args[0], str) and '/assets/images/' in args[0]:
            return
        super().log_message(format, *args)

def run():
    os.chdir(DIRECTORY)
    local_ip = get_local_ip()
    
    server_address = ('0.0.0.0', PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, CustomHandler)
    
    url_local = f"http://localhost:{PORT}"
    url_iphone = f"http://{local_ip}:{PORT}"
    
    print("\n" + "="*60)
    print(" 🪂 USPA FORMATION SKYDIVING MEMORIZER (WEB & IPHONE)")
    print("="*60)
    print(f" 💻 On this Mac:     {url_local}")
    print(f" 📱 On your iPhone:   {url_iphone}")
    print("="*60)
    print(" [iPhone Instructions]")
    print(f" 1. Connect your iPhone to the same Wi-Fi network.")
    print(f" 2. Open Safari and browse to: {url_iphone}")
    print("    (Or scan the QR code displayed in the web app)")
    print(" 3. Tap the Share button [↑] at the bottom.")
    print(" 4. Tap 'Add to Home Screen' -> Tap 'Add'.")
    print(" 5. Open 'FS Memorizer' from your Home Screen for full offline app!")
    print("="*60)
    print(" Press Ctrl+C to stop the server.\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    run()
