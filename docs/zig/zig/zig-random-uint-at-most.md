---
title: 0 から上限までの整数を、上限が型の最大値なら特別扱いして作る
description: Zig 標準ライブラリの Random.uintAtMost。上限に 1 を足して uintLessThan に渡すが、上限が型の最大値なら 1 を足すと溢れるので、全範囲の乱数を直接使う。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [187, 194]
function: Random.uintAtMost
difficulty: 2
format: 2
tags: [乱数, 防御的プログラミング, 数値計算]
---

## ひとことで

`uintAtMost` は、0 から指定した上限までの符号なし整数を、一様な乱数で作る関数です。上限そのものを含むことが、`uintLessThan` との違いです。

## コード

::: code-group

```zig:line-numbers=187 [日本語訳]
pub fn uintAtMost(r: Random, comptime T: type, at_most: T) T {
    assert(@typeInfo(T).int.signedness == .unsigned);
    if (at_most == maxInt(T)) {
        // 値の全範囲を使う
        return r.int(T);
    }
    return r.uintLessThan(T, at_most + 1);
}
```

```zig:line-numbers=187 [原文]
pub fn uintAtMost(r: Random, comptime T: type, at_most: T) T {
    assert(@typeInfo(T).int.signedness == .unsigned);
    if (at_most == maxInt(T)) {
        // have the full range
        return r.int(T);
    }
    return r.uintLessThan(T, at_most + 1);
}
```

:::

## 前提知識

- **符号なし整数（`u8`、`u32` など）**: 負の値を持たない整数です。`maxInt(T)` で、その型で表せる最大値がわかります。
- **`uintLessThan`**: 上限より小さい値を作る関数です。「上限を含まない」形なので、`at_most + 1` を渡すと、上限を含めた範囲になります。
- **溢れ（オーバーフロー）**: 型の最大値に 1 を足すと、範囲を超えてしまいます。通常の `+` だと、Zig では安全チェックで止まります。
- **`assert`**: 前提の条件を確かめる関数です。ここでは、符号なし整数であることを確かめています。
- **`@typeInfo`**: 型の情報を調べる組み込み関数です。整数の符号を確かめるのに使っています。

## 何をしているか

### 1. 符号なしの型だけを受け付ける

```zig:line-numbers=188
    assert(@typeInfo(T).int.signedness == .unsigned);
```

`assert` で、`T` が符号なし整数であることを確かめます。符号付きの型を渡すと、ここで止まります。

### 2. 上限が最大値なら全範囲の乱数をそのまま使う

::: code-group

```zig:line-numbers=189 [日本語訳]
    if (at_most == maxInt(T)) {
        // 値の全範囲を使う
        return r.int(T);
    }
```

```zig:line-numbers=189 [原文]
    if (at_most == maxInt(T)) {
        // have the full range
        return r.int(T);
    }
```

:::

`at_most == maxInt(T)` なら、`+ 1` すると溢れてしまいます。そこで、`r.int(T)` で型の全範囲から直接作ります。全範囲なので、どの値も同じ確率で出ます。

### 3. それ以外は上限に 1 を足して作る

```zig:line-numbers=193
    return r.uintLessThan(T, at_most + 1);
```

上限より小さい範囲で作るために、`at_most + 1` を `uintLessThan` に渡します。上限そのものが出るように、範囲を 1 つ広げています。

## ここがすごい

- **溢れを避ける特別扱い**: 最大値のときだけ別の経路を通すので、通常の計算に余計な確認が入りません。
- **一様性を保つ**: 全範囲のときも、通常のときも、各値が出る確率は同じです。特別扱いで偏りが生まれない作りです。
- **既存の関数の再利用**: 範囲の作り方を `uintLessThan` に任せているので、実装が短く保てます。
- **型で守る**: `assert` で符号付きの型を弾いているので、誤った使い方がすぐわかります。

## まとめ

- `uintAtMost` は、上限を含む一様な乱数を作ります。
- 上限が型の最大値なら、1 を足すと溢れるので、全範囲の乱数を直接使います。
- それ以外は `uintLessThan` に `at_most + 1` を渡して作ります。
