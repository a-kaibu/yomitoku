---
title: 親フォルダと違うデバイスにあれば、マウントポイントと判定する
description: os.path.ismount は、パスがマウントポイント（別のディスクを取り付けた場所）かどうかを調べる。パスと、その親（path/..）の所属デバイスを比べ、違えば true を返す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/posixpath.py
lines: [191, 218]
function: ismount
difficulty: 3
format: 2
tags: [ファイル, 標準ライブラリ, 低レイヤ]
---

## ひとことで

`ismount(path)` は、**そのパスが別のディスクやパーティションを取り付けた場所（マウントポイント）かどうか** を調べる関数です。
`ismount('/')` や、USB メモリを取り付けた `/media/...` のような場所で `True` になります。普通のフォルダでは `False` です。

## コード

::: code-group

```python:line-numbers=191 [日本語訳]
def ismount(path):
    """パスがマウントポイントかどうかを調べる"""
    try:
        s1 = os.lstat(path)
    except (OSError, ValueError):
        # 存在しない。つまりマウントポイントではない。
        return False
    else:
        # シンボリックリンクは、マウントポイントにはなり得ない
        if stat.S_ISLNK(s1.st_mode):
            return False

    path = os.fspath(path)
    if isinstance(path, bytes):
        parent = join(path, b'..')
    else:
        parent = join(path, '..')
    try:
        s2 = os.lstat(parent)
    except OSError:
        parent = realpath(parent)
        try:
            s2 = os.lstat(parent)
        except OSError:
            return False

    # path/.. が path と別のデバイスにあるか、path と同じ i-node なら、マウントポイント
    return s1.st_dev != s2.st_dev or s1.st_ino == s2.st_ino
```

```python:line-numbers=191 [原文]
def ismount(path):
    """Test whether a path is a mount point"""
    try:
        s1 = os.lstat(path)
    except (OSError, ValueError):
        # It doesn't exist -- so not a mount point. :-)
        return False
    else:
        # A symlink can never be a mount point
        if stat.S_ISLNK(s1.st_mode):
            return False

    path = os.fspath(path)
    if isinstance(path, bytes):
        parent = join(path, b'..')
    else:
        parent = join(path, '..')
    try:
        s2 = os.lstat(parent)
    except OSError:
        parent = realpath(parent)
        try:
            s2 = os.lstat(parent)
        except OSError:
            return False

    # path/.. on a different device as path or the same i-node as path
    return s1.st_dev != s2.st_dev or s1.st_ino == s2.st_ino
```

:::

`lstat` は、リンクをたどらずにファイルの情報（デバイス番号や i-node 番号など）を取る関数です。`S_ISLNK` は、その情報がシンボリックリンクかどうかを調べる関数です。

## 前提知識

- **マウントポイント**: ディスクを「取り付けた」フォルダのことです。取り付けられた先のディスクは、親とは別の **デバイス** に属します。
- **デバイス番号（`st_dev`）**: そのファイルがどのディスク（デバイス）にあるかを表す番号です。
- **i-node 番号（`st_ino`）**: ファイルシステムの中でのファイルの識別番号です。同じ i-node なら、同じファイルを指します。
- **`path/..`**: 1 つ上のフォルダを表します。`/` の親は `/` 自身です。

## 何をしているか

### 1. 存在し、シンボリックリンクでないことを確かめる

```python:line-numbers=193
    try:
        s1 = os.lstat(path)
    except (OSError, ValueError):
        # 存在しない。つまりマウントポイントではない。
        return False
    else:
        # シンボリックリンクは、マウントポイントにはなり得ない
        if stat.S_ISLNK(s1.st_mode):
            return False

    path = os.fspath(path)
    if isinstance(path, bytes):
        parent = join(path, b'..')
    else:
```

まず `lstat` で、パス自体の情報を取ります。存在しなければ、マウントポイントではありません。シンボリックリンクも、マウントポイントにはなり得ないので、`False` にします。

### 2. 親フォルダの情報を取る

```python:line-numbers=207
        parent = join(path, '..')
    try:
        s2 = os.lstat(parent)
    except OSError:
        parent = realpath(parent)
        try:
            s2 = os.lstat(parent)
        except OSError:
            return False
```

`path/..` の情報を取ります。取れないときは、`realpath` で正しい場所を求め直して、もう一度調べます。それでも取れなければ、`False` です。

### 3. デバイスか i-node を比べる

```python:line-numbers=218
    return s1.st_dev != s2.st_dev or s1.st_ino == s2.st_ino
```

`st_dev` が違えば、親とは別のディスクにあるので、マウントポイントです。`st_ino` が同じなら、`path/..` と `path` が同じ場所を指しているので、ファイルシステムの根（`/`）だと判定します。

## ここがすごい

### 中身を読まずに、情報だけで判定する

マウントポイントかどうかは、フォルダの中身を見ても分かりません。デバイス番号と i-node 番号の 2 つを比べるだけで、ファイルシステムの境目を見つけられます。

### 根（`/`）の特殊な場合

`/` の親は `/` 自身です。そのため、デバイス番号は同じになります。そこで i-node 番号が同じかどうかを確かめて、根も取り付け先として扱っています。

### シンボリックリンクを先に除く

シンボリックリンクは、別の場所を指す目印です。そのまま調べると、リンク先の情報が出てしまうので、先に `lstat` で除いています。

## まとめ

- マウントポイントは、親とデバイス番号が違うかで判定できる。
- ファイルシステムの根は、i-node 番号が親と同じになるので、別に判定する。
- 存在しないもの、シンボリックリンクは、最初に除くと判定が単純になる。
