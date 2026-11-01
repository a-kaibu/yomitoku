---
title: 最小と最大だけ比べれば共通部分がわかる、という発見
description: os.path.commonpath は、複数のパスに共通する一番長い親ディレクトリを返す。全部を比べず、辞書順で最小と最大の 2 つだけを比べるのがミソ。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/posixpath.py
lines: [561, 597]
function: commonpath
difficulty: 2
format: 2
tags: [文字列処理, ファイル, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`commonpath(paths)` は、複数のパスに **共通する一番深いディレクトリ** を返す関数です。
`commonpath(['/usr/lib/python', '/usr/lib/perl', '/usr/local'])` は `'/usr'` を返します。
パスがいくつあっても、**辞書順でいちばん小さいものといちばん大きいものの 2 つだけを比べれば答えが出る** という性質を使っています。

## コード

::: code-group

```python:line-numbers=561 [日本語訳]
def commonpath(paths):
    """パス名の並びを受け取り、共通する最長の親ディレクトリを返す。"""

    paths = tuple(map(os.fspath, paths))

    if not paths:
        raise ValueError('commonpath() arg is an empty sequence')

    if isinstance(paths[0], bytes):
        sep = b'/'
        curdir = b'.'
    else:
        sep = '/'
        curdir = '.'

    try:
        split_paths = [path.split(sep) for path in paths]

        try:
            isabs, = {p.startswith(sep) for p in paths}
        except ValueError:
            raise ValueError("Can't mix absolute and relative paths") from None

        split_paths = [[c for c in s if c and c != curdir] for s in split_paths]
        s1 = min(split_paths)
        s2 = max(split_paths)
        common = s1
        for i, c in enumerate(s1):
            if c != s2[i]:
                common = s1[:i]
                break

        prefix = sep if isabs else sep[:0]
        return prefix + sep.join(common)
    except (TypeError, AttributeError):
        genericpath._check_arg_types('commonpath', *paths)
        raise
```

```python:line-numbers=561 [原文]
def commonpath(paths):
    """Given a sequence of path names, returns the longest common sub-path."""

    paths = tuple(map(os.fspath, paths))

    if not paths:
        raise ValueError('commonpath() arg is an empty sequence')

    if isinstance(paths[0], bytes):
        sep = b'/'
        curdir = b'.'
    else:
        sep = '/'
        curdir = '.'

    try:
        split_paths = [path.split(sep) for path in paths]

        try:
            isabs, = {p.startswith(sep) for p in paths}
        except ValueError:
            raise ValueError("Can't mix absolute and relative paths") from None

        split_paths = [[c for c in s if c and c != curdir] for s in split_paths]
        s1 = min(split_paths)
        s2 = max(split_paths)
        common = s1
        for i, c in enumerate(s1):
            if c != s2[i]:
                common = s1[:i]
                break

        prefix = sep if isabs else sep[:0]
        return prefix + sep.join(common)
    except (TypeError, AttributeError):
        genericpath._check_arg_types('commonpath', *paths)
        raise
```

:::

## 前提知識

- **`map(f, xs)`**: `xs` の各要素に `f` を適用します。ここではすべてのパスを `os.fspath` で文字列にしています。
- **`tuple(...)`**: 並びを変更できないタプルに変換します。
- **リストの大小比較**: Python のリストは先頭の要素から順に比べられます（辞書順）。`['usr', 'lib'] < ['usr', 'local']` は、2 番目の `'lib' < 'local'` で決まり真です。
- **`min` と `max`**: 並びの中で最小・最大のものを返します。
- **集合の内包表記と分解代入**: `isabs, = {...}` は、「集合の要素がちょうど 1 個なら、それを `isabs` に入れる」という書き方です。2 個以上あるとエラー（`ValueError`）になります。
- **`sep[:0]`**: どんな文字列でも `[:0]` は空です。`sep` が文字列なら `''`、バイト列なら `b''` になります。

## 何をしているか

### 1. 入力を準備し、区切り文字を決める

```python:line-numbers=564
    paths = tuple(map(os.fspath, paths))

    if not paths:
        raise ValueError('commonpath() arg is an empty sequence')

    if isinstance(paths[0], bytes):
        sep = b'/'
        curdir = b'.'
    else:
        sep = '/'
        curdir = '.'
```

空ならエラーです。文字列かバイト列かで区切り文字を決めます。

### 2. 絶対パスと相対パスが混ざっていないか調べる

```python:line-numbers=579
        try:
            isabs, = {p.startswith(sep) for p in paths}
        except ValueError:
            raise ValueError("Can't mix absolute and relative paths") from None
```

`{p.startswith(sep) for p in paths}` は、全部が絶対パスなら `{True}`、全部が相対なら `{False}`、混ざっていたら `{True, False}` です。要素が 1 個でなければ分解代入が失敗し、「混ぜられない」というエラーにします。

### 3. 区切って、空と `.` を捨てる

```python:line-numbers=584
        split_paths = [[c for c in s if c and c != curdir] for s in split_paths]
```

例のパスは次の 3 つのリストになります。

- `['usr', 'lib', 'python']`
- `['usr', 'lib', 'perl']`
- `['usr', 'local']`

### 4. 最小と最大を比べる

```python:line-numbers=585
        s1 = min(split_paths)
        s2 = max(split_paths)
        common = s1
        for i, c in enumerate(s1):
            if c != s2[i]:
                common = s1[:i]
                break
```

辞書順の最小は `['usr', 'lib', 'perl']`、最大は `['usr', 'local']` です。先頭から比べると 2 番目で `'lib'` と `'local'` が違うので、共通部分は `['usr']` です。

### 5. 組み立てる

```python:line-numbers=593
        prefix = sep if isabs else sep[:0]
        return prefix + sep.join(common)
```

絶対パスなら先頭に `/` を付けて `'/usr'` を返します。

## ここがすごい

### 「最小と最大の共通部分 = 全体の共通部分」

辞書順に並べたとき、最小と最大の間にあるものはすべて、**最小と最大が共有している先頭部分を必ず持っています**。辞書順とは「先頭から順に比べる」並べ方なので、両端が同じ先頭を持つなら、その間に挟まれたものも同じ先頭で始まるしかないからです。
そのため n 個のパスを総当たりで比べる必要はなく、`min` と `max` で両端を見つけて 1 回比べるだけで済みます。同じ技は `os.path.commonprefix` や `textwrap.dedent` でも使われています。

### 区切った単位で比べる

文字単位で比べると、`/usr/lib` と `/usr/local` の共通部分が `/usr/l` になってしまいます。先にパスを `/` で区切ってリストにし、**ディレクトリ名の単位で** 比べることで、途中で切れた名前を返すことがありません。

### 分解代入をチェックに使う

`isabs, = {...}` という 1 行で、「全部同じ種類か」の判定と、その値の取り出しを同時に行っています。if 文で個数を調べるより短く、意図もはっきりしています。

### 型の違いでエラーになったら原因を調べ直す

文字列とバイト列が混ざっていると、途中で `TypeError` などが起きます。その場合は `_check_arg_types` で「どの引数の型がおかしいか」がわかるエラーを出し直しています。

## まとめ

- 辞書順の最小と最大の共通先頭は、全体の共通先頭に等しい。
- 比べる単位（文字かディレクトリか）を正しく選ぶことが、パス処理の正しさにつながる。
- 集合と分解代入を組み合わせると、「全部同じか」を 1 行で確かめられる。
