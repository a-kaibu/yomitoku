---
title: 「~n & (n-1)」で、末尾の 0 ビットだけを 1 にして数える
description: ipaddress の内部関数 _count_righthand_zero_bits は、整数の右側（下位側）に並ぶ 0 のビットの数を数える。n - 1 と否定の論理積を使うと、末尾の 0 だけが 1 として残る。IPv4 や IPv6 のネットワーク範囲の計算に使われる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/ipaddress.py
lines: [181, 194]
function: _count_righthand_zero_bits
difficulty: 3
format: 2
tags: [ビット演算, 低レイヤ, 数値計算]
---

## ひとことで

`_count_righthand_zero_bits(number, bits)` は、整数を 2 進数で書いたとき、**右の端から連続する 0 の数** を数える関数です。
`number = 8`（2 進数で `1000`）なら `3` を返します。`bits` は数える上限で、それを超えることはありません。

## コード

::: code-group

```python:line-numbers=181 [日本語訳]
def _count_righthand_zero_bits(number, bits):
    """右側（下位側）にある 0 のビットの数を数える。

    Args:
        number: an integer.
        bits: maximum number of bits to count.

    Returns:
        The number of zero bits on the right hand side of the number.

    """
    if number == 0:
        return bits
    return min(bits, (~number & (number-1)).bit_length())
```

```python:line-numbers=181 [原文]
def _count_righthand_zero_bits(number, bits):
    """Count the number of zero bits on the right hand side.

    Args:
        number: an integer.
        bits: maximum number of bits to count.

    Returns:
        The number of zero bits on the right hand side of the number.

    """
    if number == 0:
        return bits
    return min(bits, (~number & (number-1)).bit_length())
```

:::

`bit_length()` は、整数を 2 進数で書いたときの桁数を返す整数のメソッドです。

## 前提知識

- **2 進数の桁**: 右から 0 番目、1 番目……と数えるビットです。`8` は `1000` で、右の 3 桁が 0 です。
- **補数 `~n`**: 各ビットを反転させた数です。`~8` は、`8` の 0 と 1 をすべて入れ替えたものになります。
- **`n - 1`**: 最も右の 1 のビットを 0 にし、その右側の 0 をすべて 1 にします。例えば `1000 - 1 = 0111` です。
- **ビットの論理積 `&`**: 両方が 1 の桁だけを 1 にします。

## 何をしているか

### 1. 0 のときは、上限をそのまま返す

```python:line-numbers=192
    if number == 0:
        return bits
```

`number` が 0 なら、すべてのビットが 0 です。数えられるのは `bits` 個までなので、その数を返します。

### 2. 末尾の 0 だけを 1 として取り出す

```python:line-numbers=194
    return min(bits, (~number & (number-1)).bit_length())
```

`~number & (number-1)` は、末尾に並ぶ 0 のビットだけを 1 にした数になります。例えば `number = 12`（`1100`）なら、`~12 & 11` は `0011` で、値は `3` です。`bit_length()` は、その最も上の 1 の桁数を返すので、末尾の 0 の数（ここでは 2）になります。

### 3. 上限を超えないようにする

```python:line-numbers=194
    return min(bits, (~number & (number-1)).bit_length())
```

`min(bits, ...)` で、上限より多くは数えません。ネットワークの桁数を超えないように、呼ぶ側が上限を渡します。

## ここがすごい

### 1 行で末尾のビットを取り出す

ビットを 1 つずつ見て数えるループを書く代わりに、`n - 1` と `~n` の組み合わせで、末尾の 0 だけを 1 として取り出しています。ビットの計算に慣れた人が使う、定番の技です。

### 上限を引数で渡す

IPv4 は 32 ビット、IPv6 は 128 ビットなど、桁数はアドレスの種類で変わります。上限を `bits` として渡すことで、同じ関数を両方に使えます。

### 0 の場合を特別扱いする

0 では `n - 1` が負の数になり、ビットの計算が意味を失います。そのため、先に 0 を別に扱っています。

## まとめ

- 末尾の 0 を数えるには、`~n & (n-1)` の結果の桁数を調べる。
- 0 のような特別な値は、計算の前に分けておく。
- 上限を引数で渡すと、桁数の違う値にも同じ関数を使える。
