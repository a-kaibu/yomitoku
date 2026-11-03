---
title: 複素数の共役を、虚部の符号を反転させて作る
description: Zig 標準ライブラリの複素数の conjugate。実部はそのまま、虚部だけを符号反転して返す。割り算や大きさの計算で使われる基本の操作。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [82, 87]
function: Complex.conjugate
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`conjugate` は、複素数の共役を返す関数です。共役は、虚部の符号だけを反対にした数です。たとえば `3 + 4i` の共役は `3 - 4i` です。

## コード

```zig:line-numbers=82
        pub fn conjugate(self: Self) Self {
            return Self{
                .re = self.re,
                .im = -self.im,
            };
        }
```

## 前提知識

- **複素数**: `a + bi` の形の数です。
- **共役**: 同じ実部を持ち、虚部の符号を反対にした数です。
- **共役の性質**: 数に共役を掛けると、結果は実数（大きさの 2 乗）になります。
- **符号の反転（`-`）**: 数の正負を入れ替える演算です。
- **`Self`**: 型の中で、自分自身の型を指す名前です。

## 何をしているか

### 1. 実部はそのまま

```zig:line-numbers=84
                .re = self.re,
```

実部は、変えずに `self.re` をそのまま入れます。

### 2. 虚部の符号を反転する

```zig:line-numbers=85
                .im = -self.im,
```

虚部には `-self.im` を入れて、符号だけを反対にします。これが共役です。

## ここがすごい

- **とても単純**: 符号を 1 つ変えるだけの操作です。計算の負担がほとんどありません。
- **割り算の土台**: 同じファイルの `div` や `reciprocal` は、この共役を使って式を作っています。
- **対称性の表現**: 共役は、複素数の平面で実軸に関して対称な点に対応します。
- **型が変わらない**: 結果は同じ `Self` 型です。

## まとめ

- `conjugate` は、実部をそのまま、虚部の符号だけを反転させた数を返します。
- 割り算や大きさの計算の、基本の部品です。
- 共役を掛けると、結果は実数になります。
