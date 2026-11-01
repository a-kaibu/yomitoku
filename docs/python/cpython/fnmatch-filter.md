---
title: ワイルドカードに合うファイル名だけ選ぶとき、OS によって正規化を省く
description: fnmatch.filter は、ワイルドカード（*.py など）に一致する名前だけをリストで返す。Unix では大文字小文字の正規化が何もしないので、ループの外へ出して速くしている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/fnmatch.py
lines: [53, 67]
function: filter
difficulty: 1
format: 2
tags: [文字列処理, 正規表現, 最適化, 標準ライブラリ]
---

## ひとことで

`filter(names, pat)` は、`names` の中からワイルドカードの `pat` に一致するものだけを選んで、リストで返す関数です。
`filter(['a.py', 'b.txt'], '*.py')` は `['a.py']` を返します。ファイル名を絞り込むときに使えます。

## コード

::: code-group

```python:line-numbers=53 [日本語訳]
def filter(names, pat):
    """PAT に一致する、イテラブル NAMES の要素からリストを作る。"""
    result = []
    pat = os.path.normcase(pat)
    match = _compile_pattern(pat)
    if os.path is posixpath:
        # posix では normcase は何もしない（NOP）ので、ループの外へ出して最適化する。
        for name in names:
            if match(name):
                result.append(name)
    else:
        for name in names:
            if match(os.path.normcase(name)):
                result.append(name)
    return result
```

```python:line-numbers=53 [原文]
def filter(names, pat):
    """Construct a list from those elements of the iterable NAMES that match PAT."""
    result = []
    pat = os.path.normcase(pat)
    match = _compile_pattern(pat)
    if os.path is posixpath:
        # normcase on posix is NOP. Optimize it away from the loop.
        for name in names:
            if match(name):
                result.append(name)
    else:
        for name in names:
            if match(os.path.normcase(name)):
                result.append(name)
    return result
```

:::

`os.path.normcase` は、OS に合わせてパスの大文字小文字などを正規化する関数です。Unix 系では何もしません。

## 前提知識

- **ワイルドカード**: `*` は「任意の文字列」、`?` は「任意の 1 文字」を表すパターンです。`*.py` は `.py` で終わる名前すべてに一致します。
- **`normcase`**: Windows では大文字小文字を区別しないので、小文字に揃えます。Unix では、そのまま返します。
- **`os.path is posixpath`**: `os.path` が Unix 系の `posixpath` と同じオブジェクトかどうかを `is` で確かめています。
- **`_compile_pattern`**: パターンを正規表現に変換して、一度作った結果をキャッシュする関数です（`lru_cache` で覚えます）。

## 何をしているか

### 1. パターンを用意する

```python:line-numbers=55
    result = []
    pat = os.path.normcase(pat)
    match = _compile_pattern(pat)
```

`pat` を正規化し、一致判定の関数 `match` を用意します。同じパターンの変換は、キャッシュのおかげで 2 回目以降は省けます。

### 2. Unix なら、ループの中で正規化しない

```python:line-numbers=58
    if os.path is posixpath:
        # posix では normcase は何もしない（NOP）ので、ループの外へ出して最適化する。
        for name in names:
            if match(name):
                result.append(name)
```

`os.path` が `posixpath` なら、ループの中で `normcase` を呼ぶ必要がありません。そこで名前をそのまま `match` に渡し、一致したものだけを `result` に入れます。

### 3. それ以外の OS では、名前ごとに正規化する

```python:line-numbers=63
    else:
        for name in names:
            if match(os.path.normcase(name)):
                result.append(name)
```

Windows などでは、名前ごとに `normcase` をかけてから判定します。`pat` は最初に 1 回だけ正規化してあるので、比べる形がそろいます。

### 4. 結果を返す

```python:line-numbers=67
    return result
```

## ここがすごい

### 変わらない処理をループから出す

Unix では `normcase` が何もしないので、ループの中で毎回呼ぶのは無駄です。`if os.path is posixpath` で分岐して、無駄な関数呼び出しを省いています。コメントには「ループから出して最適化する」と書かれています。

### パターンの変換を使い回す

`_compile_pattern` は `lru_cache` で結果を覚えるので、同じパターンで何度 `filter` を呼んでも、正規表現への変換は 1 回で済みます。

### 同じ関数を 2 通りに分ける

両方の分岐で `match` を呼ぶ処理は同じです。違うのは「名前を正規化するかどうか」だけなので、差が分かりやすい形に書かれています。

## まとめ

- 結果が変わらない処理は、ループの外へ出すと速くなる。
- OS ごとの違いは、分岐を 1 か所に集めると読みやすい。
- 繰り返し使うパターンは、変換結果をキャッシュすると速い。
