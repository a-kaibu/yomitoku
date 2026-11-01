---
title: 先頭に決まった文字列があれば、それだけを取り除く
description: boltons.strutils.removeprefix は、文字列の先頭に prefix があればそれを取り除いて返す。str.removeprefix が使えない古い Python 向けの後方互換版で、ない場合は元の文字列をそのまま返す。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [1303, 1315]
function: removeprefix
difficulty: 1
format: 2
tags: [文字列処理, 移植性, 標準ライブラリ]
---

## ひとことで

`removeprefix(text, prefix)` は、**文字列の先頭に決まった文字列があれば、それを取り除く** 関数です。
`removeprefix('v1.2.3', 'v')` は `'1.2.3'` を返します。`prefix` がなければ、`text` をそのまま返します。

## コード

::: code-group

```python:line-numbers=1303 [日本語訳]
def removeprefix(text: str, prefix: str) -> str:
    r"""
    先頭に `prefix` があれば、それを `text` から取り除く。

    Backport of `str.removeprefix` for Python versions less than 3.9.

    Args:
        text: A string to remove the prefix from.
        prefix: The string to remove from the beginning of `text`.
    """
    if text.startswith(prefix):
        return text[len(prefix):]
    return text
```

```python:line-numbers=1303 [原文]
def removeprefix(text: str, prefix: str) -> str:
    r"""
    Remove `prefix` from start of `text` if present.

    Backport of `str.removeprefix` for Python versions less than 3.9.

    Args:
        text: A string to remove the prefix from.
        prefix: The string to remove from the beginning of `text`.
    """
    if text.startswith(prefix):
        return text[len(prefix):]
    return text
```

:::

## 前提知識

- **接頭辞（prefix）**: 文字列の先頭に付く部分です。`'https://'` や `'v'` などがあります。
- **`startswith(prefix)`**: 文字列が、指定した文字列で始まるかを調べます。
- **スライス `text[n:]`**: `n` 番目から最後までの部分を取り出します。
- **後方互換（backport）**: 新しい機能を、古いバージョンの Python でも使えるように作り直したものです。

## 何をしているか

### 1. 先頭が一致するか調べる

```python:line-numbers=1313
    if text.startswith(prefix):
```

`text.startswith(prefix)` で、先頭が `prefix` と同じかを確かめます。

### 2. 一致すれば、その分を取り除く

```python:line-numbers=1314
        return text[len(prefix):]
```

一致したら、`prefix` の長さの分だけ先を切り出して返します。`len(prefix)` の位置から後ろを取るので、中間の同じ文字列は影響を受けません。

### 3. 一致しなければ、そのまま返す

```python:line-numbers=1315
    return text
```

先頭が違えば、何も変えずに `text` を返します。

## ここがすごい

### 「先頭だけ」を正確に取り除く

`replace` を使うと、文字列の途中にある同じ部分まで取り除いてしまいます。`removeprefix` は先頭だけを見るので、意図しない場所は変わりません。

### 失敗しても例外にならない

接頭辞がなくてもエラーにはなりません。元の文字列が返るので、「あれば取る」という処理を、条件分岐なしで書けます。

### 古い Python での穴埋め

標準の `str.removeprefix` は、比較的新しい Python にしかありません。このような小さな関数を用意しておくと、古い環境でも同じ書き方で動かせます。

## まとめ

- 先頭の決まった文字列だけを取り除くには、`startswith` とスライスを使う。
- 途中の同じ部分は変えないよう、先頭だけを見る。
- 古い環境向けに、新しい機能の代わりを用意しておくと、移植性が高まる。
