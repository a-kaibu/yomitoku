---
title: ワイルドカードの間の部分を、最短一致の正規表現でつなぐ
description: fnmatch の内部関数 _join_translated_parts は、シェルのパターン（*.py など）を変換した断片を 1 つの正規表現につなぐ。星印の間を、アトミックグループを使った最短一致で結び、バックトラックを防いでいる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/fnmatch.py
lines: [186, 209]
function: _join_translated_parts
difficulty: 3
format: 2
tags: [正規表現, 文字列処理, 最適化]
---

## ひとことで

`_join_translated_parts(parts, star_indices)` は、シェルのパターンを正規表現に変えた **断片のリストを、1 つの正規表現にまとめる** 関数です。
`*.py` のようなパターンは、`*`（任意の文字列）と `.py` の部分に分けられ、それらを正規表現として組み立て直します。

## コード

::: code-group

```python:line-numbers=186 [日本語訳]
def _join_translated_parts(parts, star_indices):
    if not star_indices:
        return fr'(?s:{"".join(parts)})\z'
    iter_star_indices = iter(star_indices)
    j = next(iter_star_indices)
    buffer = parts[:j]  # fixed pieces at the start
    append, extend = buffer.append, buffer.extend
    i = j + 1
    for j in iter_star_indices:
        # ここでは STAR fixed STAR fixed ... を処理する
        # 内側の `STAR fixed` の組では、最短の .*? に続けて fixed を
        # 照合し、バックトラックが起きないようにしたい。
        # アトミックグループ "(?>...)" を使うと、そのまま書ける。
        # 注意: 文書化されていないが、利用者はこの機能に頼っている。複数の
        # translate() の結果を "|" でつなぎ、大きな正規表現を作る。
        # 「多数のうちどれか」のシェルパターンに一致させるために。
        append('(?>.*?')
        extend(parts[i:j])
        append(')')
        i = j + 1
    append('.*')
    extend(parts[i:])
    res = ''.join(buffer)
    return fr'(?s:{res})\z'
```

```python:line-numbers=186 [原文]
def _join_translated_parts(parts, star_indices):
    if not star_indices:
        return fr'(?s:{"".join(parts)})\z'
    iter_star_indices = iter(star_indices)
    j = next(iter_star_indices)
    buffer = parts[:j]  # fixed pieces at the start
    append, extend = buffer.append, buffer.extend
    i = j + 1
    for j in iter_star_indices:
        # Now deal with STAR fixed STAR fixed ...
        # For an interior `STAR fixed` pairing, we want to do a minimal
        # .*? match followed by `fixed`, with no possibility of backtracking.
        # Atomic groups ("(?>...)") allow us to spell that directly.
        # Note: people rely on the undocumented ability to join multiple
        # translate() results together via "|" to build large regexps matching
        # "one of many" shell patterns.
        append('(?>.*?')
        extend(parts[i:j])
        append(')')
        i = j + 1
    append('.*')
    extend(parts[i:])
    res = ''.join(buffer)
    return fr'(?s:{res})\z'
```

:::

## 前提知識

- **シェルのパターン**: `*` は任意の文字列、`?` は任意の 1 文字を表します。ファイル名の絞り込みなどに使われます。
- **正規表現**: 文字列の形を、記号で表す方法です。`.*` は「任意の文字の並び」を表します。
- **最短一致（`.*?`）**: できるだけ短い範囲で一致させる指定です。`*` の後ろは、次の固定部分が見つかった時点で止まります。
- **バックトラック**: 正規表現が一致しなかったとき、前の選び方に戻って別の選び方を試すことです。長いパターンでは、この戻りが多くなって遅くなります。
- **アトミックグループ `(?>...)`**: 一度一致した部分には戻らない、という指定です。バックトラックを止めることができます。

## 何をしているか

### 1. 星印がなければ、そのまま結ぶ

```python:line-numbers=187
    if not star_indices:
        return fr'(?s:{"".join(parts)})\z'
```

`*` がない場合は、断片をつなげて、文字列全体が一致するように `\z`（末尾）を付けるだけです。

### 2. 最初の星印までを前に置く

```python:line-numbers=189
    iter_star_indices = iter(star_indices)
    j = next(iter_star_indices)
    buffer = parts[:j]  # fixed pieces at the start
    append, extend = buffer.append, buffer.extend
    i = j + 1
```

最初の星印の位置を見つけ、それより前の断片は `buffer` に入れます。

### 3. 星印の間を最短一致で結ぶ

```python:line-numbers=194
    for j in iter_star_indices:
        # ここでは STAR fixed STAR fixed ... を処理する
        # 内側の `STAR fixed` の組では、最短の .*? に続けて fixed を
        # 照合し、バックトラックが起きないようにしたい。
        # アトミックグループ "(?>...)" を使うと、そのまま書ける。
        # 注意: 文書化されていないが、利用者はこの機能に頼っている。複数の
        # translate() の結果を "|" でつなぎ、大きな正規表現を作る。
        # 「多数のうちどれか」のシェルパターンに一致させるために。
        append('(?>.*?')
        extend(parts[i:j])
        append(')')
        i = j + 1
```

2 つの星印の間にある固定部分を、`(?>.*?固定部分)` という形にします。最短一致で探し、見つかったらその場で確定させるので、戻る必要がありません。コメントにあるように、アトミックグループで書いています。

### 4. 最後の星印と、残りを結ぶ

```python:line-numbers=206
    append('.*')
    extend(parts[i:])
    res = ''.join(buffer)
    return fr'(?s:{res})\z'
```

最後の星印は `.*` にして、残りの断片をつなぎます。全体を `(?s:...)\z` で包み、改行も含めて末尾まで一致させます。

## ここがすごい

### バックトラックを防ぐ

`*` を単純に `.*` で繋ぐと、一致しないときに正規表現が何通りも試されて、とても遅くなることがあります。アトミックグループで区切ると、一度見つけた位置を捨てないので、無駄な試行が減ります。

### 「多数の中の 1 つ」への応用

コメントには、`translate()` の結果を `|` でつなぎ、大きな正規表現を作る使い方が書かれています。文書には載っていませんが、利用者はこの仕組みに頼っています。だから、内部の形を変えるときは注意が必要です。

### 星印の数に合わせて組み立てる

星印の位置を先に集めておき、その間だけ特別な形にする。この分け方で、星印がいくつあっても同じ仕組みで組み立てられます。

## まとめ

- シェルのパターンは、星印で区切って、間の部分を正規表現に組み直せる。
- 星印の間を最短一致で結ぶと、無駄な戻りを防げる。
- 内部の関数でも、利用者が頼っている使い方があるので、変更には注意する。
