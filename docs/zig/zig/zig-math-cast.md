---
title: 整数を別の整数型へ安全に変換する
description: Zig 標準ライブラリの math.cast。値が移し先の型の範囲に入るときだけ変換し、入らないときは null を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1073, 1084]
function: cast
difficulty: 2
format: 2
tags: [数値計算, 型システム]
---

## ひとことで

`cast` は、整数を別の整数型に変えるときに、値が収まるかを確かめる関数です。収まらなければ `null` を返します。

## コード

::: code-group

```zig:line-numbers=1073 [日本語訳]
pub fn cast(comptime T: type, x: anytype) ?T {
    comptime assert(@typeInfo(T) == .int); // 整数を渡す必要がある。
    const is_comptime = @TypeOf(x) == comptime_int;
    comptime assert(is_comptime or @typeInfo(@TypeOf(x)) == .int); // 整数を渡す必要がある。
    if ((is_comptime or maxInt(@TypeOf(x)) > maxInt(T)) and x > maxInt(T)) {
        return null;
    } else if ((is_comptime or minInt(@TypeOf(x)) < minInt(T)) and x < minInt(T)) {
        return null;
    } else {
        return @as(T, @intCast(x));
    }
}
```

```zig:line-numbers=1073 [原文]
pub fn cast(comptime T: type, x: anytype) ?T {
    comptime assert(@typeInfo(T) == .int); // must pass an integer
    const is_comptime = @TypeOf(x) == comptime_int;
    comptime assert(is_comptime or @typeInfo(@TypeOf(x)) == .int); // must pass an integer
    if ((is_comptime or maxInt(@TypeOf(x)) > maxInt(T)) and x > maxInt(T)) {
        return null;
    } else if ((is_comptime or minInt(@TypeOf(x)) < minInt(T)) and x < minInt(T)) {
        return null;
    } else {
        return @as(T, @intCast(x));
    }
}
```

:::

## 前提知識

- **`comptime`**: コンパイル時に評価される指定です。
- **`comptime_int`**: コンパイル時の整数リテラルの型です。実行時の型より広い範囲を持ちます。
- **`maxInt` と `minInt`**: 整数型の最大値と最小値を返す関数です。
- **`@intCast`**: 値を別の整数型に変換する組み込み関数です。安全検査が入ります。
- **`?T`**: 値があるか `null` かを表す、オプショナル型です。

## 何をしているか

### 1. 型が整数かを確かめる

::: code-group

```zig:line-numbers=1074 [日本語訳]
    comptime assert(@typeInfo(T) == .int); // 整数を渡す必要がある。
    const is_comptime = @TypeOf(x) == comptime_int;
    comptime assert(is_comptime or @typeInfo(@TypeOf(x)) == .int); // 整数を渡す必要がある。
```

```zig:line-numbers=1074 [原文]
    comptime assert(@typeInfo(T) == .int); // must pass an integer
    const is_comptime = @TypeOf(x) == comptime_int;
    comptime assert(is_comptime or @typeInfo(@TypeOf(x)) == .int); // must pass an integer
```

:::

移し先の `T` が整数型であることと、元の値が整数であることを、コンパイル時に確かめます。

### 2. 上限を超えていないかを調べる

```zig:line-numbers=1077
    if ((is_comptime or maxInt(@TypeOf(x)) > maxInt(T)) and x > maxInt(T)) {
        return null;
```

元の値の型の最大値が、移し先の最大値より大きいときだけ確かめます。そのうえで、値が移し先の最大値を超えていれば `null` を返します。

### 3. 下限を下回っていないかを調べる

```zig:line-numbers=1079
    } else if ((is_comptime or minInt(@TypeOf(x)) < minInt(T)) and x < minInt(T)) {
        return null;
```

同じように、移し先の最小値より小さければ `null` を返します。

### 4. 範囲内なら変換して返す

```zig:line-numbers=1081
    } else {
        return @as(T, @intCast(x));
    }
```

範囲に収まっているときだけ `@intCast` で変換します。

## ここがすごい

- **失敗を値で返す**: 範囲外の値は、`null` という形で呼び出し側に伝わります。パニックにはなりません。
- **無駄な検査を省く**: 元の型が移し先より広いときだけ検査するので、余分な比較を避けられます。
- **コンパイル時の値も扱える**: `comptime_int` の場合も、同じ検査で正しく判断します。

## まとめ

- `cast` は、値が移し先の型に収まるときだけ変換します。
- 収まらないときは `null` を返すので、呼び出し側で扱いを決められます。
