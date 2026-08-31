#!/usr/bin/env python3
"""
Deploy script for reisengenhariars.com.br (Hostinger FTP).

Uploads ONLY the static site files (see ALLOWED_TOP_LEVEL below) to public_html,
skipping files that haven't changed (based on local size vs remote size).

This folder also contains other, unrelated projects (e.g. crm-backend) that must
NEVER be published — that's why this script uses an explicit allowlist instead of
walking the whole directory. Do not broaden ALLOWED_TOP_LEVEL without checking
what's actually inside the new folder first.

Credentials are read from a JSON file kept OUTSIDE this Drive-synced folder:
  C:\\Users\\<user>\\.reis-site-deploy\\ftp_credentials.json
so the FTP password never lives inside the Google Drive folder.

Usage:
  python deploy.py
"""
import ftplib
import hashlib
import json
import os
import re
import sys

SITE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDS_PATH = os.path.expanduser("~/.reis-site-deploy/ftp_credentials.json")

# ALLOWLIST: only these top-level files/folders are ever published.
# This project folder also contains other things (crm-backend app, .git, etc.)
# that must NEVER be uploaded to the public site — so we opt-in explicitly
# instead of trying to exclude everything dangerous by name.
ALLOWED_TOP_LEVEL = {
    "index.html",
    "politica-de-privacidade.html",
    ".htaccess",
    "css",
    "js",
    "assets",
}

# Safety net: never upload these regardless of where they appear
EXCLUDE_NAMES = {".git", ".gitignore", "deploy.py", "__pycache__", ".DS_Store", "Thumbs.db", ".env", "node_modules"}


def file_hash(path, length=10):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:length]


def bump_cache_busters():
    """Rewrite css/style.css?v=... and js/script.js?v=... in index.html to a
    hash of each file's current content, so browsers always fetch fresh CSS/JS
    after a deploy — no need to remember to bump a version number by hand."""
    index_path = os.path.join(SITE_DIR, "index.html")
    css_path = os.path.join(SITE_DIR, "css", "style.css")
    js_path = os.path.join(SITE_DIR, "js", "script.js")

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    css_hash = file_hash(css_path)
    js_hash = file_hash(js_path)

    new_html = re.sub(r'(css/style\.css)(\?v=[^"]*)?', rf'\1?v={css_hash}', html)
    new_html = re.sub(r'(js/script\.js)(\?v=[^"]*)?', rf'\1?v={js_hash}', new_html)

    if new_html != html:
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        print(f"Cache-busters atualizados: style.css?v={css_hash} | script.js?v={js_hash}")


def load_credentials():
    if not os.path.exists(CREDS_PATH):
        sys.exit(f"Credenciais não encontradas em {CREDS_PATH}")
    with open(CREDS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def ensure_remote_dir(ftp, remote_dir):
    parts = remote_dir.strip("/").split("/")
    path = ""
    for part in parts:
        if not part:
            continue
        path += "/" + part
        try:
            ftp.mkd(path)
        except ftplib.error_perm:
            pass  # already exists


def upload_file(ftp, local_path, remote_path):
    # Always upload — comparing by size alone is unreliable (two different
    # file versions can coincidentally be the same size), and this site is
    # small enough that re-uploading everything every time is cheap and safe.
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)
    return "upload"


def main():
    bump_cache_busters()
    creds = load_credentials()
    print(f"Conectando em {creds['host']}:{creds['port']}...")
    ftp = ftplib.FTP()
    ftp.connect(creds["host"], creds["port"], timeout=30)
    ftp.login(creds["user"], creds["password"])
    ftp.set_pasv(True)
    print("Conectado. Enviando arquivos...")

    remote_root = "/" + creds.get("remote_root", "public_html").strip("/")

    uploaded = 0
    skipped = 0
    created_dirs = set()

    # Build the list of local paths to publish, strictly from the allowlist.
    top_level_targets = []
    for name in sorted(ALLOWED_TOP_LEVEL):
        p = os.path.join(SITE_DIR, name)
        if os.path.exists(p):
            top_level_targets.append(p)
        else:
            print(f"  (aviso: {name} não existe localmente, pulando)")

    for target in top_level_targets:
        if os.path.isfile(target):
            files_iter = [(os.path.dirname(target), [], [os.path.basename(target)])]
        else:
            files_iter = os.walk(target)

        for root, dirs, files in files_iter:
            dirs[:] = [d for d in dirs if d not in EXCLUDE_NAMES]
            rel_dir = os.path.relpath(root, SITE_DIR)
            rel_dir = "" if rel_dir == "." else rel_dir.replace(os.sep, "/")
            remote_dir = f"{remote_root}/{rel_dir}".rstrip("/")

            if remote_dir not in created_dirs:
                ensure_remote_dir(ftp, remote_dir)
                created_dirs.add(remote_dir)

            for fname in files:
                if fname in EXCLUDE_NAMES:
                    continue
                local_path = os.path.join(root, fname)
                remote_path = f"{remote_dir}/{fname}"
                result = upload_file(ftp, local_path, remote_path)
                rel_display = os.path.relpath(local_path, SITE_DIR)
                if result == "upload":
                    uploaded += 1
                    print(f"  [enviado] {rel_display}")
                else:
                    skipped += 1

    ftp.quit()
    print(f"\nConcluído: {uploaded} arquivo(s) enviado(s), {skipped} sem alteração.")


if __name__ == "__main__":
    main()
