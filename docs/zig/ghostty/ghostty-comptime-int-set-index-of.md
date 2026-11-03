---
title: 候補の数が決まっていれば、二分探索をループ展開してコンパイル時に作る
description: Ghostty の ComptimeIntSet.indexOf。キーの一覧をコンパイル時にソートしておき、inline while で二分探索の段数を展開する。実行時にループの回数を数えない。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/comptime_int_set.zig
lines: [95, 111]
function: ComptimeIntSet.indexOf
difficulty: 3
format: 2
tags: [アルゴリズム, 最適化, メタプログラミング]
---

## ひとことで

`indexOf` は、コンパイル時に決まった整数の集合から、キーの位置を探す関数です。探索は二分探索で行いますが、ループの回数はコンパイル時に決まるので、ループ自体を展開して、実行時の制御を減らしています。

## コード

::: code-group

```zig:line-numbers=95 [日本語訳]
        pub inline fn indexOf(key: T) ?Index {
            if (comptime len == 0) return null;

            // ソート済みの列から、`key` 以下で最後のキーを二分探索する。
            // 各段で残りの範囲を半分にする。`n` はコンパイル時に決まる。
            // 既知なので、これは決まった段数に展開される。
            var base: usize = 0;
            comptime var n: usize = len;
            inline while (n > 1) {
                const half = comptime n / 2;
                base = if (table.sorted[base + half] <= key) base + half else base;
                n -= half;
            }

            if (table.sorted[base] != key) return null;
            return table.original[base];
        }
```

```zig:line-numbers=95 [原文]
        pub inline fn indexOf(key: T) ?Index {
            if (comptime len == 0) return null;

            // Binary search for the last sorted key that is <= `key`.
            // Each step halves the range that is left. `n` is comptime
            // known, so this unrolls into a fixed number of steps.
            var base: usize = 0;
            comptime var n: usize = len;
            inline while (n > 1) {
                const half = comptime n / 2;
                base = if (table.sorted[base + half] <= key) base + half else base;
                n -= half;
            }

            if (table.sorted[base] != key) return null;
            return table.original[base];
        }
```

:::

## 前提知識

- **二分探索**: ソート済みの列で、範囲を半分ずつ絞り込んで目的の値を探す方法です。段数は、要素数の対数に比例します。
- **`comptime`**: 値をコンパイル時に決める指定です。ここでは、集合の大きさ `len` が、この指定で決まります。
- **`inline while`**: 条件がコンパイル時に決まるループを、コードとして展開する指定です。実行時のループの制御がなくなります。
- **`comptime var n`**: コンパイル時に値が変わる変数です。段ごとに範囲の大きさを更新します。
- **`table.sorted` と `table.original`**: ソート済みのキーと、元の順番での値（添字）の 2 つの配列です。

## 何をしているか

### 1. 空の集合を除く

```zig:line-numbers=96
            if (comptime len == 0) return null;
```

要素が 0 個なら、どのキーも見つからないので `null` を返します。

### 2. 段数を展開して二分探索する

::: code-group

```zig:line-numbers=98 [日本語訳]
            // ソート済みの列から、`key` 以下で最後のキーを二分探索する。
            // 各段で残りの範囲を半分にする。`n` はコンパイル時に決まる。
            // 既知なので、これは決まった段数に展開される。
            var base: usize = 0;
            comptime var n: usize = len;
            inline while (n > 1) {
                const half = comptime n / 2;
                base = if (table.sorted[base + half] <= key) base + half else base;
                n -= half;
            }
```

```zig:line-numbers=98 [原文]
            // Binary search for the last sorted key that is <= `key`.
            // Each step halves the range that is left. `n` is comptime
            // known, so this unrolls into a fixed number of steps.
            var base: usize = 0;
            comptime var n: usize = len;
            inline while (n > 1) {
                const half = comptime n / 2;
                base = if (table.sorted[base + half] <= key) base + half else base;
                n -= half;
            }
```

:::

`inline while` は、残りの範囲の大きさ `n` が 1 になるまで、段を展開します。各段で、中央の値を `key` と比べ、`key` 以上なら基準の位置を中央へ動かします。

### 3. 見つかったかを確かめる

```zig:line-numbers=109
            if (table.sorted[base] != key) return null;
            return table.original[base];
```

基準の位置の値が `key` と一致すれば、その元の添字を返します。一致しなければ `null` です。

## ここがすごい

- **実行時のループがない**: 段数はコンパイル時に決まるので、ループの条件判定や回数の管理が、機械語の中に残りません。
- **候補の数に合わせた最適化**: キーの数が変われば、展開される段数が自動的に変わります。手で書き換える必要がありません。
- **二分探索の計算量**: 探す回数は、要素数の対数になります。大きな集合でも、少ない比較で見つかります。
- **元の順番を保つ**: ソート済みの列と、元の添字の列を分けて持つので、結果として元の位置を返せます。

## まとめ

- `indexOf` は、コンパイル時にソートされた集合で、二分探索を行います。
- `inline while` でループを展開し、実行時の制御を減らしています。
- 見つかったキーは、元の添字で返します。
