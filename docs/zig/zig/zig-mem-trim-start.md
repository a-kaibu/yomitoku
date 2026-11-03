---
title: 列の先頭から、指定した値の集まりに含まれる要素を取り除く
description: Zig 標準ライブラリの mem.trimStart。先頭から、取り除く値の集合に含まれる要素が続く間だけ位置を進め、残りのスライスを返す。元の列は変えない。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1214, 1218]
function: trimStart
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, 最適化]
---

## ひとことで

`trimStart` は、スライスの先頭から、指定した文字の集まりに含まれる要素を取り除く関数です。たとえば、先頭の空白や改行だけを取り除いて、残りの文字列を得られます。元のデータは変えず、残りの部分を指すスライスを返します。

## コード

```zig:line-numbers=1214
pub fn trimStart(comptime T: type, slice: []const T, values_to_strip: []const T) []const T {
    var begin: usize = 0;
    while (begin < slice.len and findScalar(T, values_to_strip, slice[begin]) != null) : (begin += 1) {}
    return slice[begin..];
}
```

## 前提知識

- **スライス**: 配列の一部を指す値です。切り出しは、新しいデータの作成なしに行えます。
- **`findScalar`**: 同じファイルにある関数で、スライスの中に 1 つの要素があるかを探して、位置を返します。見つからなければ `null` です。
- **`while` の継続式**: `while (条件) : (更新) {}` の形で、条件が真の間、更新を行いながら回る書き方です。
- **`slice[begin..]`**: `begin` から末尾までを切り出す書き方です。
- **`trimLeft`**: 同じ関数を指す古い名前です。非推奨として残されています。

## 何をしているか

### 1. 先頭から取り除く要素を数える

```zig:line-numbers=1215
    var begin: usize = 0;
    while (begin < slice.len and findScalar(T, values_to_strip, slice[begin]) != null) : (begin += 1) {}
```

`begin` を 0 から始め、`slice[begin]` が `values_to_strip` に含まれる間だけ進めます。`findScalar` が `null` でなければ、その要素は取り除く対象です。

### 2. 残りの部分を返す

```zig:line-numbers=1217
    return slice[begin..];
```

`slice[begin..]` で、取り除いた後の残りを切り出して返します。元の配列は変わりません。

## ここがすごい

- **コピーをしない**: 新しい配列を作らず、元のデータを指す部分を返します。メモリの確保が要りません。
- **条件が 2 つ**: 範囲の端を確かめてから、含まれるかを調べています。範囲外のアクセスを避けています。
- **取り除く集合を自由に**: `values_to_strip` で、空白、改行、記号など、どんな組み合わせでも指定できます。
- **テストが例を示す**: ファイルの `test` は、先頭の空白を取る例を示しています。

## まとめ

- `trimStart` は、先頭から指定した要素を取り除いた残りを返します。
- 新しいデータは作らず、元のスライスの一部を指します。
- 末尾側の `trimEnd` と組にして使えます。
