---
title: 決まった大きさのかたまりで、ファイルの中身を流し込む
description: shutil.copyfileobj は、読み込み元と書き込み先のファイルのようなオブジェクトの間で、データを一定の大きさずつコピーする。ファイル全体をメモリに読み込まず、ウォルラス演算子で「空になるまで」のループを書いている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/shutil.py
lines: [254, 262]
function: copyfileobj
difficulty: 2
format: 2
tags: [入出力, ファイル, 標準ライブラリ]
---

## ひとことで

`copyfileobj(fsrc, fdst, length=0)` は、**読み込み元 `fsrc` の中身を、書き込み先 `fdst` へ流し込む** 関数です。
ファイル全体を 1 回で読み込むのではなく、一定の大きさずつ読んで書きます。大きなファイルをコピーしても、メモリが足りなくなりにくい書き方です。

## コード

::: code-group

```python:line-numbers=254 [日本語訳]
def copyfileobj(fsrc, fdst, length=0):
    """ファイルのようなオブジェクト fsrc から、ファイルのようなオブジェクト fdst へデータをコピーする"""
    if not length:
        length = COPY_BUFSIZE
    # Localize variable access to minimize overhead.
    fsrc_read = fsrc.read
    fdst_write = fdst.write
    while buf := fsrc_read(length):
        fdst_write(buf)
```

```python:line-numbers=254 [原文]
def copyfileobj(fsrc, fdst, length=0):
    """copy data from file-like object fsrc to file-like object fdst"""
    if not length:
        length = COPY_BUFSIZE
    # Localize variable access to minimize overhead.
    fsrc_read = fsrc.read
    fdst_write = fdst.write
    while buf := fsrc_read(length):
        fdst_write(buf)
```

:::

`COPY_BUFSIZE` は、1 回に読み書きする大きさ（バイト数）の既定値です。

## 前提知識

- **ファイルのようなオブジェクト**: `read` と `write` のメソッドを持つもの全般です。ファイル、ネットワークの接続、メモリ上のバッファなどが含まれます。
- **バッファ**: まとめて読み書きする、一時的なデータの入れ物です。大きさを決めて読むと、1 回の処理量が一定になります。
- **ウォルラス演算子 `:=`**: 値を変数に代入しながら、その値を式の中で使える書き方です。
- **空のバイト列**: これ以上データがないことを表します。`read` が空を返すと、読み終わりです。

## 何をしているか

### 1. 大きさを決める

```python:line-numbers=256
    if not length:
        length = COPY_BUFSIZE
```

`length` が 0 なら、既定の大きさ `COPY_BUFSIZE` を使います。

### 2. メソッドを先に取り出す

```python:line-numbers=258
    # Localize variable access to minimize overhead.
    fsrc_read = fsrc.read
    fdst_write = fdst.write
```

`fsrc.read` と `fdst.write` を、変数に取り出しておきます。ループの中で属性を探す手間を省きます。コメントにあるとおり、これは速さのための工夫です。

### 3. 空になるまで読んで、書く

```python:line-numbers=261
    while buf := fsrc_read(length):
        fdst_write(buf)
```

`buf := fsrc_read(length)` で読み、結果が空でなければ書きます。空のバイト列は偽とみなされるので、読み終わると `while` が止まります。

## ここがすごい

### 読み終わりを 1 つの式で判定する

読んだ結果を変数に入れて、その値が空かどうかで続けるかを決めます。`while True` と `break` を書かずに、読み終わりを自然に表せます。

### メモリは一定

どれだけ大きなファイルでも、一度に持つのは `length` バイトだけです。コピーが終わるまで、同じ大きさの入れ物を使い回します。

### メソッドを変数に入れて速くする

コメントの「Localize variable access」は、ループの中での属性の探索を減らすための工夫です。同じ操作を何度も繰り返すループでは、この小さな違いが効きます。

## まとめ

- 大きなデータは、一定の大きさずつ読んで書くとメモリを節約できる。
- ウォルラス演算子を使うと、読み終わりの判定が 1 つの式で書ける。
- ループの中で繰り返す属性は、外に取り出しておくと速くなる。
