---
title: 色相を 6 つの区間に分け、3 つの中間値で RGB を組み立てる
description: colorsys.hsv_to_rgb は、色相・彩度・明度（HSV）の色を赤・緑・青（RGB）に変える。色相を 6 区間に分け、区間ごとに RGB の並びを入れ替えるだけの分岐で求めている。
language: python
project: CPython
repo: https://github.com/python/cpython
license: PSF-2.0
copyright: Copyright (c) 2001 Python Software Foundation; All Rights Reserved
commit: "2f2051287f0c24c7bb99a7f570e5a6178ba1f8de"
file: Lib/colorsys.py
lines: [145, 165]
function: hsv_to_rgb
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`hsv_to_rgb(h, s, v)` は、**色相 `h`・彩度 `s`・明度 `v`（それぞれ 0 から 1 の小数）** を、赤 `r`・緑 `g`・青 `b` の 3 つの値に変える関数です。
`hsv_to_rgb(0.0, 1.0, 1.0)` は `(1.0, 0.0, 0.0)`、つまり純粋な赤を返します。

## コード

::: code-group

```python:line-numbers=145 [日本語訳]
def hsv_to_rgb(h, s, v):
    if s == 0.0:
        return v, v, v
    i = int(h*6.0) # XXX int() は小数部を切り捨てると仮定している
    f = (h*6.0) - i
    p = v*(1.0 - s)
    q = v*(1.0 - s*f)
    t = v*(1.0 - s*(1.0-f))
    i = i%6
    if i == 0:
        return v, t, p
    if i == 1:
        return q, v, p
    if i == 2:
        return p, v, t
    if i == 3:
        return p, q, v
    if i == 4:
        return t, p, v
    if i == 5:
        return v, p, q
```

```python:line-numbers=145 [原文]
def hsv_to_rgb(h, s, v):
    if s == 0.0:
        return v, v, v
    i = int(h*6.0) # XXX assume int() truncates!
    f = (h*6.0) - i
    p = v*(1.0 - s)
    q = v*(1.0 - s*f)
    t = v*(1.0 - s*(1.0-f))
    i = i%6
    if i == 0:
        return v, t, p
    if i == 1:
        return q, v, p
    if i == 2:
        return p, v, t
    if i == 3:
        return p, q, v
    if i == 4:
        return t, p, v
    if i == 5:
        return v, p, q
```

:::

## 前提知識

- **HSV**: 色を「色み（色相）」「鮮やかさ（彩度）」「明るさ（明度）」で表す方法です。色相は 0 から 1 を一周として、赤、黄、緑、水色、青、紫と回ります。
- **RGB**: 赤、緑、青の強さで色を表す方法です。ディスプレイが色を出す仕組みに近い表し方です。
- **彩度 0**: 色みがなく、灰色です。赤・緑・青が同じ値になります。
- **`int(x)`**: 小数を整数にします。コメントにあるとおり、正の数では小数部が切り捨てられます。

## 何をしているか

### 1. 灰色の場合

```python:line-numbers=146
    if s == 0.0:
        return v, v, v
```

彩度が 0 なら、色みがありません。明度の値を、赤・緑・青すべてに入れて返します。

### 2. 色相を 6 区間に分ける

```python:line-numbers=148
    i = int(h*6.0) # XXX int() は小数部を切り捨てると仮定している
    f = (h*6.0) - i
    p = v*(1.0 - s)
    q = v*(1.0 - s*f)
    t = v*(1.0 - s*(1.0-f))
```

`h*6` で、色相を 0 から 6 の範囲に広げます。整数部 `i` が「どの区間か」を表し、小数部 `f` が「区間の中でどこまで進んだか」を表します。`p`、`q`、`t` は、その区間で使う中間の明るさです。

### 3. 区間ごとに並びを選ぶ

```python:line-numbers=153
    i = i%6
    if i == 0:
        return v, t, p
    if i == 1:
        return q, v, p
    if i == 2:
        return p, v, t
    if i == 3:
        return p, q, v
    if i == 4:
        return t, p, v
    if i == 5:
        return v, p, q
```

`i % 6` で区間の番号を 0 から 5 に戻し、区間ごとに `(r, g, b)` の並びを返します。たとえば区間 0 は、赤が一番強く、青が一番弱い順です。

## ここがすごい

### 6 つの区間が「表」になっている

色相の変化は、赤から黄、緑、水色、青、紫、赤へと、6 つの区間を順に通ります。各区間では、3 つの値のうち 1 つが上がり、1 つが下がり、1 つは最大か最小のままです。その並びを、`if` の 6 つの分岐で書き並べています。

### 中間値を先に 3 つ作る

`p`、`q`、`t` を先に計算しておくと、区間ごとの分岐では並べ替えるだけで済みます。計算と並べ替えが分かれているので、読みやすくなっています。

### 逆の変換と対になっている

同じファイルの `rgb_to_hsv` は、この逆の変換です。どちらも、区間の考え方と中間値の作り方が対応しています。

## まとめ

- 色相は 6 つの区間に分けると、区間ごとの規則で RGB が決まる。
- 中間値を先に作ると、分岐の中身が「並べ替え」だけになる。
- 色の変換は、逆向きの関数と組にして読むと理解しやすい。
