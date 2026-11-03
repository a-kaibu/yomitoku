---
title: 複素数の大きさの 2 乗を、平方根を取らずに求める
description: Zig 標準ライブラリの複素数の squaredMagnitude。実部と虚部の 2 乗の和を返すだけ。大きさの比較のように平方根が要らない場面で、計算を省ける。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math/complex.zig
lines: [119, 121]
function: Complex.squaredMagnitude
difficulty: 1
format: 2
tags: [数値計算, 最適化, 標準ライブラリ]
---

## ひとことで

`squaredMagnitude` は、複素数の大きさの 2 乗を返す関数です。大きさそのものではなく、2 乗の値を返すので、平方根の計算を省けます。大きさを比べるだけなら、これで十分です。

## コード

```zig:line-numbers=119
        pub fn squaredMagnitude(self: Self) T {
            return self.re * self.re + self.im * self.im;
        }
```

## 前提知識

- **複素数の大きさ**: `a + bi` の大きさは `√(a² + b²)` です。
- **大きさの 2 乗**: 平方根を取る前の `a² + b²` です。
- **大小関係は 2 乗でも保たれる**: 大きさが正の数同士なら、2 乗した値の大小は、元の大小と同じになります。
- **平方根の計算**: 浮動小数点数の平方根は、掛け算や足し算より重い計算です。
- **`magnitude`**: 同じファイルの関数で、平方根を取った大きさを返します。

## 何をしているか

### 1. 実部と虚部の 2 乗を足す

```zig:line-numbers=120
            return self.re * self.re + self.im * self.im;
```

`self.re * self.re + self.im * self.im` で、大きさの 2 乗を計算します。平方根は取りません。

## ここがすごい

- **平方根が要らない**: 掛け算と足し算だけなので、計算が速く、誤差も少なくなります。
- **比較には十分**: 2 つの大きさを比べるだけなら、2 乗の値を比べれば同じ結果になります。
- **`magnitude` と対**: 大きさそのものが必要なら `magnitude`、比べるだけなら `squaredMagnitude` と使い分けられます。
- **名前で用途が分かる**: `squared` と付いているので、平方根を取っていないと読み手にすぐ伝わります。

## まとめ

- `squaredMagnitude` は、大きさの 2 乗を、平方根なしで返します。
- 大きさの比較には、この値で十分です。
- 大きさそのものが必要なときは、`magnitude` を使います。
