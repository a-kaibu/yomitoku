---
title: 複素数の大きさを、実部と虚部の 2 乗の和の平方根で求める
description: Zig 標準ライブラリの複素数の magnitude。実部と虚部の 2 乗を足して平方根を取り、原点からの距離を返す。2 乗だけを使う squaredMagnitude とも対になる。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [115, 117]
function: Complex.magnitude
difficulty: 1
format: 2
tags: [数値計算, 標準ライブラリ]
---

## ひとことで

`magnitude` は、複素数の大きさを返す関数です。平面上の点で考えると、複素数の原点からの距離にあたります。

## コード

```zig:line-numbers=115
        pub fn magnitude(self: Self) T {
            return @sqrt(self.re * self.re + self.im * self.im);
        }
```

## 前提知識

- **複素数の大きさ（絶対値）**: `a + bi` の大きさは、`√(a² + b²)` です。直角三角形の斜辺の長さと同じです。
- **平方根（`@sqrt`）**: 2 乗して元の値になる数を求める計算です。Zig では組み込みの `@sqrt` で書けます。
- **`T`**: 実部と虚部の型です。`@sqrt` は浮動小数点数の型に対して使うので、この型が浮動小数点数であることが前提です。
- **`squaredMagnitude`**: 同じファイルにある関数で、平方根を取る前の `a² + b²` を返します。
- **`Self`**: 型の中で、自分自身の型を指す名前です。

## 何をしているか

関数は、`self.re * self.re + self.im * self.im` で `a² + b²` を計算し、その平方根を `@sqrt` で求めて返します。

### 1. 2 乗の和を作る

```zig:line-numbers=116
            return @sqrt(self.re * self.re + self.im * self.im);
```

実部と虚部のそれぞれを 2 乗して、足し合わせます。この値が、平面上の点までの距離の 2 乗になります。

### 2. 平方根を取る

```zig:line-numbers=115
        pub fn magnitude(self: Self) T {
            return @sqrt(self.re * self.re + self.im * self.im);
        }
```

`@sqrt` で平方根を取ると、距離そのものが得られます。平方根は、2 乗を戻すための操作です。

## ここがすごい

- **2 乗の和を先に作れる**: 大きさを比べるだけなら、平方根は不要です。`squaredMagnitude` を使えば、速く比較できます。
- **型の一貫性**: 結果も `T` で返るので、浮動小数点数の型の選択が、そのまま精度に反映されます。
- **直感と一致する**: 直角三角形の斜辺という、なじみのある考え方がそのまま式になっています。
- **対になる関数が用意されている**: 平方根を取るか取らないかで、2 つの関数を分けています。使う場面に応じて、無駄な計算を避けられます。

## まとめ

- 複素数の大きさは、実部と虚部の 2 乗の和の平方根です。
- 比べるだけなら平方根を取らない `squaredMagnitude` で十分です。
- 結果は実部と同じ型 `T` で返ります。
