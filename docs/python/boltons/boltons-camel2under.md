---
title: キャメルケースの名前を、単語をアンダースコアで区切った形に変える
description: boltons の camel2under は、キャメルケースの文字列の大文字の前に _ を入れて、全部を小文字にする。大文字が小文字や数字の後ろにあるかを、正規表現の先読みと後読みで判定する。クラス名から関数名を作るような場面で使える。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [69, 76]
function: camel2under
difficulty: 2
format: 2
tags: [文字列処理, 正規表現]
---

## ひとことで

`camel2under(camel_string)` は、**キャメルケースの名前を、単語をアンダースコアで区切った名前に変える** 関数です。
`camel2under('BasicParseTest')` は `'basic_parse_test'` を返します。クラス名から、関数名を作るときに使えます。

## コード

::: code-group

```python:line-numbers=69 [日本語訳]
def camel2under(camel_string):
    """キャメルケースの文字列を、アンダースコアの形に変える。クラス名を
    関数名にするときに便利。

    >>> camel2under('BasicParseTest')
    'basic_parse_test'
    """
    return _camel2under_re.sub(r'_\1', camel_string).lower()
```

```python:line-numbers=69 [原文]
def camel2under(camel_string):
    """Converts a camelcased string to underscores. Useful for turning a
    class name into a function name.

    >>> camel2under('BasicParseTest')
    'basic_parse_test'
    """
    return _camel2under_re.sub(r'_\1', camel_string).lower()
```

:::

## 前提知識

- **キャメルケース**: `BasicParseTest` のように、単語の先頭を大文字にして、続けて書く名前の形です。
- **正規表現の先読み（lookahead）と後読み（lookbehind）**: 文字を消費せずに、その前後の文字の条件だけを確かめる書き方です。
- **`re.compile` と `sub`**: 正規表現をあらかじめ作り、一致した部分を別の文字列に置き換えるための仕組みです。
- **`str.lower`**: 文字列の大文字をすべて小文字にするメソッドです。

## 何をしているか

### 1. 区切りになる大文字を探す正規表現

```python:line-numbers=66
_camel2under_re = re.compile('((?<=[a-z0-9])[A-Z]|(?!^)[A-Z](?=[a-z]))')
```

区切りの位置は、2 種類あります。1 つ目は、小文字や数字の直後にある大文字です。2 つ目は、先頭以外にあり、後ろが小文字の大文字です。`(?<=[a-z0-9])` と `(?=[a-z])` が、その前後の条件を確かめています。

### 2. 区切りの前にアンダースコアを入れて、小文字にする

```python:line-numbers=76
    return _camel2under_re.sub(r'_\1', camel_string).lower()
```

`sub(r'_\1', ...)` で、見つけた大文字の前に `_` を入れます。`\1` は、一致した大文字そのものを表します。最後に `lower` で、全体を小文字にします。

## ここがすごい

### 先頭の大文字は区切らない

`BasicParseTest` の `B` は、先頭にあるので区切りになりません。`(?!^)` で、文字列の先頭を除外しています。先頭に `_` が付く失敗を避けられます。

### 連続した大文字の扱い

`HTTPServer` のように大文字が続く場合、後ろに小文字が続く `S` だけが区切りになります。略語のまとまりを崩さずに、単語の境目を見つけられます。

### 逆の変換と対になる

同じ boltons の `under2camel` は、この逆の変換です。2 つを組み合わせると、名前の形を行き来できます。

## まとめ

- 大文字の前後の条件を正規表現で書くと、単語の境目を見つけられる。
- 先頭の大文字は区切らないよう除外すると、余計な `_` を防げる。
- 逆方向の変換と組み合わせると、名前の形を相互に変えられる。
