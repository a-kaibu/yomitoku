---
title: 列の末尾から、指定した値の集まりに含まれる要素を取り除く
description: Zig 標準ライブラリの mem.trimEnd。末尾から、取り除く値の集合に含まれる要素が続く間だけ位置を戻し、残りのスライスを返す。元の列は変えない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1228, 1232]
function: trimEnd
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`trimEnd` は、スライスの末尾から、指定した文字の集まりに含まれる要素を取り除く関数です。たとえば、行末の改行や空白だけを取り除けます。先頭側の `trimStart` の、末尾版です。

## コード

```zig:line-numbers=1228
pub fn trimEnd(comptime T: type, slice: []const T, values_to_strip: []const T) []const T {
    var end: usize = slice.len;
    while (end > 0 and findScalar(T, values_to_strip, slice[end - 1]) != null) : (end -= 1) {}
    return slice[0..end];
}
```

## 前提知識

- **スライス**: 配列の一部を指す値です。切り出しはコピーなしで行えます。
- **`findScalar`**: 同じファイルの関数で、要素が集合に含まれるかを調べます。見つからなければ `null` を返します。
- **`while` の継続式**: `while (条件) : (更新) {}` で、条件が真の間、更新しながら回ります。ここでは末尾の位置を 1 つずつ戻します。
- **`slice[0..end]`**: 先頭から `end` までを切り出す書き方です。
- **`trimRight`**: 同じ関数を指す古い名前です。非推奨です。

## 何をしているか

### 1. 末尾の要素が集合に含まれる間、位置を戻す

```zig:line-numbers=1229
    var end: usize = slice.len;
    while (end > 0 and findScalar(T, values_to_strip, slice[end - 1]) != null) : (end -= 1) {}
```

`end` を末尾から始め、`slice[end - 1]` が `values_to_strip` に含まれる間、1 つずつ戻します。含まれなくなったところで止まります。

### 2. 先頭から残りを切り出して返す

```zig:line-numbers=1231
    return slice[0..end];
```

`slice[0..end]` で、取り除いた後の残りを返します。元の配列は変わりません。

## ここがすごい

- **コピーをしない**: 新しい配列を作らず、元のデータの一部を指します。
- **先頭版と対称**: 同じ形の `trimStart` と、ループの向きだけが違います。
- **空の列でも安全**: `end > 0` の確認で、空のスライスを正しく扱います。
- **テストが例を示す**: ファイルの `test` は、末尾の改行と空白を取る例を示しています。

## まとめ

- `trimEnd` は、末尾から指定の要素を取り除いた残りを返します。
- 新しいデータは作らず、元のスライスの一部を指します。
- 先頭側の `trimStart` と対で使えます。
