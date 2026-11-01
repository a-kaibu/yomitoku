---
title: 引用符で囲まれた値を含むカンマ区切りのリストを、正しく分ける
description: requests.utils.parse_list_header は、HTTP ヘッダーのようなカンマ区切りの文字列を、リストに分ける。引用符の中のカンマは区切りとみなさず、引用符で囲まれた項目は中身だけを取り出す。RFC 2068 の規則に従う。
language: python
project: Requests
repo: https://github.com/psf/requests
license: Apache-2.0
copyright: Copyright 2019 Kenneth Reitz
commit: "3c7baaa05ab4aa49cc819ce3a819d260de19c157"
file: src/requests/utils.py
lines: [408, 436]
function: parse_list_header
difficulty: 3
format: 2
tags: [文字列処理, パース, 標準ライブラリ]
---

## ひとことで

`parse_list_header(value)` は、**カンマで区切られた文字列を、要素のリストに分ける** 関数です。
引用符で囲まれた中のカンマは区切りとして扱わないのが特徴です。`parse_list_header('token, "quoted value"')` は `['token', 'quoted value']` を返します。

## コード

::: code-group

```python:line-numbers=408 [日本語訳]
def parse_list_header(value: str) -> list[str]:
    """RFC 2068 のセクション 2 に書かれたリストの形式に従って解析する。

    In particular, parse comma-separated lists where the elements of
    the list may include quoted-strings.  A quoted-string could
    contain a comma.  A non-quoted string could have quotes in the
    middle.  Quotes are removed automatically after parsing.

    It basically works like :func:`parse_set_header` just that items
    may appear multiple times and case sensitivity is preserved.

    The return value is a standard :class:`list`:

    >>> parse_list_header('token, "quoted value"')
    ['token', 'quoted value']

    To create a header from the :class:`list` again, use the
    :func:`dump_header` function.

    :param value: a string with a list header.
    :return: :class:`list`
    :rtype: list
    """
    result: list[str] = []
    for item in _parse_list_header(value):
        if item[:1] == item[-1:] == '"':
            item = unquote_header_value(item[1:-1])
        result.append(item)
    return result
```

```python:line-numbers=408 [原文]
def parse_list_header(value: str) -> list[str]:
    """Parse lists as described by RFC 2068 Section 2.

    In particular, parse comma-separated lists where the elements of
    the list may include quoted-strings.  A quoted-string could
    contain a comma.  A non-quoted string could have quotes in the
    middle.  Quotes are removed automatically after parsing.

    It basically works like :func:`parse_set_header` just that items
    may appear multiple times and case sensitivity is preserved.

    The return value is a standard :class:`list`:

    >>> parse_list_header('token, "quoted value"')
    ['token', 'quoted value']

    To create a header from the :class:`list` again, use the
    :func:`dump_header` function.

    :param value: a string with a list header.
    :return: :class:`list`
    :rtype: list
    """
    result: list[str] = []
    for item in _parse_list_header(value):
        if item[:1] == item[-1:] == '"':
            item = unquote_header_value(item[1:-1])
        result.append(item)
    return result
```

:::

`_parse_list_header` は、同じファイルにある内部の関数で、引用符の中を見ながらカンマで分けます。`unquote_header_value` は、引用符を外す関数です。

## 前提知識

- **HTTP のヘッダー**: サーバーとブラウザがやり取りする情報の行です。`Accept: text/html, application/json` のように、カンマで値を並べることがあります。
- **引用符（quoted-string）**: `"..."` で囲まれた文字列です。中にカンマや空白を含められます。
- **RFC 2068**: HTTP の仕様を定めた文書です。ここでは、リストの書き方の規則を指します。
- **`item[:1] == item[-1:] == '"'`**: 先頭と末尾が両方 `"` かを調べる書き方です。

## 何をしているか

### 1. カンマで分けた項目を取り出す

```python:line-numbers=431
    result: list[str] = []
    for item in _parse_list_header(value):
```

内部の関数 `_parse_list_header` で、引用符の外にあるカンマだけで分けた項目を、順に取り出します。引用符の中のカンマは、ここでは区切りになりません。

### 2. 引用符で囲まれた項目を外す

```python:line-numbers=433
        if item[:1] == item[-1:] == '"':
            item = unquote_header_value(item[1:-1])
```

項目の先頭と末尾が両方 `"` なら、引用符の中身だけを取り出し、`unquote_header_value` で引用符の扱いを整えます。

### 3. 結果を並べて返す

```python:line-numbers=435
        result.append(item)
    return result
```

処理した項目を `result` に追加し、最後にリストとして返します。

## ここがすごい

### 引用符の中のカンマを守る

`"a, b"` のような値を単純に `split(',')` で分けると、2 つに割れてしまいます。この関数は、引用符の状態を見ながら分けるので、1 つの項目として残ります。

### 引用符の有無を項目ごとに判定する

引用符で囲まれていない項目はそのまま、囲まれている項目は中身だけを取る、と項目ごとに処理を分けています。HTTP のヘッダーでは、どちらも混ざるのが普通です。

### 出力の形を保つ

docstring にあるとおり、`dump_header` を使えば、リストからヘッダーの文字列に戻せます。分けて作り直せる、対になった関数です。

## まとめ

- カンマ区切りの文字列は、引用符の中を守りながら分けると正しく読める。
- 引用符の有無は項目ごとに判定し、中身だけを取り出す。
- 分ける関数と作る関数を対にしておくと、往復の変換が安心して使える。
