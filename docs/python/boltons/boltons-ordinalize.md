---
title: 数字に 1st、2nd、3rd、4th の接尾辞を付ける
description: boltons の ordinalize は、数の末尾の数字から、1st、2nd、3rd、4th のような序数の接尾辞を決めて付ける。11 から 13 だけは例外として th を使う。数字で終わらない文字列は、そのまま返す。
language: python
project: boltons
repo: https://github.com/mahmoud/boltons
license: BSD-3-Clause
copyright: Copyright (c) 2013, Mahmoud Hashemi
commit: "d31d821d56c8f7756af9c30a864077f2e5855321"
file: boltons/strutils.py
lines: [150, 183]
function: ordinalize
difficulty: 2
format: 2
tags: [文字列処理, 可読性]
---

## ひとことで

`ordinalize(number)` は、**数に `1st`、`2nd`、`3rd`、`4th` のような序数の接尾辞を付ける** 関数です。
`ordinalize(1515)` は `1515th` を返します。末尾の数字で接尾辞が決まるので、大きな数でも使えます。

## コード

::: code-group

```python:line-numbers=150 [日本語訳]
def ordinalize(number, ext_only=False):
    """*number* を序数の形に変える。例えば 1st、2nd、
    3rd、4th など。末尾の文字が数字でなければ、値を変えずに返す。
    文字列の値をそのまま返す。

    引数:
        number (int または str): 序数にする数。
        ext_only (bool): 接尾辞だけを返すかどうか。既定値は ``False``。

    >>> print(ordinalize(1))
    1st
    >>> print(ordinalize(3694839230))
    3694839230th
    >>> print(ordinalize('hi'))
    hi
    >>> print(ordinalize(1515))
    1515th
    """
    numstr, ext = str(number), ''
    if numstr and numstr[-1] in string.digits:
        try:
            # まず 11 から 19 の場合を確かめる
            if numstr[-2] == '1':
                ext = 'th'
            else:
                # それ以外の場合
                ext = _ORDINAL_MAP.get(numstr[-1], 'th')
        except IndexError:
            # 1 桁の数（上の [-2] の判定で、ここに来る）
            ext = _ORDINAL_MAP.get(numstr[-1], 'th')
    if ext_only:
        return ext
    else:
        return numstr + ext
```

```python:line-numbers=150 [原文]
def ordinalize(number, ext_only=False):
    """Turns *number* into its cardinal form, i.e., 1st, 2nd,
    3rd, 4th, etc. If the last character isn't a digit, it returns the
    string value unchanged.

    Args:
        number (int or str): Number to be cardinalized.
        ext_only (bool): Whether to return only the suffix. Default ``False``.

    >>> print(ordinalize(1))
    1st
    >>> print(ordinalize(3694839230))
    3694839230th
    >>> print(ordinalize('hi'))
    hi
    >>> print(ordinalize(1515))
    1515th
    """
    numstr, ext = str(number), ''
    if numstr and numstr[-1] in string.digits:
        try:
            # first check for teens
            if numstr[-2] == '1':
                ext = 'th'
            else:
                # all other cases
                ext = _ORDINAL_MAP.get(numstr[-1], 'th')
        except IndexError:
            # single digit numbers (will reach here based on [-2] above)
            ext = _ORDINAL_MAP.get(numstr[-1], 'th')
    if ext_only:
        return ext
    else:
        return numstr + ext
```

:::

## 前提知識

- **序数**: 順番を表す数の形です。英語では `1st`、`2nd`、`3rd`、`4th` のように書きます。
- **末尾の数字**: 数の一番後ろの 1 桁です。接尾辞は、この数字で決まります。
- **例外（11 から 13）**: `11th`、`12th`、`13th` のように、末尾が 1、2、3 でも `th` を付ける例外です。
- **`str.isdigit` の代わり**: ここでは `string.digits` に含まれるかどうかで、数字を判定しています。

## 何をしているか

### 1. 末尾が数字かを確かめる

```python:line-numbers=168
    numstr, ext = str(number), ''
    if numstr and numstr[-1] in string.digits:
```

数を文字列に変えて、末尾が数字かを見ます。数字でなければ、接尾辞を付けずに、文字列をそのまま返します。

### 2. 11 から 19 の場合を先に判定する

```python:line-numbers=172
            if numstr[-2] == '1':
                ext = 'th'
            else:
```

末尾の 1 桁の前が `1` なら、`th` を使います。`11`、`12`、`13` などはこの規則で `th` になります。

```python:line-numbers=176
                ext = _ORDINAL_MAP.get(numstr[-1], 'th')
```

それ以外は、末尾の数字を表 `_ORDINAL_MAP` で引きます。表にない数字（0、4 から 9）は、`th` が既定値になります。

### 3. 1 桁の数字の場合

```python:line-numbers=179
            ext = _ORDINAL_MAP.get(numstr[-1], 'th')
```

1 桁の数には、前の 1 桁がありません。`[-2]` を見ると `IndexError` になるので、その例外を捕まえて、末尾の数字だけで決めます。

## ここがすごい

### 例外の規則を先に置く

「11 から 13 は `th`」という例外を、最初の分岐で扱っています。残りの規則は、末尾の 1 桁だけで決まります。

### 1 桁の数を例外で扱う

1 桁の数では、前の桁を見ようとすると失敗します。その失敗を `except` で受け止めて、末尾の数字だけで判定する、という流れになっています。

### 数字かどうかを確かめてから変換する

数字でない文字列を渡しても、例外にならずに、そのまま返ります。入力の形が違っても、安全に使えます。

## まとめ

- 序数の接尾辞は、末尾の数字と、11 から 13 の例外で決まる。
- 1 桁の数の例外は、`try` と `except` で末尾の数字だけの判定に切り替える。
- 数字で終わらない入力は、値を変えずに返すので安全に使える。
