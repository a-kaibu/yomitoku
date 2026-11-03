---
title: 列の両端から、指定した値の集まりに含まれる要素を取り除く
description: Zig 標準ライブラリの mem.trim。先頭と末尾のそれぞれから、取り除く値が続く間だけ位置を進めたり戻したりし、残りのスライスを返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1242, 1248]
function: trim
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`trim` は、スライスの両端から、指定した文字の集まりに含まれる要素を取り除く関数です。文字列の前後の空白や改行を、まとめて取り除くときに使えます。

## コード

```zig:line-numbers=1242
pub fn trim(comptime T: type, slice: []const T, values_to_strip: []const T) []const T {
    var begin: usize = 0;
    var end: usize = slice.len;
    while (begin < end and findScalar(T, values_to_strip, slice[begin]) != null) : (begin += 1) {}
    while (end > begin and findScalar(T, values_to_strip, slice[end - 1]) != null) : (end -= 1) {}
    return slice[begin..end];
}
```

## 前提知識

- **`trimStart` と `trimEnd`**: 同じファイルにある、片側だけを取り除く関数です。`trim` はこの 2 つを組み合わせた形です。
- **`findScalar`**: 要素が集合に含まれるかを調べる関数です。
- **2 つの `while`**: 先頭側と末尾側を、順番に処理するループです。
- **`begin` と `end`**: 残す範囲の先頭と、終わりの位置です。
- **`slice[begin..end]`**: 範囲を切り出す書き方です。

## 何をしているか

### 1. 先頭から取り除く

```zig:line-numbers=1243
    var begin: usize = 0;
    var end: usize = slice.len;
    while (begin < end and findScalar(T, values_to_strip, slice[begin]) != null) : (begin += 1) {}
```

`begin` を先頭から進めて、集合に含まれる要素を飛ばします。

### 2. 末尾から取り除く

```zig:line-numbers=1246
    while (end > begin and findScalar(T, values_to_strip, slice[end - 1]) != null) : (end -= 1) {}
    return slice[begin..end];
```

`end` を末尾から戻して、集合に含まれる要素を飛ばします。`end > begin` の条件で、先頭側で消えた部分に入り込まないようにしています。最後に、`slice[begin..end]` で残りを返します。

## ここがすごい

- **2 つの条件を揃える**: 末尾側のループの条件に `end > begin` を入れているので、全部取り除かれた列でも正しく空を返します。
- **コピーなし**: 元の列の一部を指すスライスを返します。
- **組み合わせの単純さ**: 片側の処理を 2 回書くだけで、両端の処理ができます。
- **テストが両方を確かめる**: ファイルの `test` は、両端に空白がある例と、片側しかない例を確かめています。

## まとめ

- `trim` は、両端から指定の要素を取り除き、残りを返します。
- 末尾側の条件に `end > begin` を入れて、重なりを防いでいます。
- 元のデータはコピーせず、一部を指します。
