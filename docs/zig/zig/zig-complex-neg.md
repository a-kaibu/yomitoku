---
title: 複素数の符号を、実部と虚部の両方で反転させる
description: Zig 標準ライブラリの複素数の neg。実部と虚部の両方の符号を反転させて、元の数の負の数を返す。加法の逆元にあたる基本の操作。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [90, 95]
function: Complex.neg
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`neg` は、複素数の負の数を返す関数です。実部と虚部の両方の符号を反対にします。たとえば `1 + 2i` の負の数は `-1 - 2i` です。

## コード

```zig:line-numbers=90
        pub fn neg(self: Self) Self {
            return Self{
                .re = -self.re,
                .im = -self.im,
            };
        }
```

## 前提知識

- **負の数（加法の逆元）**: 数に足すと 0 になる数です。複素数では、実部と虚部の両方を反転させます。
- **複素数の和**: 2 つの複素数の和は、実部どうし、虚部どうしを足したものです。
- **`-x`**: 数の符号を反転する単項演算子です。
- **共役との違い**: 共役は虚部だけを反転し、負の数は両方を反転します。
- **`Self`**: 型の中で、自分自身の型を指す名前です。

## 何をしているか

### 1. 実部の符号を反転する

```zig:line-numbers=92
                .re = -self.re,
```

`-self.re` で、実部の符号を反対にします。

### 2. 虚部の符号を反転する

```zig:line-numbers=93
                .im = -self.im,
```

`-self.im` で、虚部の符号を反対にします。2 つを合わせると、負の数になります。

## ここがすごい

- **単純な式**: 2 つの符号反転だけなので、計算の負担がほとんどありません。
- **和との関係**: `z + neg(z)` は 0 になります。減算は、負の数を足すことで書けます。
- **共役と対**: 同じファイルの `conjugate` は虚部だけを反転します。2 つの違いが、対になって分かりやすいです。
- **型が変わらない**: 結果は `Self` 型です。

## まとめ

- `neg` は、実部と虚部の両方の符号を反転させます。
- 負の数を足すと 0 になります。
- 虚部だけを反転する `conjugate` と区別します。
