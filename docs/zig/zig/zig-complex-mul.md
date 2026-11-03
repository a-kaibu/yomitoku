---
title: 複素数の掛け算を、実部と虚部の式で展開して計算する
description: Zig 標準ライブラリの複素数の mul。(a+bi)(c+di) を展開した式で、実部は ac - bd、虚部は bc + ad として計算する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [62, 67]
function: Complex.mul
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`mul` は、2 つの複素数の掛け算を計算する関数です。複素数の掛け算は、実数の掛け算と違って、実部と虚部が混ざり合います。その式を、そのまま展開して書いています。

## コード

```zig:line-numbers=62
        pub fn mul(self: Self, other: Self) Self {
            return Self{
                .re = self.re * other.re - self.im * other.im,
                .im = self.im * other.re + self.re * other.im,
            };
        }
```

## 前提知識

- **複素数**: `a + bi` の形の数です。`i` は 2 乗すると -1 になる単位です。
- **展開**: `(a + bi)(c + di)` を、分配法則で広げることです。`i²` は `-1` に置き換えます。
- **`Complex(T)`**: 実部と虚部の型 `T` を指定して、複素数の型を作る関数です。
- **構造体のリテラル（`Self{ .re = ..., .im = ... }`）**: 名前付きの値を並べて、構造体を作る書き方です。
- **`Self`**: 型の中で、自分自身の型を指す名前です。

## 何をしているか

`(a + bi)(c + di)` を展開すると、次の式になります。

```
(a + bi)(c + di) = (ac - bd) + (bc + ad)i
```

`i² = -1` なので、`bd i²` は `-bd` になります。この式を、コードでは 2 つの項に分けて書いています。

### 1. 実部を計算する

```zig:line-numbers=64
                .re = self.re * other.re - self.im * other.im,
```

`self.re * other.re - self.im * other.im` は、`ac - bd` です。`i²` の符号が反転するので、引き算になります。

### 2. 虚部を計算する

```zig:line-numbers=65
                .im = self.im * other.re + self.re * other.im,
```

`self.im * other.re + self.re * other.im` は、`bc + ad` です。虚部は、両方の掛け算の和になります。

## ここがすごい

- **式がそのまま数学の形**: 展開した式を、ほぼそのまま書いています。数学の本の式を、コードで確かめやすい形です。
- **型が 1 つにまとまる**: 結果は `Self` 型で返るので、掛け算を繰り返すときも型の変換が要りません。
- **精度は型に任せる**: 計算はすべて `T` の型で行います。`f32` でも `f64` でも、同じ式を使えます。
- **割り算と対で読める**: 同じファイルの `div` は、この掛け算の逆の操作として、共役を使った式で書かれています。対で読むと理解が深まります。

## まとめ

- 複素数の掛け算は、`i² = -1` を使って展開すると、実部と虚部の式になります。
- 実部は `ac - bd`、虚部は `bc + ad` です。
- 同じ式を型 `T` で計算するので、精度は型で選べます。
