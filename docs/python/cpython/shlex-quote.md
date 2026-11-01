---
title: シェルのコマンドに渡す文字列を、一重引用符で安全に囲む
description: shlex.quote は、文字列をシェルで 1 つの引数として扱えるように引用する。安全な文字だけなら何もせず、そうでなければ一重引用符で囲み、中の一重引用符は二重引用符を使って埋め込む。コマンド注入を防ぐための基本的な関数である。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/shlex.py
lines: [320, 344]
function: quote
difficulty: 3
format: 2
tags: [セキュリティ, 文字列処理, 防御的プログラミング]
---

## ひとことで

`quote(s)` は、**文字列をシェルのコマンドに渡しても、1 つの引数として扱われるように引用する** 関数です。
`quote('hello world')` は `'hello world'` を返します。空白や `;` などを含むファイル名を、そのままコマンドに埋め込んでも、別のコマンドとして実行されない形にできます。

## コード

::: code-group

```python:line-numbers=320 [日本語訳]
def quote(s, *, force=False):
    """文字列 *s* を、シェルで安全に扱える形に引用したものを返す。

    *force* が *True* なら、安全な文字列であっても必ず引用符で囲む。
    引用符がなくても安全な文字列であっても、同じように囲む。
    """
    if not s:
        return "''"

    if not isinstance(s, str):
        raise TypeError(f"expected string object, got {type(s).__name__!r}")

    # 速度のため bytes.translate() を使う
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
    # 強制しない場合、引用符が要らないのは
    # s が ASCII で、safe_chars の文字だけからなるときである。
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s

    # シングルクォートで囲み、中のシングルクォートは二重引用符で包む
    # たとえば $'b という文字列は、'$'"'"'b' と引用される
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

```python:line-numbers=320 [原文]
def quote(s, *, force=False):
    """Return a shell-escaped version of the string *s*.

    If *force* is *True*, then *s* is unconditionally quoted,
    even if it is already safe for a shell without being quoted.
    """
    if not s:
        return "''"

    if not isinstance(s, str):
        raise TypeError(f"expected string object, got {type(s).__name__!r}")

    # Use bytes.translate() for performance
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
    # No quoting is needed if we are not forcing quoting
    # and `s` is an ASCII string consisting only of `safe_chars`.
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s

    # use single quotes, and put single quotes into double quotes
    # the string $'b is then quoted as '$'"'"'b'
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

:::

## 前提知識

- **シェル**: 文字列をコマンドとして解釈するプログラムです。空白や `;`、`$` などに特別な意味があります。
- **コマンド注入**: 入力の中に紛れ込んだ記号で、意図しないコマンドが実行される攻撃です。
- **一重引用符**: シェルの中で、囲んだ中身をそのまま扱う記号です。中に一重引用符は書けません。
- **`bytes.translate`**: バイト列の文字を、表を使って一括で変換・削除する方法です。

## 何をしているか

### 1. 空の文字列は `''` にする

```python:line-numbers=326
    if not s:
        return "''"
```

空の文字列は、何も書かないとシェルには引数がないと見なされます。`''` と囲むと、空の引数として正しく渡ります。

### 2. 文字列以外は受け付けない

```python:line-numbers=329
    if not isinstance(s, str):
        raise TypeError(f"expected string object, got {type(s).__name__!r}")
```

`str` 以外の値が来たら、`TypeError` で止めます。型が違うまま引用すると、誤った文字列がコマンドに渡るおそれがあるためです。

### 3. 安全な文字だけなら、そのまま返す

```python:line-numbers=333
    safe_chars = (b'%+,-./0123456789:=@'
                  b'ABCDEFGHIJKLMNOPQRSTUVWXYZ_'
                  b'abcdefghijklmnopqrstuvwxyz')
```

英数字と `%+,-./:=@_` だけの表を作ります。この文字だけからなる ASCII の文字列は、引用しなくてもシェルが 1 つの語として扱います。

```python:line-numbers=338
    if (not force
        and s.isascii() and not s.encode().translate(None, delete=safe_chars)):
        return s
```

`translate` で、安全な文字を全部取り除いて残りを調べます。残りが空なら、引用は不要なので、元の文字列をそのまま返します。`force` が真のときは、この判定を飛ばします。

### 4. 一重引用符で囲む

```python:line-numbers=344
    return "'" + s.replace("'", "'\"'\"'") + "'"
```

中の一重引用符は、`'"'"'` という並びに置き換えます。一度閉じて、二重引用符の中に一重引用符を入れ、また開き直すという方法です。その後、全体を一重引用符で囲みます。

## ここがすごい

### 安全な文字の表で判定する

「どの文字が安全か」を、表として 1 か所にまとめています。判定は `translate` で一括に行うので、文字を 1 つずつ調べるより速く動きます。

### 一重引用符の中に、一重引用符を入れる工夫

シェルの一重引用符の中では、`\` でも一重引用符は書けません。`'"'"'` と組み替えて、一重引用符を 1 文字ずつ別の形で渡しています。知らないと書けない部分です。

### 「囲むかどうか」を分けて考えられる

安全な文字だけのときは何もしない、という判定を分けてあります。読みやすさを保ちながら、必要なときだけ囲むので、コマンドが読みやすいまま使えます。

## まとめ

- シェルに渡す文字列は、一重引用符で囲むと 1 つの引数として扱われる。
- 中の一重引用符は、`'"'"'` と組み替えて埋め込む。
- 安全な文字だけなら、引用せずに返す設計にすると、無駄な引用を避けられる。
