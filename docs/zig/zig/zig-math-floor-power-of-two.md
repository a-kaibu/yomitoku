---
title: 値以下で最も大きい 2 のべき乗を、最上位ビットの位置から求める
description: Zig 標準ライブラリの math.floorPowerOfTwo。正の整数の最上位のビットの位置を log2 で求め、1 をその位置だけずらして、値を超えない最大の 2 のべき乗を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1180, 1184]
function: floorPowerOfTwo
difficulty: 2
format: 2
tags: [数値計算, ビット演算, 最適化]
---

## ひとことで

`floorPowerOfTwo` は、与えられた値以下の最大の 2 のべき乗を返す関数です。たとえば 63 なら 32、64 なら 64 を返します。バッファの大きさを、超えない最も近い 2 のべきに切り下げるときに使われます。

## コード

```zig:line-numbers=1180
pub fn floorPowerOfTwo(comptime T: type, value: T) T {
    const uT = std.meta.Int(.unsigned, @typeInfo(T).int.bits);
    if (value <= 0) return 0;
    return @as(T, 1) << log2_int(uT, @as(uT, @intCast(value)));
}
```

## 前提知識

- **2 のべき乗**: 1、2、4、8、16 のように、2 を何回か掛けてできる数です。2 進数では、1 のビットが 1 つだけ立っています。
- **最上位ビット**: 2 進数で最も左にある 1 のビットです。その位置が決まれば、その値を超えない 2 のべきが決まります。
- **`log2_int`**: 整数の 2 を底とする対数の整数部分を返す関数です。最上位ビットの位置と同じ値になります。
- **`@intCast`**: 値を別の整数型に変換します。範囲が合うか、安全チェックで確かめます。
- **`<<`（左シフト）**: 値のビットを左にずらす演算です。`1 << n` は、2 の n 乗になります。

## 何をしているか

### 1. 0 以下は 0 とする

```zig:line-numbers=1182
    if (value <= 0) return 0;
```

値が 0 以下なら、2 のべき乗は存在しないとみなして 0 を返します。

### 2. 最上位ビットの位置を求める

```zig:line-numbers=1183
    return @as(T, 1) << log2_int(uT, @as(uT, @intCast(value)));
```

`log2_int` で、値の最上位ビットの位置（2 を底とする対数）を求めます。その位置に 1 を置けば、値を超えない最大の 2 のべきになります。

## ここがすごい

- **割り算を使わない**: 2 で割り続ける方法と比べて、位置を 1 回求めるだけで済みます。ビットの性質を直接使っています。
- **型を安全に変換**: 負の値を先に除いてから、符号なしの型に `@intCast` で変換しています。変換の前提が守られています。
- **対の関数がある**: 同じファイルの `ceilPowerOfTwo` は、逆に値以上の最小の 2 のべきを求めます。
- **テストが境界を示す**: ファイルの `test` は、2 のべきちょうどの値や、その直前の値などを並べています。

## まとめ

- `floorPowerOfTwo` は、値以下で最大の 2 のべきを返します。
- 最上位ビットの位置を `log2_int` で求め、`1 <<` でその位置の値を作ります。
- 0 以下の値は、0 を返します。
