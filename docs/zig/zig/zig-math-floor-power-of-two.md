---
title: 2 のべき乗の境目を、ビット数から一瞬で求める
description: 値以下で最大の 2 のべき乗を返す floorPowerOfTwo。先頭の 1 のビットの位置を log2_int で求め、1 をその分だけずらして作る。
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
tags: [ビット演算, 数値計算, イディオム]
---

## ひとことで

`floorPowerOfTwo` は、与えられた値以下でいちばん大きい 2 のべき乗（1、2、4、8、16 …）を返す関数です。
たとえば `floorPowerOfTwo(u32, 65)` は `64` です。`65` より大きい 2 のべき乗は `128` ですが、`65` 以下では `64` が最大だからです。

値が 0 以下のときは、`0` を返します。

## コード

```zig:line-numbers=1180
pub fn floorPowerOfTwo(comptime T: type, value: T) T {
    const uT = std.meta.Int(.unsigned, @typeInfo(T).int.bits);
    if (value <= 0) return 0;
    return @as(T, 1) << log2_int(uT, @as(uT, @intCast(value)));
}
```
## 前提知識

- **2 のべき乗**: 1、2、4、8、16 のように、2 を何回か掛けた数です。2 進数では、1 のビットが 1 つだけ立った形になります。
- **`@as(T, 1) << n`**: 1 を `n` ビット左にずらす操作です。`1 << 4` は `16` です。
- **`log2_int`**: 符号なし整数の 2 を底とする対数を、切り捨てた値として返す関数です。2 進数で、いちばん上の 1 の位置にあたります（前の記事で説明しています）。
- **`std.meta.Int(.unsigned, bits)`**: 指定したビット数の符号なし整数型を作る式です。符号付きの型でも、ビット操作の型に変換できます。
- **`@intCast`**: 値を別の整数型に変換します。範囲外なら安全モードでエラーになります。
- **`if (value <= 0) return 0;`**: 0 以下の値に対して、特別な答えを返す早期リターンです。

## 何をしているか

### 1. 0 以下は 0 を返す

```zig:line-numbers=1182
    if (value <= 0) return 0;
```

値が 0 以下なら、2 のべき乗の「以下の最大」は存在しません。ここでは 0 を返して、扱いを決めています。

### 2. 符号なし型に変換して、先頭の 1 の位置を求める

```zig:line-numbers=1181
    const uT = std.meta.Int(.unsigned, @typeInfo(T).int.bits);
```

符号付きの型でも、ビットの位置を求めるために、同じビット数の符号なし型 `uT` を用意します。`i4` の場合は `u4` になります。

### 3. 1 を、その位置だけずらす

```zig:line-numbers=1183
    return @as(T, 1) << log2_int(uT, @as(uT, @intCast(value)));
```

`log2_int` で、値の先頭の 1 の位置 `n` を求めます。その値 `n` だけ 1 を左にずらすと、`2 の n 乗` になります。

たとえば `value = 65` なら、2 進数は `1000001` で、先頭の 1 は 6 番目の位置です。`log2_int` は `6` を返し、`1 << 6` は `64` です。

### 4. テストの例で確かめる

```zig:line-numbers=1192
    try testing.expect(floorPowerOfTwo(u32, 63) == 32);
    try testing.expect(floorPowerOfTwo(u32, 64) == 64);
    try testing.expect(floorPowerOfTwo(u32, 65) == 64);
```

`63` は `32`、`64` は `64`、`65` は `64` になることを確かめています。境目の値の前後で、結果がどう変わるかが分かります。

## ここがすごい

- **ループが要らない**: 2 のべき乗を 1 つずつ試す方法は、値の大きさに比例して時間がかかります。この方法は、先頭の 1 の位置を 1 命令で求めるだけです。
- **既存の関数を組み合わせる**: `log2_int` の結果を使うので、新しい計算を一から書く必要がありません。部品を組み合わせて作られています。
- **符号付きの型にも対応**: 符号なし型に変換してから計算するので、`i4` のような符号付きの型でも、正しい答えを返します。
- **0 を明示的に扱う**: 0 や負の値に対して何を返すかを、コードで明確に決めています。

## まとめ

- 値以下の最大の 2 のべき乗は、先頭の 1 の位置を求めて、1 をその分ずらすと得られます。
- 先頭の 1 の位置は、`log2_int` で一瞬に求められます。
- 符号付きの型は、ビット操作のために符号なし型へ変換します。
- 0 以下の値は、0 を返すと決めておきます。
