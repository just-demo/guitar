from http.server import HTTPServer, BaseHTTPRequestHandler, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote, parse_qs
from pathlib import Path
from os.path import isfile, dirname
import re
import json
import os

def save_selection(artist, song, selected):
    file = 'data/songs.json'
    songs = read_json_file(file)
    if artist not in songs:
        songs[artist] = {}
    if song not in songs[artist] or songs[artist][song] != selected:
        songs[artist][song] = selected
        write_json_file(file, songs)

def delete_song_reference(artist, song):
    file = 'data/songs.json'
    songs = read_json_file(file)
    if artist in songs and song in songs[artist]:
        del songs[artist][song]
        if not any(songs[artist]):
            del songs[artist]
        write_json_file(file, songs)

def parse_url_path(path):
    return re.findall('/data/songs/(.+)/(.+)\.txt', path)[0]

def build_fs_path(artist, song):
    return 'data/songs/{}/{}.txt'.format(artist, song)

def write_file(file, content):
    Path(dirname(file)).mkdir(parents=True, exist_ok=True)
    with open(file, "w+") as f:
        f.write(content)

def delete_file(file):
    os.remove(file)
    dir = dirname(file)
    while not os.listdir(dir):
        os.rmdir(dir)
        dir = dirname(dir)

def read_json_file(file):
    with open(file) as f:
        return json.load(f)

def write_json_file(file, content):
    with open(file, 'w') as f:
        json.dump(content, f, indent=2, ensure_ascii=False)

class MyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        content = self.rfile.read(content_length).decode('utf8')
        url = urlparse(self.path)
        if re.match("^/data/.*\\.json$", url.path):
            write_file(url.path.strip("/"), content)
        else:
            (artist, song) = parse_url_path(unquote(url.path))
            params = parse_qs(url.query)
            file = build_fs_path(artist, song)
            if 'selected' in params:
                save_selection(artist, song, params['selected'][0].lower() == 'true')
            elif not isfile(file):
                save_selection(artist, song, False)
            if content:
                write_file(file, content)
        self.send_response(200)
        self.end_headers()
    def do_DELETE(self):
        url = urlparse(self.path)
        (artist, song) = parse_url_path(unquote(url.path))
        delete_song_reference(artist, song)
        file = build_fs_path(artist, song)
        delete_file(file)
        self.send_response(204)
        self.end_headers()

httpd = HTTPServer(('localhost', 8888), MyHTTPRequestHandler)
print ('Started!')
httpd.serve_forever()
