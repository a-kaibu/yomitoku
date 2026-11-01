---
title: HTML に入れる前に、特殊な文字を安全な表記に置き換える
description: html.escape は、&、<、> と、必要に応じて引用符を HTML の表記に置き換える。& を最初に置き換えることで、二重に変換される事故を防ぐ。Web ページに文字列を埋め込むときの基本的な対策である。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/html/__init__.py
lines: [12, 25]
function: escape
difficulty: 1
format: 2
tags: [文字列処理, セキュリティ, 防御的プログラミング]
---

## ひとことで

`escape(s, quote=True)` は、**HTML のページに入れる文字列の特殊文字を、安全な表記に置き換える** 関数です。
`escape('<a href="x">')` は `&lt;a href=&quot;x&quot;&gt;` を返します。ブラウザが、文字をタグの一部として解釈するのを防げます。

## コード

::: code-group

```python:line-numbers=12 [日本語訳]
def escape(s, quote=True):
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.
    省略できる引数 quote が真（既定値）なら、引用符も置き換える。
    二重引用符（"）と一重引用符（'）の両方も対象になる。
    置き換えの対象になる。
    """
    s = s.replace("&", "&amp;") # 必ず最初に行う
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
    return s
```

```python:line-numbers=12 [原文]
def escape(s, quote=True):
    """
    Replace special characters "&", "<" and ">" to HTML-safe sequences.
    If the optional flag quote is true (the default), the quotation mark
    characters, both double quote (") and single quote (') characters are also
    translated.
    """
    s = s.replace("&", "&amp;") # Must be done first!
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
    return s
```

:::

## 前提知識

- **HTML の特殊文字**: `<` や `>` はタグの始まりと終わりを表すので、文字として書くと誤って解釈されます。
- **文字実体参照**: `&lt;` のように、`&` で始まる表記で 1 つの文字を表す仕組みです。
- **引用符**: 属性の値を囲む `"` や `'` です。値の中に入ると、属性が途中で閉じてしまいます。
- **文字列の置換**: `str.replace` で、ある文字列をほかの文字列に置き換える操作です。

## 何をしているか

### 1. `&` を最初に置き換える

```python:line-numbers=19
    s = s.replace("&", "&amp;") # 必ず最初に行う
```

`&` は、ほかの置き換えで作られる `&lt;` などの記号の中にも含まれています。先に `&` を置き換えると、後から作る記号の `&` を二重に変えずに済みます。

### 2. `<` と `>` を置き換える

```python:line-numbers=20
    s = s.replace("<", "&lt;")
    s = s.replace(">", "&gt;")
```

タグの始まりと終わりを表す記号を、文字実体参照に変えます。これで、ブラウザはこの文字をタグとして読まなくなります。

### 3. 引用符を置き換える

```python:line-numbers=22
    if quote:
        s = s.replace('"', "&quot;")
        s = s.replace('\'', "&#x27;")
```

`quote` が真のときだけ、属性の値を囲む引用符を置き換えます。値の中の引用符が、属性を途中で閉じる事故を防ぎます。

## ここがすごい

### 順番が結果を決める

`&` を後回しにすると、`<` から作った `&lt;` の `&` も変わってしまい、`&amp;lt;` になります。置き換えの順番に意味がある、という点が大事です。

### 引用符の扱いを選べる

本文の中だけに入れるなら `quote=False` で十分です。属性の値に入れるときは既定値の `True` にします。同じ関数で、使う場所に合わせられます。

### 単純な置換だけで済む

正規表現を使わず、5 回の `replace` を並べて作られています。短く読めるので、安全に関わる処理をレビューしやすくなります。

## まとめ

- ユーザーの入力を HTML に入れる前に、特殊文字を置き換えると、タグとしての解釈を防げる。
- `&` を最初に置き換えると、二重の変換を防げる。
- 属性の値には、引用符も置き換える設定を使う。
