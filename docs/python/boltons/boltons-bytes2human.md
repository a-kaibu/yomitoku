---
title: バイト数を、K や M をつけた読みやすい表記に変える
description: boltons.strutils.bytes2human は、バイト数の整数を 1024 単位で K、M、G などに換算して表示する。小数点以下の桁数を指定でき、単位は丸めた後の値で決める。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [555, 581]
function: bytes2human
difficulty: 2
format: 2
tags: [数値計算, 文字列処理, 可読性]
---

## ひとことで

`bytes2human(nbytes, ndigits=0)` は、**バイト数を、K（キロ）、M（メガ）などの単位つきの読みやすい文字列にする** 関数です。
`bytes2human(128991)` は `'126K'`、`bytes2human(1024 ** 8)` は `'1Y'` を返します。単位は 1024 倍ごとに変わります。

## コード

::: code-group

```python:line-numbers=555 [日本語訳]
def bytes2human(nbytes, ndigits=0):
    """*nbytes* の整数を、人が読みやすい表記（K、M など）に変える。
    *ndigits* to control how many digits after the decimal point
    should be shown (default ``0``).

    >>> bytes2human(128991)
    '126K'
    >>> bytes2human(100001221)
    '95M'
    >>> bytes2human(0, 2)
    '0.00B'
    >>> bytes2human(1024)
    '1K'
    >>> bytes2human(1024 ** 8)
    '1Y'
    """
    if isinstance(nbytes, float) and not math.isfinite(nbytes):
        raise ValueError(f'expected a finite number of bytes, not {nbytes!r}')
    abs_bytes = abs(nbytes)
    # 丸めた後で単位を選ぶ。たとえば 1023.99K は 1M と表示されるようにする
    for (size, symbol), (next_size, next_symbol) in _SIZE_RANGES:
        if round(abs_bytes / size, ndigits) < 1024:
            break
    hnbytes = float(nbytes) / size
    return '{hnbytes:.{ndigits}f}{symbol}'.format(hnbytes=hnbytes,
                                                  ndigits=ndigits,
                                                  symbol=symbol)
```

```python:line-numbers=555 [原文]
def bytes2human(nbytes, ndigits=0):
    """Turns an integer value of *nbytes* into a human readable format. Set
    *ndigits* to control how many digits after the decimal point
    should be shown (default ``0``).

    >>> bytes2human(128991)
    '126K'
    >>> bytes2human(100001221)
    '95M'
    >>> bytes2human(0, 2)
    '0.00B'
    >>> bytes2human(1024)
    '1K'
    >>> bytes2human(1024 ** 8)
    '1Y'
    """
    if isinstance(nbytes, float) and not math.isfinite(nbytes):
        raise ValueError(f'expected a finite number of bytes, not {nbytes!r}')
    abs_bytes = abs(nbytes)
    # pick the unit after rounding, so e.g. 1023.99K displays as 1M
    for (size, symbol), (next_size, next_symbol) in _SIZE_RANGES:
        if round(abs_bytes / size, ndigits) < 1024:
            break
    hnbytes = float(nbytes) / size
    return '{hnbytes:.{ndigits}f}{symbol}'.format(hnbytes=hnbytes,
                                                  ndigits=ndigits,
                                                  symbol=symbol)
```

:::

`_SIZE_RANGES` は、単位の名前（B、K、M など）と、その大きさの組の並びです。

## 前提知識

- **1024 単位**: コンピュータのメモリやファイルサイズでは、1 K = 1024 バイトとして数えることが多いです。
- **`abs`**: 絶対値です。負のバイト数でも、大きさで単位を決められます。
- **`round(x, n)`**: 小数点以下 `n` 桁に丸めます。
- **書式指定 `{:.Nf}`**: 小数点以下 `N` 桁の固定小数点で表示します。

## 何をしているか

### 1. 無限大や NaN を拒否する

```python:line-numbers=571
    if isinstance(nbytes, float) and not math.isfinite(nbytes):
        raise ValueError(f'expected a finite number of bytes, not {nbytes!r}')
```

浮動小数点で無限大や NaN が来ると、単位が決められないので、`ValueError` にします。

### 2. 丸めた後の値で単位を選ぶ

```python:line-numbers=573
    abs_bytes = abs(nbytes)
    # 丸めた後で単位を選ぶ。たとえば 1023.99K は 1M と表示されるようにする
    for (size, symbol), (next_size, next_symbol) in _SIZE_RANGES:
        if round(abs_bytes / size, ndigits) < 1024:
            break
```

単位の候補を順に見て、丸めた値が 1024 未満になる単位を選びます。コメントにあるように、丸めた後で判定するので、`1023.99K` のような値が `1M` と表示されます。

### 3. 選んだ単位で割って、文字列にする

```python:line-numbers=578
    hnbytes = float(nbytes) / size
    return '{hnbytes:.{ndigits}f}{symbol}'.format(hnbytes=hnbytes,
                                                  ndigits=ndigits,
                                                  symbol=symbol)
```

選んだ単位の大きさで割り、指定した桁数の小数と単位の記号をつなげて返します。

## ここがすごい

### 丸めの境目を正しく扱う

`1023.99K` を小数点以下 0 桁で表すと `1024K` になり、単位の `K` の表示としては大きすぎます。丸めた後で単位を決めると、`1M` と正しく表示されます。コメントは、この境目を明示しています。

### 単位の候補を表で持つ

単位の名前と大きさを `_SIZE_RANGES` という表にまとめています。単位を増やしたいときは、表に 1 行足すだけで済みます。

### 不正な値を早く止める

無限大や NaN は、表示できる形がありません。割る前に確認して、わかりやすいメッセージのエラーにしています。

## まとめ

- 単位つきの表示は、単位の表を順に見て、最初に収まるものを選ぶと書ける。
- 丸めの境目では、丸めた後の値で判定すると表示が正しくなる。
- 不正な入力は、計算の前に確認して止める。
