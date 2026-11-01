---
title: 空でない列から、ランダムに 1 つの要素を選ぶ
description: random.choice は、空でない列から 1 つの要素を同じ確率で選んで返す。長さを使って 0 から長さ未満の乱数の位置を作り、その位置の要素を返す。空の列では IndexError を出す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [347, 354]
function: Random.choice
difficulty: 1
format: 2
tags: [乱数, 防御的プログラミング]
---

## ひとことで

`choice(seq)` は、**空でない列の中から、ランダムに 1 つの要素を選んで返す** メソッドです。
`choice(['赤', '青', '緑'])` は、3 つのどれかを同じ確率で返します。

## コード

::: code-group

```python:line-numbers=347 [日本語訳]
    def choice(self, seq):
        """空でない列から、ランダムに 1 つの要素を選ぶ。"""

        # NumPy への配慮として、"if not seq" は使わない
        # bool(numpy.array()) は ValueError を出すため。
        if not len(seq):
            raise IndexError('Cannot choose from an empty sequence')
        return seq[self._randbelow(len(seq))]
```

```python:line-numbers=347 [原文]
    def choice(self, seq):
        """Choose a random element from a non-empty sequence."""

        # As an accommodation for NumPy, we don't use "if not seq"
        # because bool(numpy.array()) raises a ValueError.
        if not len(seq):
            raise IndexError('Cannot choose from an empty sequence')
        return seq[self._randbelow(len(seq))]
```

:::

## 前提知識

- **一様な乱数**: どの値も同じ確率で出る乱数です。
- **添字（index）**: 列の中の位置を表す数です。`0` から数えます。
- **`_randbelow(n)`**: `0` 以上 `n` 未満の整数を、同じ確率で返す内部の関数です。
- **`IndexError`**: 添字が範囲の外にあるときに出るエラーです。

## 何をしているか

### 1. 空の列を例外で止める

```python:line-numbers=352
        if not len(seq):
            raise IndexError('Cannot choose from an empty sequence')
```

列の長さが 0 なら、選べる要素がないので、`IndexError` を出します。エラーの文は、何が問題かを分かりやすく伝えます。

### 2. 位置をランダムに決めて、要素を返す

```python:line-numbers=354
        return seq[self._randbelow(len(seq))]
```

`len(seq)` より小さい整数を `_randbelow` で選び、その位置の要素を返します。位置がどれも同じ確率なので、要素も同じ確率で選ばれます。

## ここがすごい

### 乱数の範囲を、列の長さに合わせる

`random()` に長さを掛けて切り捨てる方法もありますが、この関数は、整数を直接選ぶ内部の仕組みを使います。範囲の端に偏りが出ないように作られています。

### 真偽値の判定を避ける

コメントにあるように、`if not seq` とは書いていません。NumPy の配列は、真偽値に変換するとエラーになるため、`len` で長さを比べています。

### 空の列を明示的に扱う

空の列で、どうして失敗するかを、先に例外として出しています。後の処理で、わかりにくいエラーになるのを防いでいます。

## まとめ

- 空でない列なら、長さ未満の乱数の位置を選ぶと、同じ確率で要素が選べる。
- 真偽値の判定を避けると、NumPy の配列などでも安全に使える。
- 空の列は、分かりやすい例外で止めると、問題の原因が見つけやすい。
