---
title: 順番を保ったまま、途中の要素を 1 つ削除する
description: Zig 標準ライブラリの ArrayList の orderedRemove。削除の後ろの要素をずらして詰めるので、並び順は保たれるが、計算量は要素数に比例する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/array_list.zig
lines: [270, 274]
function: AlignedManaged.orderedRemove
difficulty: 1
format: 2
tags: [データ構造, 標準ライブラリ, 防御的プログラミング]
---

## ひとことで

`orderedRemove` は、可変長の配列（ArrayList）から、指定した位置の要素を取り出して削除する関数です。削除したあとも、残りの要素の並び順は変わりません。

## コード

```zig:line-numbers=270
        pub fn orderedRemove(self: *Self, i: usize) T {
            const old_item = self.items[i];
            self.replaceRangeAssumeCapacity(i, 1, &.{});
            return old_item;
        }
```

## 前提知識

- **ArrayList**: 長さを自由に変えられる配列です。内部では、連続したメモリに要素を並べて持っています。
- **`items`**: 現在の要素だけを指すスライスです。`self.items[i]` で、i 番目の要素を読めます。
- **`replaceRangeAssumeCapacity`**: 指定した範囲の要素を、別の要素の列に置き換える内部の関数です。「容量は足りている」と仮定して、メモリの確保を行いません。
- **`&.{}`**: 要素のない空のスライスです。ここでは、範囲の要素を何も入れずに消すために使います。
- **`swapRemove`**: 同じ削除でも、要素の順番を変えてよい場合に使う、もう 1 つの関数です。

## 何をしているか

関数は、3 つの手順で動きます。

### 1. 値を退避する

```zig:line-numbers=271
            const old_item = self.items[i];
```

`self.items[i]` の値を変数へ退避します。消す前に値を取り出しておくので、後で返せます。

### 2. 範囲の要素を空の列に置き換える

```zig:line-numbers=272
            self.replaceRangeAssumeCapacity(i, 1, &.{});
```

`replaceRangeAssumeCapacity(i, 1, &.{})` で、位置 `i` から 1 個の要素を、空の列へ置き換えます。これで要素が消え、後ろの要素が前へずれます。

### 3. 退避した値を返す

```zig:line-numbers=273
            return old_item;
```

退避しておいた値を返します。後ろの要素が 1 つずつ前に詰まるので、残りの並び順は元のままです。

## ここがすごい

- **並び順を保つ**: 後ろの要素を前に詰めるので、相対的な順番は変わりません。順序が意味を持つ一覧の管理に向いています。
- **削除した値を返す**: 消す前に値を取り出して返すので、呼び出し側は「取り出す」と「消す」を 1 回の呼び出しで済ませられます。
- **範囲の確認をする**: 関数のドキュメントに「`i` が範囲内であること」「空でないこと」が書かれています。Zig では、この条件を満たさない場合に安全チェックで止まります。
- **コストが分かりやすい**: 後ろの要素を全部ずらすので、計算量は O(N) です。ドキュメントには、この点も明記されています。
- **代わりの方法を示す**: 順番が不要なら `swapRemove` を使う、と書いてあります。目的によって選べます。

## まとめ

- `orderedRemove` は、後ろの要素を前に詰めて、並び順を保ったまま 1 つ消します。
- 退避した値を返すので、取り出しと削除を一緒に行えます。
- 順番が不要なら、より速い `swapRemove` を選びます。
