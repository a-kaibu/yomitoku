---
title: 2 つの値を比べて、lt・eq・gt のどれかを返す
description: Zig 標準ライブラリの math.order。等しいか、小さいか、大きいかを順に調べ、std.math.Order の値を返す。比べられない場合は到達しない扱いにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/math.zig
lines: [1615, 1625]
function: order
difficulty: 1
format: 2
tags: [数値計算, 型システム, イディオム]
---

## ひとことで

`order` は、2 つの数を比べて、その大小関係を `Order` の値で返す関数です。結果は `.lt`（小さい）、`.eq`（等しい）、`.gt`（大きい）のどれかになります。ソートや比較の関数の土台として使われます。

## コード

```zig:line-numbers=1615
pub fn order(a: anytype, b: anytype) Order {
    if (a == b) {
        return .eq;
    } else if (a < b) {
        return .lt;
    } else if (a > b) {
        return .gt;
    } else {
        unreachable;
    }
}
```

## 前提知識

- **`std.math.Order`**: 比較の結果を表す列挙型です。`lt`、`eq`、`gt` の 3 つの値を持ちます。
- **`anytype`**: 任意の型の引数を受け付ける書き方です。ここでは、比べられる型なら何でも使えます。
- **`unreachable`**: 実行されないはずの場所を示す指定です。実際に到達すると、安全チェックで止まります。
- **比較の全順序性**: 整数や浮動小数点数の大小関係では、等しい、小さい、大きいのどれか 1 つだけが成り立ちます。
- **NaN の扱い**: 浮動小数点数の NaN は、どの比較も偽になります。この関数では、そのときに `unreachable` へ到達する場合があります。

## 何をしているか

### 1. 等しいかを調べる

```zig:line-numbers=1616
    if (a == b) {
        return .eq;
```

`a == b` なら、`.eq` を返します。

### 2. 小さいか、大きいかを調べる

```zig:line-numbers=1618
    } else if (a < b) {
        return .lt;
    } else if (a > b) {
        return .gt;
```

`a < b` なら `.lt`、`a > b` なら `.gt` を返します。上の条件で等しいかを先に調べてあるので、順番が重要です。

### 3. どれにも当てはまらない場合

```zig:line-numbers=1622
    } else {
        unreachable;
    }
```

ここに来るのは、比べられない値（NaN など）の場合だけです。`unreachable` と書くことで、この場所が通らないという前提を明示しています。

## ここがすごい

- **結果を型で表す**: `bool` で 2 択にせず、`Order` で 3 つの結果を表すので、ソートなどで必要な情報が揃います。
- **前提を `unreachable` で明示**: 通らないはずの経路を、コードの上で言葉にしています。違反すれば、安全チェックで検出されます。
- **汎用の比較**: `anytype` を使うので、整数、浮動小数点数、ベクトルなど、比べられる型なら使えます。
- **比較の順序が意図的**: 等しいかを先に調べることで、残りの 2 つの比較の意味が明確になります。

## まとめ

- `order` は、2 つの値を比べて `Order` の 3 つの値のどれかを返します。
- 等しい、小さい、大きいの順に調べます。
- 比べられない値の場合は、`unreachable` で前提を示します。
