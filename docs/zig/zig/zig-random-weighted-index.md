---
title: 重みに応じて、累積の和の区間に乱数を落として選ぶ
description: Zig の Random.weightedIndex。重みの合計の中からランダムな点を選び、累積の和が初めてその点を超えた位置を返す。重い要素ほど選ばれやすい。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [392, 421]
function: weightedIndex
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 数値計算]
---

## ひとことで

`weightedIndex` は、重み付きの確率で、配列の添字を 1 つ選ぶ関数です。`proportions` の中の値が大きいほど、その添字が選ばれやすくなります。
たとえば `[1, 3]` なら、添字 1 のほうが 3 倍の確率で選ばれます。

ガチャの排出率や、抽選の当たりの決め方のような場面に向いています。

## コード

::: code-group

```zig:line-numbers=392 [日本語訳]
pub fn weightedIndex(r: Random, comptime T: type, proportions: []const T) usize {
//     この実装は、重みをすべて足し、
//     [0, sum) の中からランダムな点を選ぶ。そのあと、重みを順に足していき、
//     累積の値がその点を超えるまで進める。

    const sum = s: {
        var sum: T = 0;
        for (proportions) |v| sum += v;
        break :s sum;
    };

    const point = switch (@typeInfo(T)) {
        .int => |int_info| switch (int_info.signedness) {
            .signed => r.intRangeLessThan(T, 0, sum),
            .unsigned => r.uintLessThan(T, sum),
        },
    //     誤差で sum をわずかに超えないように注意する
        .float => @min(r.float(T) * sum, sum - std.math.floatEps(T)),
        else => @compileError("weightedIndex does not support proportions of type " ++
            @typeName(T)),
    };

    assert(point < sum);

    var accumulator: T = 0;
    for (proportions, 0..) |p, index| {
        accumulator += p;
        if (point < accumulator) return index;
    } else unreachable;
}
```

```zig:line-numbers=392 [原文]
pub fn weightedIndex(r: Random, comptime T: type, proportions: []const T) usize {
    // This implementation works by summing the proportions and picking a
    // random point in [0, sum).  We then loop over the proportions,
    // accumulating until our accumulator is greater than the random point.

    const sum = s: {
        var sum: T = 0;
        for (proportions) |v| sum += v;
        break :s sum;
    };

    const point = switch (@typeInfo(T)) {
        .int => |int_info| switch (int_info.signedness) {
            .signed => r.intRangeLessThan(T, 0, sum),
            .unsigned => r.uintLessThan(T, sum),
        },
        // take care that imprecision doesn't lead to a value slightly greater than sum
        .float => @min(r.float(T) * sum, sum - std.math.floatEps(T)),
        else => @compileError("weightedIndex does not support proportions of type " ++
            @typeName(T)),
    };

    assert(point < sum);

    var accumulator: T = 0;
    for (proportions, 0..) |p, index| {
        accumulator += p;
        if (point < accumulator) return index;
    } else unreachable;
}
```

:::
## 前提知識

- **重み（proportions）**: 各候補の選ばれやすさを表す値です。値が大きいほど、選ばれやすくなります。
- **累積の和（accumulator）**: 先頭から順に重みを足していった途中の合計です。
- **区間**: 累積の和が 0 から増えていくと、各候補は「自分の重みの分だけの幅を持つ区間」になります。ランダムな点がどの区間に入るかで、選ばれる候補が決まります。
- **`switch (@typeInfo(T))`**: 型の種類によって、乱数の作り方を変える書き方です。
- **`@min`**: 2 つの値の小さいほうを返す組み込み関数です。
- **`unreachable`**: 「ここには来ない」という約束を書く値です。ここでは、点が必ず合計より小さいので、ループの最後には到達しないことを示しています。

## 何をしているか

### 1. 重みの合計を求める

```zig:line-numbers=397
    const sum = s: {
        var sum: T = 0;
        for (proportions) |v| sum += v;
        break :s sum;
    };
```

すべての重みを足して、`sum` にします。たとえば `[1, 3]` なら、`sum` は `4` です。

### 2. 合計の中からランダムな点を選ぶ

::: code-group

```zig:line-numbers=403 [日本語訳]
    const point = switch (@typeInfo(T)) {
        .int => |int_info| switch (int_info.signedness) {
            .signed => r.intRangeLessThan(T, 0, sum),
            .unsigned => r.uintLessThan(T, sum),
        },
    //     誤差によって sum をわずかに超えないように注意する
        .float => @min(r.float(T) * sum, sum - std.math.floatEps(T)),
```

```zig:line-numbers=403 [原文]
    const point = switch (@typeInfo(T)) {
        .int => |int_info| switch (int_info.signedness) {
            .signed => r.intRangeLessThan(T, 0, sum),
            .unsigned => r.uintLessThan(T, sum),
        },
        // take care that imprecision doesn't lead to a value slightly greater than sum
        .float => @min(r.float(T) * sum, sum - std.math.floatEps(T)),
```

:::

整数の場合は、`0` 以上 `sum` 未満の整数を選びます。浮動小数点数の場合は、`0` から `sum` までの小数を選びます。小数の計算で誤差が出て `sum` を超えないように、`@min` で上限を抑えています。

たとえば `sum = 4` なら、点は 0、1、2、3 のどれかです。

### 3. 累積の和が点を超えた位置を返す

```zig:line-numbers=414
    assert(point < sum);

    var accumulator: T = 0;
    for (proportions, 0..) |p, index| {
        accumulator += p;
        if (point < accumulator) return index;
    } else unreachable;
```

重みを先頭から順に足していきます。累積の和が初めて `point` より大きくなった位置の添字を返します。

`[1, 3]` で `point = 2` のとき、最初の重み `1` の累積は `1` で、`2 < 1` ではありません。次の重み `3` を足すと `4` になり、`2 < 4` なので、添字 1 を返します。`point = 0` なら、最初の累積 `1` で添字 0 になります。

## ここがすごい

- **比べる回数が少ない**: 1 回の乱数で、重みを順に足すだけで選べます。候補の数だけの計算で済みます。
- **確率が重みに比例する**: 点が区間の中のどこに落ちるかは、その区間の幅、つまり重みに比例します。重みを 3 倍にすれば、確率も 3 倍になります。
- **誤差への備え**: 浮動小数点数では、計算の誤差で点が `sum` をわずかに超えることがあります。上限を `sum - floatEps` で抑えているので、必ず有効な候補に当たります。
- **型ごとの処理**: 整数の符号の有無や、小数の型で、乱数の作り方を分けています。合計の型を間違えたら、`@compileError` で止まります。

## まとめ

- 重み付きの選択は、合計の中からランダムな点を選び、累積の和で区間を探すと簡単にできます。
- 点が区間のどこに入るかで候補が決まるので、確率は重みに比例します。
- 小数の誤差で上限を超えないように、点の上限を抑えます。
- 対応していない型は、コンパイル時にエラーとして知らせます。
