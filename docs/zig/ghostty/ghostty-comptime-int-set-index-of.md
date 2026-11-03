---
title: 集合の探索を、プログラムを作る時点で並べ替えて、二分探索を展開する
description: Ghostty の ComptimeIntSet.indexOf。キーの一覧をコンパイル時に並べ替え、実行時の二分探索の回数を固定して、ループを展開する。
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
tags: [データ構造, アルゴリズム, 最適化]
---

## ひとことで

`indexOf` は、整数のキーが集合に入っているかを調べ、入っていれば元の一覧での番号を返す関数です。
集合の中身は、プログラムを作るときに決まっています。そのため、キーを並べ替えたものも、プログラムを作る段階で準備されます。実行時には、二分探索で答えを探すだけです。

たとえば、端末のキー番号のように「決まった数字の一覧」の判定に向いています。

## コード

::: code-group

```zig:line-numbers=95 [日本語訳]
        pub inline fn indexOf(key: T) ?Index {
            if (comptime len == 0) return null;

            // 二分探索で、key 以下でいちばん後ろにある sorted のキーを探す。
            // 各ステップで残りの範囲を半分にする。`n` はコンパイル時に決まっているので、
            // この繰り返しは固定の回数の処理に展開される。
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

- **二分探索**: 並んだ値の中から、真ん中の値と比べて、探す範囲を半分ずつ減らしていく方法です。N 個の中から、だいたい log2(N) 回の比較で見つけられます。
- **`comptime`**: 値をプログラムを作るときに計算させる指定です。`comptime var` や `comptime n / 2` のように書きます。
- **`inline while`**: 繰り返しを、コンパイル時に展開する書き方です。回数が決まっていれば、ループの仕組みが消えて、同じ処理が並んだ形になります。
- **`table.sorted`**: コンパイル時に並べ替えたキーの配列です。
- **`?Index`**: 見つからないかもしれない戻り値です。見つからないときは `null` を返します。
- **`inline fn`**: 呼び出し先の中身を、呼び出し側に直接展開する指定です。

## 何をしているか

### 1. 空の集合は、すぐに null

```zig:line-numbers=96
            if (comptime len == 0) return null;
```

キーが 1 つもない集合では、探すまでもなく `null` です。この判定もコンパイル時に行われるので、実行時には何も残りません。

### 2. 残りの範囲を、半分ずつ減らす

```zig:line-numbers=101
            var base: usize = 0;
            comptime var n: usize = len;
            inline while (n > 1) {
                const half = comptime n / 2;
                base = if (table.sorted[base + half] <= key) base + half else base;
                n -= half;
            }
```

`n` は、いま探している範囲の大きさです。最初は `len`（キーの数）です。各回で `half` を計算し、`base + half` の値が `key` 以下なら、`base` をその位置へ進めます。そのあと、範囲を `half` だけ減らします。

`n` と `half` が `comptime` なので、この `inline while` は、キーの数に応じた回数の処理として、プログラムの中に並んで作られます。

### 3. 見つかったかを確かめる

```zig:line-numbers=109
            if (table.sorted[base] != key) return null;
            return table.original[base];
```

二分探索が止まった位置 `base` のキーが、本当に `key` と同じかを確かめます。違えば `null` です。同じなら、並べ替える前の元の位置 `table.original[base]` を返します。元の一覧での番号が、呼び出し側に返る答えです。

## ここがすごい

- **並べ替えはプログラムを作る時に**: キーの並べ替えは、`table` という定数を作るときに 1 回だけ行われます。実行時には、並んだ結果を読むだけです。
- **ループの回数が固定**: `inline while` と `comptime` により、探索の手順が固定の命令列になります。データの大きさによって処理が変わる心配がありません。
- **重複を防ぐ**: 並べ替えたあとで同じ値が隣にあれば、`@compileError` でビルドを止めます。キーの重複は、プログラムの誤りとして扱います。
- **元の番号を返す**: `table.original` によって、並べ替えた後の位置ではなく、もとの `keys` の位置を返します。利用側は、自分が書いた順番のまま番号を使えます。

## まとめ

- 集合の中身がプログラムを作る時点で決まっているなら、並べ替えと探索の準備を前もって済ませられます。
- 二分探索の繰り返しを `inline while` で展開すると、実行時のループの仕組みが不要になります。
- 見つかったら、もとの一覧での番号を返すので、利用側の都合に合わせられます。
- 重複したキーは、ビルドの段階で止めて、誤りを早く見つけます。
