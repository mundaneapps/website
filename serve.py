#!/usr/bin/env python3
"""
Local dev server that mimics GitHub Pages: it serves clean, extension-less
URLs (e.g. /headsup -> headsup.html) and falls back to 404.html.

Usage:
    python3 serve.py            # http://localhost:8000
    python3 serve.py 3000       # custom port
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        local = super().translate_path(path)
        # If the exact path doesn't exist and has no extension, try adding .html
        if not os.path.exists(local) and not os.path.splitext(local)[1]:
            if os.path.isfile(local + ".html"):
                return local + ".html"
        return local

    def send_error(self, code, message=None, explain=None):
        # Serve the styled 404.html for missing pages
        if code == 404:
            page = os.path.join(ROOT, "404.html")
            if os.path.isfile(page):
                with open(page, "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
        print(f"Serving {ROOT}")
        print(f"  http://localhost:{PORT}  (clean URLs, like GitHub Pages)")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
