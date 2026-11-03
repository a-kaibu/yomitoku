---
title: 複素数の割り算を、分母に共役を掛ける式で計算する
description: Zig 標準ライブラリの複素数の div。分子と分母に共役を掛けて、分母を実数にしてから割る。割る数の大きさを 2 乗した値で割るのがポイント。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [70, 79]
function: Complex.div
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`div` は、複素数を別の複素数で割る関数です。複素数は、実部と虚部の 2 つの数の組です。割り算の結果も、同じように実部と虚部を持つ数になります。

## コード

```zig:line-numbers=70
        pub fn div(self: Self, other: Self) Self {
            const re_num = self.re * other.re + self.im * other.im;
            const im_num = self.im * other.re - self.re * other.im;
            const den = other.re * other.re + other.im * other.im;

            return Self{
                .re = re_num / den,
                .im = im_num / den,
            };
        }
```

## 前提知識

- **複素数**: `a + bi` の形の数です。`a` が実部、`b` が虚部、`i` は 2 乗すると -1 になる単位です。
- **共役**: 虚部の符号を反対にした数です。`a + bi` の共役は `a - bi` です。
- **共役の性質**: 複素数に共役を掛けると、結果は実数（`a² + b²`）になります。
- **`Complex(T)`**: `T` は実部と虚部の型です。`f32` や `f64` などを指定して使います。
- **`Self`**: 型の中で、自分自身の型を表す名前です。

## 何をしているか

`x / y` を計算するには、分母 `y` の共役を分子と分母に掛けます。すると、分母は実数になります。式にすると次のとおりです。

```
x / y = (x * conj(y)) / (y * conj(y))
```

### 1. 分子と分母を作る

```zig:line-numbers=71
            const re_num = self.re * other.re + self.im * other.im;
            const im_num = self.im * other.re - self.re * other.im;
            const den = other.re * other.re + other.im * other.im;
```

`re_num` と `im_num` は、`self` と `other` の共役の積の実部と虚部です。`den` は `other` の絶対値の 2 乗で、実数になります。

### 2. 分母で割って返す

```zig:line-numbers=75
            return Self{
                .re = re_num / den,
                .im = im_num / den,
            };
```

最後に、`re_num` と `im_num` をそれぞれ `den` で割って、結果の実部と虚部にします。割り算は実数同士の 2 回だけです。

## ここがすごい

- **実数の割り算だけで済む**: 分母を実数にしたので、割り算は実数同士の割り算 2 回で済みます。複素数の逆数を別に求める必要がありません。
- **分子を一度に作る**: 実部と虚部の式を、掛け算と足し引きだけで書いています。途中の値を別の型に変えたりしません。
- **`reciprocal` と同じ考え方**: 同じファイルの `reciprocal` も、`self.re * self.re + self.im * self.im` で割る式を使っています。割る数の大きさを 2 乗で求める、という考え方が共通です。

## まとめ

- 複素数の割り算は、分母に共役を掛けて実数にしてから行います。
- 分母は「割る数の大きさの 2 乗」になります。
- 同じファイルの `mul`、`reciprocal` と組み合わせて使える、小さな部品です。
