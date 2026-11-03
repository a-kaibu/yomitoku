---
title: 配列を公平にシャッフルする、後ろから 1 つずつ決める方法
description: Zig の Random.shuffleWithIndex。各位置に、残りの中からランダムに選んだ要素を入れていく。Fisher–Yates のシャッフルで、どの並びも同じ確率で出る。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/Random.zig
lines: [370, 383]
function: shuffleWithIndex
difficulty: 2
format: 2
tags: [乱数, アルゴリズム, イディオム]
---

## ひとことで

`shuffleWithIndex` は、配列の要素の並び順を、ランダムに入れ替える関数です。
トランプを切るときのように、配列の要素を 1 つずつ選んで並べ直します。どの並び方も、同じ確率で出るように作られています。

この方法は **Fisher–Yates のシャッフル** と呼ばれる、古くからある正確な方法です。

## コード

::: code-group

```zig:line-numbers=370 [日本語訳]
pub fn shuffleWithIndex(r: Random, comptime T: type, buf: []T, comptime Index: type) void {
    const MinInt = MinArrayIndex(Index);
    if (buf.len < 2) {
        return;
    }

    // `i <= j < max <= maxInt(MinInt)` が成り立つので、添字は型の範囲に収まる
    const max: MinInt = @intCast(buf.len);
    var i: MinInt = 0;
    while (i < max - 1) : (i += 1) {
        const j: MinInt = @intCast(r.intRangeLessThan(Index, i, max));
        mem.swap(T, &buf[i], &buf[j]);
    }
}
```

```zig:line-numbers=370 [原文]
pub fn shuffleWithIndex(r: Random, comptime T: type, buf: []T, comptime Index: type) void {
    const MinInt = MinArrayIndex(Index);
    if (buf.len < 2) {
        return;
    }

    // `i <= j < max <= maxInt(MinInt)`
    const max: MinInt = @intCast(buf.len);
    var i: MinInt = 0;
    while (i < max - 1) : (i += 1) {
        const j: MinInt = @intCast(r.intRangeLessThan(Index, i, max));
        mem.swap(T, &buf[i], &buf[j]);
    }
}
```

:::
## 前提知識

- **シャッフル**: 並び順をでたらめにすることです。公平なシャッフルでは、どの並び方も同じ確率で現れます。
- **乱数の範囲**: `r.intRangeLessThan(Index, i, max)` は、`i` 以上 `max` 未満の整数を、同じ確率で返す関数です。
- **`mem.swap`**: 2 つの値の場所を入れ替える標準の関数です。
- **`while (i < max - 1) : (i += 1)`**: `i` を 0 から増やしながら、条件が真の間繰り返す書き方です。
- **`@intCast`**: 型を別の整数型に変換します。範囲外なら、安全モードでエラーになります。
- **`MinArrayIndex(Index)`**: 添字を表すのに十分な、最も小さい整数型を選ぶ補助関数です。

## 何をしているか

### 1. 要素が 2 つ未満なら何もしない

```zig:line-numbers=372
    if (buf.len < 2) {
        return;
    }
```

要素が 0 個か 1 個なら、並べ替える必要がありません。そのまま戻ります。

### 2. 位置ごとに、残りからランダムに選ぶ

```zig:line-numbers=378
    var i: MinInt = 0;
    while (i < max - 1) : (i += 1) {
        const j: MinInt = @intCast(r.intRangeLessThan(Index, i, max));
        mem.swap(T, &buf[i], &buf[j]);
    }
```

位置 `i` に入れる要素を、位置 `i` から最後までの残りの中から、ランダムに選びます。選んだ位置を `j` として、`i` と `j` の要素を入れ替えます。

最初の位置 `i = 0` では、全体から 1 つを選びます。次の `i = 1` では、残りの中から選びます。こうして、前から順番に確定させていきます。

たとえば `[A, B, C]` の場合、`i = 0` で `A`、`B`、`C` のどれかを同じ確率で選んで、先頭へ置きます。次に、残りの 2 つから 1 つを選び、位置 1 へ置きます。最後の位置は、残った 1 つで決まります。

## ここがすごい

- **どの並びも同じ確率**: 各位置で、残りから一様に選ぶので、可能な並び方が公平に出ます。「先頭の要素が動きにくい」といった偏りが生まれません。
- **追加の配列が要らない**: 入れ替えを、元の配列の中だけで行います。メモリを使わずに、その場でシャッフルできます。
- **計算量が要素数に比例**: 入れ替えは、要素数だけの回数で終わります。大きな配列でも、時間が増えすぎません。
- **乱数の源を選べる**: `Random` の値として渡されるので、テストでは決まった乱数を使って、同じ並びを再現できます。
- **添字の型を選べる**: `Index` の型を引数で指定できるので、小さな配列には小さな添字の型を使い、メモリを節約できます。

## まとめ

- シャッフルは、位置ごとに「残りから 1 つ選んで入れ替える」ことで公平に行えます。
- この方法は Fisher–Yates のシャッフルとして知られ、どの並びも同じ確率で出ます。
- 入れ替えだけで行うので、追加のメモリが要りません。
- 乱数の源と添字の型を引数で選べるので、テストや省メモリの用途にも合わせられます。
