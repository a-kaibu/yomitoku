---
title: 両端を含む範囲から、整数の乱数を 1 つ返す
description: random.randint(a, b) は、a 以上 b 以下の整数を一様な確率で返す。0 から b-a までの乱数に a を足すだけで実装されている。範囲が空なら ValueError を出す。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/random.py
lines: [335, 342]
function: Random.randint
difficulty: 1
format: 2
tags: [乱数, 標準ライブラリ, 数値計算]
---

## ひとことで

`randint(a, b)` は、**`a` 以上 `b` 以下** の整数を 1 つ返す関数です。
`randint(1, 6)` は、サイコロの目 `1` から `6` のどれかを、同じ確率で返します。両端の `b` も含まれる点に注意してください。

## コード

::: code-group

```python:line-numbers=335 [日本語訳]
    def randint(self, a, b):
        """範囲 [a, b] の乱数整数を返す。両端の値も含む。
        """
        a = _index(a)
        b = _index(b)
        if b < a:
            raise ValueError(f"empty range in randint({a}, {b})")
        return a + self._randbelow(b - a + 1)
```

```python:line-numbers=335 [原文]
    def randint(self, a, b):
        """Return random integer in range [a, b], including both end points.
        """
        a = _index(a)
        b = _index(b)
        if b < a:
            raise ValueError(f"empty range in randint({a}, {b})")
        return a + self._randbelow(b - a + 1)
```

:::

`_index` は、渡された値を整数に直す関数です。`_randbelow` は、`0` 以上 `n` 未満の整数を一様な確率で返す内部関数です。

## 前提知識

- **両端を含む範囲**: `randint(1, 6)` の `6` も出ます。Python の `range(1, 6)` は `6` を含まないので、混同しやすい点です。
- **`_randbelow(n)`**: `0` から `n-1` までの整数を、偏りなく選びます。
- **`ValueError`**: 値の種類は正しいが、中身が不正なときに投げられる例外です。

## 何をしているか

### 1. 両端を整数にそろえる

```python:line-numbers=338
        a = _index(a)
        b = _index(b)
```

`_index` で、`a` と `b` を整数にします。小数や整数に似た別の型でも、整数として扱えるようになります。

### 2. 範囲が空でないか確かめる

```python:line-numbers=340
        if b < a:
            raise ValueError(f"empty range in randint({a}, {b})")
```

`b < a` なら、どの整数も範囲に入らないので、エラーにします。

### 3. 件数を数えて、足す

```python:line-numbers=342
        return a + self._randbelow(b - a + 1)
```

`b - a + 1` は、範囲に入る整数の個数です。`_randbelow` で `0` から `個数 - 1` の乱数を作り、それに `a` を足せば、`a` から `b` までの整数になります。

## ここがすごい

### 件数で考えると、偏りがない

範囲に入る整数の個数だけを乱数で選び、あとで `a` を足すので、どの整数も同じ確率で出ます。個数を先に数えてから変換するので、計算の手順で端の値が不利になることもありません。

### 型を整数にそろえてから比べる

`_index` を通すので、`b < a` の比較が確実に整数どうしで行われます。引数が不正なら、乱数を作る前にエラーになります。

### 例外メッセージに値を入れる

`empty range in randint(3, 1)` のように、どの引数で失敗したかが分かる文章を作っています。エラーの原因が、その場で読めます。

## まとめ

- 両端を含む範囲は、「個数を数えて、オフセットを足す」と作れる。
- 比べる前に型をそろえると、不正な入力を早く見つけられる。
- 範囲の端を含むかどうかは、関数ごとに違うので確認が必要。
