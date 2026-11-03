---
title: 複素数の逆数を、共役を割る式で求める
description: Zig 標準ライブラリの複素数の reciprocal。大きさの 2 乗で、実部を割り、虚部の符号を反転させて割る。1 を割る割り算を、直接の式で計算する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [106, 112]
function: Complex.reciprocal
difficulty: 2
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`reciprocal` は、複素数の逆数（1 をその数で割った値）を返す関数です。逆数は、大きさの 2 乗と共役を使って、直接の式で求められます。

## コード

```zig:line-numbers=106
        pub fn reciprocal(self: Self) Self {
            const m = self.re * self.re + self.im * self.im;
            return Self{
                .re = self.re / m,
                .im = -self.im / m,
            };
        }
```

## 前提知識

- **逆数**: `z` の逆数は `1 / z` です。`z` に掛けると、1 になる数です。
- **共役（conjugate）**: 虚部の符号を反転させた数です。`a + bi` の共役は `a - bi` です。
- **大きさの 2 乗**: `a² + b²` で、`z` と共役の積の実部です。
- **複素数の割り算の考え方**: `1 / z = conj(z) / |z|²` と書けます。分母が実数になります。
- **`Self`**: 型の中で、自分自身の型を指す名前です。

## 何をしているか

### 1. 大きさの 2 乗を求める

```zig:line-numbers=107
            const m = self.re * self.re + self.im * self.im;
```

`self.re * self.re + self.im * self.im` で、`|z|²` を計算します。これが、逆数の分母になります。

### 2. 共役を割って返す

```zig:line-numbers=108
            return Self{
                .re = self.re / m,
                .im = -self.im / m,
            };
```

実部は `self.re / m` で、虚部は `-self.im / m` で求めます。虚部の符号を反転させることが、共役を掛けることに当たります。

## ここがすごい

- **割り算の回数が少ない**: 分母を 1 回だけ計算して、実部と虚部の両方で使います。
- **一般の割り算より簡単**: `div` で `1 + 0i` を割るより、式がずっと短くなります。
- **共役の性質を使う**: 逆数の式は、共役を使う形で、数学の式と直接対応します。
- **`div` と対応**: 同じファイルの `div` と比べると、逆数が割り算の特別な場合だと分かります。

## まとめ

- `reciprocal` は、大きさの 2 乗を分母にして、共役を割る形で逆数を求めます。
- 割り算の回数を減らし、式を短くしています。
- 一般の割り算 `div` の、特別な場合にあたります。
