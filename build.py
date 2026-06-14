#!/usr/bin/env python3
"""
build.py — 頭骨タワーバトル ビルドスクリプト
src/ の各ファイルを index.template.html に注入し、
dist/index.html（配布用単一HTML）を生成する。

使い方:
    python3 build.py
"""

import os, re

SRC_DIR  = os.path.join(os.path.dirname(__file__), 'src')
TEMPLATE = os.path.join(os.path.dirname(__file__), 'index.template.html')
DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')
OUTPUT   = os.path.join(DIST_DIR, 'index.html')

def build():
    with open(TEMPLATE, 'r') as f:
        html = f.read()

    # /* @inject filename */ を src/filename の内容で置換
    def inject(match):
        filename = match.group(1)
        path = os.path.join(SRC_DIR, filename)
        with open(path, 'r') as f:
            return f.read()

    html = re.sub(r'/\* @inject ([\w.]+) \*/', inject, html)

    os.makedirs(DIST_DIR, exist_ok=True)
    with open(OUTPUT, 'w') as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT) // 1024
    print(f"✅ Built: dist/index.html ({size_kb}KB)")

if __name__ == '__main__':
    build()
