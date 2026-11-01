---
title: 数が 1 のときだけ単語を単数形のままにする
description: boltons の cardinalize は、数に応じて単語を単数形か複数形にする。数が 1 なら単語をそのまま返し、それ以外なら pluralize で複数形にする。大文字小文字の形も保たれる。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [186, 198]
function: cardinalize
difficulty: 1
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`cardinalize(unit_noun, count)` は、**数に合わせて単語の形を変える** 関数です。
`cardinalize('vowel', 5)` は `vowels` を、`cardinalize('vowel', 1)` は `vowel` を返します。「1 個の犬」「3 匹の犬」のように、数えるものに応じて単語を選びたいときに使えます。

## コード

::: code-group

```python:line-numbers=186 [日本語訳]
def cardinalize(unit_noun, count):
    """数が 1 でない場合に限り、単数形の単語 *unit_noun* を複数形にする。
    *count* が 1 でなければ、可能な限り大文字小文字の形を保つ。

    >>> vowels = 'aeiou'
    >>> print(len(vowels), cardinalize('vowel', len(vowels)))
    5 vowels
    >>> print(3, cardinalize('Wish', 3))
    3 Wishes
    """
    if count == 1:
        return unit_noun
    return pluralize(unit_noun)
```

```python:line-numbers=186 [原文]
def cardinalize(unit_noun, count):
    """Conditionally pluralizes a singular word *unit_noun* if
    *count* is not one, preserving case when possible.

    >>> vowels = 'aeiou'
    >>> print(len(vowels), cardinalize('vowel', len(vowels)))
    5 vowels
    >>> print(3, cardinalize('Wish', 3))
    3 Wishes
    """
    if count == 1:
        return unit_noun
    return pluralize(unit_noun)
```

:::

## 前提知識

- **単数形と複数形**: 1 つを表す形と、2 つ以上を表す形です。英語では、語尾に `s` などを付けて複数形にします。
- **`count == 1`**: 数が 1 かどうかを確かめる比較です。
- **`pluralize`**: 単語を複数形にする、同じ boltons の関数です。

## 何をしているか

### 1. 数が 1 なら、単語をそのまま返す

```python:line-numbers=196
    if count == 1:
        return unit_noun
```

数が 1 のときは、単数形がそのまま正しい形です。複数形にする処理をせずに、元の単語を返します。

### 2. それ以外なら、複数形にする

```python:line-numbers=198
    return pluralize(unit_noun)
```

数が 1 でなければ、`pluralize` で単語を複数形にします。ゼロや 2 以上のどの数でも、同じ分岐で処理されます。

## ここがすごい

### 数の判定と単語の変換を分けている

数を見る処理と、単語を変える処理を別の関数に分けています。`pluralize` は単語だけを扱うので、ほかの場面でも再利用できます。

### 例文が doctest になっている

docstring には、`5 vowels` や `3 Wishes` という実行例があります。例を実行すると、説明の内容が本当に正しいかを確かめられます。

### 1 つの条件だけで決まる

判定は `count == 1` だけです。0 や小数の数も、1 でなければ複数形になります。英語の「0 apples」のような言い方に合わせた、単純な決まりです。

## まとめ

- 数が 1 かどうかだけで、単語の形を決められる。
- 判定と変換を別の関数に分けると、部品として再利用しやすい。
- docstring の例を doctest で動かすと、説明が正しいかを確かめられる。
