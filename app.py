"""Flask entry point for the Kuryentipid dashboard."""

from flask import Flask


# public/ is the single source of the web app. Flask (locally), Vercel and the
# Capacitor Android build all serve the same files from that folder.
app = Flask(__name__, static_folder="public", static_url_path="")


@app.get("/")
def home():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run()
