---
title: 次の 2 のべき乗を求めて、型に収まらないときは溢れを知らせる
description: Zig の math.ceilPowerOfTwo。値以上で最小の 2 のべき乗を返す。1 ビット広い型で計算して、型の範囲を超えたら Overflow のエラーにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1228, 1238]
function: ceilPowerOfTwo
difficulty: 3
format: 2
tags: [数値計算, ビット演算, 防御的プログラミング]
---

## ひとことで

`ceilPowerOfTwo` は、与えられた符号なし整数以上で、いちばん小さい 2 のべき乗を返す関数です。
たとえば `ceilPowerOfTwo(u32, 5)` は `8` です。`5` 以上で最も小さい 2 のべき乗だからです。

ただし、答えがその型の範囲に収まらないときは、`error.Overflow` を返します。たとえば `u8` で `200` を渡すと、答えは `256` になり、`u8` には入らないのでエラーです。

## コード

```zig:line-numbers=1228
pub fn ceilPowerOfTwo(comptime T: type, value: T) (error{Overflow}!T) {
    comptime assert(@typeInfo(T) == .int);
    const info = @typeInfo(T).int;
    comptime assert(info.signedness == .unsigned);
    const PromotedType = std.meta.Int(info.signedness, info.bits + 1);
    const overflowBit = @as(PromotedType, 1) << info.bits;
    const x = ceilPowerOfTwoPromote(T, value);
    if (overflowBit & x != 0) {
        return error.Overflow;
    }
    return @as(T, @intCast(x));
```
## 前提知識

- **2 のべき乗**: 1、2、4、8、16 … のような数です。2 進数では 1 のビットが 1 つだけあります。
- **`std.meta.Int(signedness, bits)`**: 指定の符号と大きさの整数型を作る式です。ここでは 1 ビット広い型を作るために使います。
- **`ceilPowerOfTwoPromote`**: 1 ビット広い型で、2 のべき乗の計算をする関数です（この記事のコードの外側にあります）。
- **`error{Overflow}!T`**: 成功なら `T` の値、失敗なら `Overflow` のエラーを返す型です。
- **`@as(PromotedType, 1) << info.bits`**: 1 を、型のビット数の位置までずらした値です。この位置のビットが立つと、答えが元の型に収まらないことを意味します。
- **`& != 0`**: 指定のビットがあるかを調べる書き方です。

## 何をしているか

### 1. 型の情報を確かめる

```zig:line-numbers=1229
    comptime assert(@typeInfo(T) == .int);
    const info = @typeInfo(T).int;
    comptime assert(info.signedness == .unsigned);
```

整数型で、符号なしのものだけを受け付けます。コンパイル時に確かめるので、違う型を渡すとビルドが止まります。

### 2. 1 ビット広い型で計算する

```zig:line-numbers=1232
    const PromotedType = std.meta.Int(info.signedness, info.bits + 1);
    const overflowBit = @as(PromotedType, 1) << info.bits;
    const x = ceilPowerOfTwoPromote(T, value);
```

`PromotedType` は、元の型より 1 ビット広い型です。`u8` なら `u9` です。`overflowBit` は、元の型では表せない位置のビット（`u8` なら 256）です。

答えを広い型で求めておけば、元の型では表せない値も、そのまま表せます。

### 3. 溢れていれば、エラーを返す

```zig:line-numbers=1235
    if (overflowBit & x != 0) {
        return error.Overflow;
    }
    return @as(T, @intCast(x));
```

答えに `overflowBit` が立っていれば、元の型には収まりません。`error.Overflow` を返します。
収まるなら、元の型の値に変換して返します。

たとえば `u8` の `value = 5` は、答えが `8` で、`overflowBit`（256）は立ちません。`value = 200` は答えが `256` になり、`overflowBit` が立つので、エラーになります。

## ここがすごい

- **溢れを型で検出する**: 計算の途中で溢れを起こさず、1 ビット広い型で答えを作ってから判定します。溢れたかどうかを、確かな方法で調べられます。
- **エラーを戻り値に**: 失敗を `error.Overflow` で返すので、呼び出し側が必ず扱うことになります。黙って誤った値を返すことはありません。
- **コンパイル時のチェック**: 符号付きの型や整数以外の型を渡すと、`comptime assert` で止まります。誤った使い方が、実行前に分かります。
- **型の大きさに合わせる**: `info.bits` を使うので、`u8` でも `u64` でも、同じ関数が正しく動きます。

## まとめ

- 次の 2 のべき乗は、型より 1 ビット広い型で計算すると、溢れを安全に検出できます。
- 答えが元の型の範囲を超えたら、`Overflow` のエラーを返します。
- 符号なしの整数型だけを受け付け、それ以外はコンパイル時に止めます。
- 溢れを黙って無視しないことが、この関数の設計の中心です。
