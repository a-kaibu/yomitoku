---
title: 暗号用の乱数を、16 進数の文字列で作る
description: secrets.token_hex は、暗号に使える乱数のバイト列を、16 進数の文字列に変えて返す。1 バイトが 2 文字になるので、nbytes バイトなら長さ 2 × nbytes の文字列になる。パスワードリセットのトークンなどに使う。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/secrets.py
lines: [47, 58]
function: token_hex
difficulty: 1
format: 2
tags: [セキュリティ, 暗号, 乱数]
---

## ひとことで

`token_hex(nbytes)` は、**暗号に使える乱数** を 16 進数の文字列にして返す関数です。
`token_hex(16)` は、長さ 32 の文字列を返します。1 バイトが 2 文字の 16 進数になるからです。

## コード

::: code-group

```python:line-numbers=47 [日本語訳]
def token_hex(nbytes=None):
    """16 進数で表した、ランダムな文字列を返す。

    The string has *nbytes* random bytes, each byte converted to two
    hex digits.  If *nbytes* is ``None`` or not supplied, a reasonable
    default is used.

    >>> token_hex(16)  #doctest:+SKIP
    'f9bf78b9a18ce6d46a0cd2b0b86df9da'

    """
    return token_bytes(nbytes).hex()
```

```python:line-numbers=47 [原文]
def token_hex(nbytes=None):
    """Return a random text string, in hexadecimal.

    The string has *nbytes* random bytes, each byte converted to two
    hex digits.  If *nbytes* is ``None`` or not supplied, a reasonable
    default is used.

    >>> token_hex(16)  #doctest:+SKIP
    'f9bf78b9a18ce6d46a0cd2b0b86df9da'

    """
    return token_bytes(nbytes).hex()
```

:::

`token_bytes` は、同じ `secrets` モジュールにある関数で、暗号に使えるランダムなバイト列を返します。

## 前提知識

- **暗号用の乱数**: 予測されにくい値のことです。`random` モジュールの乱数は、暗号には向きません。`secrets` は、暗号用の乱数源を使います。
- **16 進数（hex）**: 0 から 9 と a から f の 16 種類の文字で数を表します。1 バイト（0 から 255）は、必ず 2 文字で表せます。
- **`.hex()`**: バイト列を 16 進数の文字列に変えるメソッドです。
- **トークン**: 本人確認や一時的な許可のために使う、ランダムな文字列です。

## 何をしているか

### 1. ランダムなバイト列を作る

```python:line-numbers=58
    return token_bytes(nbytes).hex()
```

`token_bytes(nbytes)` で、指定した数のランダムなバイトを作ります。`nbytes` を省略すると、既定の長さが使われます。

### 2. 16 進数の文字列にする

```python:line-numbers=58
    return token_bytes(nbytes).hex()
```

`.hex()` で、各バイトを 2 桁の 16 進数に変えて連結します。例えば 16 バイトなら、32 文字の文字列になります。

## ここがすごい

### `random` ではなく `secrets`

`random` モジュールの乱数は、速いですが予測できる仕組みです。この関数は、予測されにくい乱数源を使うので、トークンの生成に安心して使えます。

### 長さが予測しやすい

1 バイトが必ず 2 文字になるので、欲しい強さに応じて長さを決めやすくなります。`nbytes` を 16 にすれば、32 文字です。

### 文字だけで扱える

バイト列のままだと、URL や設定ファイルに入れにくいことがあります。16 進数の文字列にすると、どこにでも書けます。

## まとめ

- 推測されてはいけない値には、`random` ではなく `secrets` を使う。
- 16 進数の文字列は、バイト数の 2 倍の長さになる。
- 文字列にすると、保存や送信がしやすくなる。
