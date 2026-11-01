---
title: 最大と最小の差から、明るさ・彩度・色相を一度に求める
description: colorsys.rgb_to_hls は、赤・緑・青の値を色相・明るさ・彩度（HLS）に変える。最大と最小の値から明るさを求め、どの色が最大かで色相の計算式を選んでいる。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/colorsys.py
lines: [75, 97]
function: rgb_to_hls
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`rgb_to_hls(r, g, b)` は、赤・緑・青の値（0 から 1）を、**色相 `h`・明るさ `l`・彩度 `s`** の 3 つに変える関数です。
`rgb_to_hls(1.0, 0.0, 0.0)` は `(0.0, 0.5, 1.0)` を返します。純粋な赤は、色相 0、明るさ 0.5、彩度 1 です。

## コード

::: code-group

```python:line-numbers=75 [日本語訳]
def rgb_to_hls(r, g, b):
    maxc = max(r, g, b)
    minc = min(r, g, b)
    sumc = (maxc+minc)
    rangec = (maxc-minc)
    l = sumc/2.0
    if minc == maxc:
        return 0.0, l, 0.0
    if l <= 0.5:
        s = rangec / sumc
    else:
        s = rangec / (2.0-maxc-minc)  # 常に 2.0-sumc とは限らない（gh-106498）。
    rc = (maxc-r) / rangec
    gc = (maxc-g) / rangec
    bc = (maxc-b) / rangec
    if r == maxc:
        h = bc-gc
    elif g == maxc:
        h = 2.0+rc-bc
    else:
        h = 4.0+gc-rc
    h = (h/6.0) % 1.0
    return h, l, s
```

```python:line-numbers=75 [原文]
def rgb_to_hls(r, g, b):
    maxc = max(r, g, b)
    minc = min(r, g, b)
    sumc = (maxc+minc)
    rangec = (maxc-minc)
    l = sumc/2.0
    if minc == maxc:
        return 0.0, l, 0.0
    if l <= 0.5:
        s = rangec / sumc
    else:
        s = rangec / (2.0-maxc-minc)  # Not always 2.0-sumc: gh-106498.
    rc = (maxc-r) / rangec
    gc = (maxc-g) / rangec
    bc = (maxc-b) / rangec
    if r == maxc:
        h = bc-gc
    elif g == maxc:
        h = 2.0+rc-bc
    else:
        h = 4.0+gc-rc
    h = (h/6.0) % 1.0
    return h, l, s
```

:::

## 前提知識

- **HLS**: 色相（Hue）、明るさ（Lightness）、彩度（Saturation）で色を表す方法です。HSV と似ていますが、明るさの決め方が違います。
- **最大値と最小値**: 赤・緑・青のうち一番強いものと、一番弱いものです。この 2 つで、明るさと彩度が決まります。
- **`maxc`、`minc`、`rangec`**: それぞれ最大値、最小値、その差です。コードでは、この名前で使い回しています。
- **色相は 0 から 1**: 一周を 1 として、どの色相かを表します。

## 何をしているか

### 1. 明るさを求める

```python:line-numbers=76
    maxc = max(r, g, b)
    minc = min(r, g, b)
    sumc = (maxc+minc)
    rangec = (maxc-minc)
    l = sumc/2.0
```

明るさ `l` は、最大と最小の平均です。`sumc` と `rangec` は、後の計算に何度も使うので、先に作っておきます。

### 2. 無彩色（灰色）の場合

```python:line-numbers=81
    if minc == maxc:
        return 0.0, l, 0.0
```

最大と最小が同じなら、色みがありません。色相と彩度は 0 とし、明るさだけを返します。

### 3. 彩度を求める

```python:line-numbers=83
    if l <= 0.5:
        s = rangec / sumc
    else:
        s = rangec / (2.0-maxc-minc)  # 常に 2.0-sumc とは限らない（gh-106498）。
```

明るさが 0.5 以下なら `rangec / sumc`、それより明るければ `rangec / (2.0-maxc-minc)` で彩度を求めます。どちらも、色の鮮やかさを 0 から 1 で表した値です。

### 4. 色相を求める

```python:line-numbers=87
    rc = (maxc-r) / rangec
    gc = (maxc-g) / rangec
    bc = (maxc-b) / rangec
    if r == maxc:
        h = bc-gc
    elif g == maxc:
        h = 2.0+rc-bc
    else:
        h = 4.0+gc-rc
    h = (h/6.0) % 1.0
```

各成分が最大値からどれだけ離れているかを `rc`、`gc`、`bc` で表します。どの色が最大かによって、色相を計算する式を変えます。最後に `% 1.0` で 0 から 1 の範囲に収めます。

## ここがすごい

### 最大と最小だけで決める

色相、明るさ、彩度は、どれも最大値と最小値から求められます。3 つの値を全部比べ直す必要はありません。

### 明るさで式を分ける

彩度の式は、明るさが 0.5 を越えると形が変わります。コードのコメントは、この分岐が数値の誤差を防ぐために必要だと説明しています。

### 色相を 3 つの場合に分ける

どの色が最大かで、色相の式は 3 通りに分かれます。それぞれの式は、色が 1 周するうちのどの区間にいるかを表しています。

## まとめ

- 明るさは最大と最小の平均、彩度は両者の差を基準に求める。
- 最大の色がどれかで、色相の式を分けると計算が整理される。
- 数値の誤差を避けるための式の分岐は、コメントで理由が書かれている。
