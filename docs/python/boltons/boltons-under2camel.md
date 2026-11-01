---
title: アンダースコアで区切った名前を、キャメルケースに変える
description: boltons の under2camel は、アンダースコアで区切った文字列を、各単語の先頭を大文字にして続けた形に変える。クラス名を、関数名から作るような場面で使える。連続したアンダースコアは、空の単語にならないように _ として残す。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [79, 86]
function: under2camel
difficulty: 1
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`under2camel(under_string)` は、**アンダースコアで区切られた名前を、単語ごとに先頭を大文字にして続けた名前** に変える関数です。
`under2camel('complex_tokenizer')` は `'ComplexTokenizer'` を返します。

## コード

::: code-group

```python:line-numbers=79 [日本語訳]
def under2camel(under_string):
    """アンダースコア付きの文字列を、キャメルケースに変える。関数名からクラス名を作るときに便利。
    

    >>> under2camel('complex_tokenizer')
    'ComplexTokenizer'
    """
    return ''.join(w.capitalize() or '_' for w in under_string.split('_'))
```

```python:line-numbers=79 [原文]
def under2camel(under_string):
    """Converts an underscored string to camelcased. Useful for turning a
    function name into a class name.

    >>> under2camel('complex_tokenizer')
    'ComplexTokenizer'
    """
    return ''.join(w.capitalize() or '_' for w in under_string.split('_'))
```

:::

## 前提知識

- **スネークケース**: `complex_tokenizer` のように、単語をアンダースコアでつなぐ書き方です。Python の関数名でよく使われます。
- **キャメルケース**: `ComplexTokenizer` のように、単語の先頭だけを大文字にして続ける書き方です。クラス名でよく使われます。
- **`str.split`**: 文字列を、指定した記号で区切ってリストにするメソッドです。
- **`str.capitalize`**: 先頭を大文字、残りを小文字にするメソッドです。

## 何をしているか

### 1. アンダースコアで単語に分ける

```python:line-numbers=86
    return ''.join(w.capitalize() or '_' for w in under_string.split('_'))
```

`under_string.split('_')` で、単語のリストを作ります。`complex_tokenizer` なら、`complex` と `tokenizer` の 2 つになります。

### 2. 単語の先頭を大文字にして、つなぐ

```python:line-numbers=86
    return ''.join(w.capitalize() or '_' for w in under_string.split('_'))
```

それぞれの単語に `capitalize` をかけて、先頭だけ大文字にします。空の単語は `or '_'` で `_` に置き換え、最後に `join` でつなげます。

## ここがすごい

### 連続したアンダースコアを残す

`complex__tokenizer` のように、アンダースコアが 2 つ続くと、間の単語が空になります。`or '_'` があるので、空の単語は `_` として残ります。単純に結合すると消えてしまう情報を守っています。

### 1 行で変換できる

分割、変換、結合を 1 行の式で書いています。ループや一時変数が要らないので、変換の流れが読み取りやすくなります。

### 単語の中の大文字を消すことがある

`capitalize` は、残りの文字を小文字にします。`HTTPServer` のような単語は、`Httpserver` になってしまうので、略語を含む名前には注意が必要です。

## まとめ

- アンダースコアで分け、各単語の先頭を大文字にして結合すると、キャメルケースになる。
- 空の単語を `_` として残すと、連続したアンダースコアの情報を失わない。
- `capitalize` は残りを小文字にするので、略語の扱いは別に考える。
