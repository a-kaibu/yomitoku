---
title: 1 バイトが英字か数字かを、範囲の switch で調べる
description: Zig 標準ライブラリの ascii.isAlphanumeric。0 から 9、A から Z、a から z の範囲を switch の範囲指定で書き、英数字かどうかを判定する。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/ascii.zig
lines: [96, 101]
function: isAlphanumeric
difficulty: 1
format: 2
tags: [文字列処理, イディオム, 標準ライブラリ]
---

## ひとことで

`isAlphanumeric` は、1 バイトの文字が英字か数字かを判定する関数です。ASCII の 0 から 9、A から Z、a から z の 3 つの範囲だけを、真とします。

## コード

```zig:line-numbers=96
pub fn isAlphanumeric(c: u8) bool {
    return switch (c) {
        '0'...'9', 'A'...'Z', 'a'...'z' => true,
        else => false,
    };
}
```

## 前提知識

- **ASCII**: 1 バイトで、英字、数字、記号、制御文字などを表す文字コードです。
- **`switch`**: 値を複数の場合と比べる Zig の分岐です。`if` を並べるより、範囲の一覧を見やすく書けます。
- **範囲の書き方（`'0'...'9'`）**: `switch` の中で、両端を含む範囲を書く記法です。
- **`else`**: どの場合にも当てはまらないときの処理です。ここでは `false` を返します。
- **文字リテラル**: `'0'` のようにシングルクォートで囲んだ 1 文字です。その値は文字コードの数値として扱われます。

## 何をしているか

### 1. 範囲を switch で並べる

```zig:line-numbers=97
    return switch (c) {
        '0'...'9', 'A'...'Z', 'a'...'z' => true,
        else => false,
    };
```

`'0'...'9'`、`'A'...'Z'`、`'a'...'z'` の 3 つの範囲を、1 つの `switch` に並べています。どれかに当てはまれば `true`、そうでなければ `else` の `false` を返します。

### 2. 比べる回数を見る

この関数は、`c` を 1 回だけ読みます。範囲の比較も、コンパイラが効率よく処理します。この小さな関数は、文字の種類を調べる関数の基本の形になっています。

## ここがすごい

- **意図が一目でわかる**: 3 つの範囲を並べるだけで、「英字と数字」という意味が、そのままコードに現れています。
- **文字の数値を覚えなくてよい**: `'A'` や `'0'` と書けるので、ASCII の番号を覚えなくても使えます。
- **他の判定の土台**: 同じファイルの `isAlphabetic` は英字だけ、`isDigit` は数字だけを判定します。組み合わせて使う小さな部品です。
- **分岐の形がそろう**: 範囲の表を並べる形は、他の文字の分類でも使われます。読み方を覚えると、ファイル全体が読みやすくなります。

## まとめ

- `isAlphanumeric` は、3 つの範囲を `switch` で並べて英数字を判定します。
- 文字を数値ではなく文字リテラルで書けるので、読みやすくなります。
- 同じファイルの `isAlphabetic` や `isDigit` と組み合わせて使えます。
