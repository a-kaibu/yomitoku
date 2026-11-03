---
title: 値を下限と上限の間に収める clamp を、min と max の組み合わせで書く
description: Zig 標準ライブラリの math.clamp。最小と最大を組み合わせて、値を下限と上限の範囲に収める。整数、浮動小数点数、ベクトルに対応し、型が合わなければコンパイルエラーにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [520, 531]
function: clamp
difficulty: 2
format: 2
tags: [数値計算, 防御的プログラミング, 型システム]
---

## ひとことで

`clamp` は、値を下限と上限の範囲に収める関数です。下限より小さければ下限を、上限より大きければ上限を返し、範囲の中ならそのままの値を返します。音量の調整や、画面の座標を制限するときなどに使われます。

## コード

```zig:line-numbers=520
pub fn clamp(val: anytype, lower: anytype, upper: anytype) @TypeOf(val, lower, upper) {
    const T = @TypeOf(val, lower, upper);
    switch (@typeInfo(T)) {
        .int, .float, .comptime_int, .comptime_float => assert(lower <= upper),
        .vector => |vinfo| switch (@typeInfo(vinfo.child)) {
            .int, .float => assert(@reduce(.And, lower <= upper)),
            else => @compileError("Expected vector of ints or floats, found " ++ @typeName(T)),
        },
        else => @compileError("Expected an int, float or vector of one, found " ++ @typeName(T)),
    }
    return @max(lower, @min(val, upper));
}
```

## 前提知識

- **clamp（クランプ）**: 値を範囲の中に押し込むことです。「締め付ける」という意味の言葉です。
- **`@min` と `@max`**: 2 つの値のうち小さい方、大きい方を返す組み込み関数です。
- **`anytype`**: 任意の型の引数を受け付ける書き方です。ここでは、型をすべての引数から決めます。
- **`@TypeOf(val, lower, upper)`**: 3 つの引数の型を、1 つにまとめて決める組み込み関数です。
- **`@compileError`**: 想定外の型が渡されたときに、コンパイル時にエラーを出す組み込み関数です。

## 何をしているか

### 1. 型を調べて検査する

```zig:line-numbers=521
    const T = @TypeOf(val, lower, upper);
    switch (@typeInfo(T)) {
        .int, .float, .comptime_int, .comptime_float => assert(lower <= upper),
        .vector => |vinfo| switch (@typeInfo(vinfo.child)) {
            .int, .float => assert(@reduce(.And, lower <= upper)),
            else => @compileError("Expected vector of ints or floats, found " ++ @typeName(T)),
        },
        else => @compileError("Expected an int, float or vector of one, found " ++ @typeName(T)),
    }
```

`@typeInfo` で型の種類を調べます。整数、浮動小数点数、またはそのベクトルなら、下限が上限以下であることを `assert` で確かめます。それ以外の型は、`@compileError` で、コンパイルの時点で止めます。

### 2. 下限と上限の間に収める

```zig:line-numbers=530
    return @max(lower, @min(val, upper));
```

`@min(val, upper)` で上限を超えた値を切り、`@max(lower, ...)` で下限を下回った値を持ち上げます。この 1 行で、範囲の中の値になります。

## ここがすごい

- **1 行の計算**: 条件分岐を使わずに、`min` と `max` の組み合わせだけで範囲に収めます。
- **型の検査がコンパイル時**: 対応しない型は、実行する前にエラーになります。実行時の驚きを減らせます。
- **ベクトルにも対応**: 同じ式で、複数の値を一度に収められます。
- **テストが例を示す**: ファイルの `test` は、範囲の中、下、上の 3 つの場合を並べています。

## まとめ

- `clamp` は、値を下限と上限の範囲に収めます。
- `@min` と `@max` を組み合わせて、1 行で書けます。
- 型はコンパイル時に検査され、対応しない型はエラーになります。
