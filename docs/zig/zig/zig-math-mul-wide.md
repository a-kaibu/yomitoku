---
title: 2 つの整数を、結果が溢れない 2 倍の幅の型に広げてから掛ける
description: Zig 標準ライブラリの math.mulWide。整数のビット幅を 2 倍にした型を作り、両方を広げてから掛けることで、掛け算の結果が溢れないようにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1505, 1514]
function: mulWide
difficulty: 2
format: 2
tags: [数値計算, 型システム, 防御的プログラミング]
---

## ひとことで

`mulWide` は、2 つの整数を掛けて、結果が溢れない広い型で返す関数です。たとえば `u8` 同士の掛け算は、結果が `u16` の範囲に収まります。掛け算の結果が元の型に入らない心配をせずに、計算ができます。

## コード

```zig:line-numbers=1505
pub fn mulWide(comptime T: type, a: T, b: T) std.meta.Int(
    @typeInfo(T).int.signedness,
    @typeInfo(T).int.bits * 2,
) {
    const ResultInt = std.meta.Int(
        @typeInfo(T).int.signedness,
        @typeInfo(T).int.bits * 2,
    );
    return @as(ResultInt, a) * @as(ResultInt, b);
}
```

## 前提知識

- **整数のオーバーフロー**: 結果が型で表せる範囲を超えることです。Zig では、通常の掛け算でこれが起きると、安全チェックで止まります。
- **ビット幅**: 整数の型が持つビットの数です。`u8` は 8 ビット、`u16` は 16 ビットです。
- **`std.meta.Int(signedness, bits)`**: 符号の有無とビット数を指定して、整数の型を作る関数です。
- **`@typeInfo(T).int`**: 整数型の符号とビット数を取り出す組み込み関数です。
- **`comptime`**: 型の引数を、コンパイル時に決める仕組みです。

## 何をしているか

### 1. 2 倍の幅の型を作る

```zig:line-numbers=1509
    const ResultInt = std.meta.Int(
        @typeInfo(T).int.signedness,
        @typeInfo(T).int.bits * 2,
    );
```

`@typeInfo(T).int` から符号と幅を取り出し、幅を 2 倍にした整数の型 `ResultInt` を作ります。符号の有無は、元の型と同じです。

### 2. 広げてから掛ける

```zig:line-numbers=1513
    return @as(ResultInt, a) * @as(ResultInt, b);
```

`a` と `b` を `ResultInt` に変換してから掛けます。広げてから掛けるので、結果が元の型に収まらなくても、溢れません。

## ここがすごい

- **結果の型が確実に収まる**: 2 つの n ビットの数の積は、2n ビットに必ず収まります。型の幅を 2 倍にするのは、その性質を使った設計です。
- **符号も引き継ぐ**: 符号なしの型なら符号なし、符号付きなら符号付きの結果になります。負の値の積も正しく求まります。
- **型の計算がコンパイル時**: 結果の型は `comptime` で決まるので、実行時の型の確認は要りません。
- **テストが両方の符号を示す**: ファイルの `test` は、`u8` と `i8` の例を並べて、符号の扱いを確かめています。

## まとめ

- `mulWide` は、ビット幅を 2 倍にした型に広げてから掛けます。
- 結果は元の 2 倍の幅に必ず収まり、溢れません。
- 符号の有無は元の型に従います。
