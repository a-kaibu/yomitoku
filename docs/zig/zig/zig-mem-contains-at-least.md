---
title: 部分列が、指定の回数以上、重ならずに現れるかを判定する
description: Zig 標準ライブラリの mem.containsAtLeast。部分列（needle）を前から順に探し、見つかるたびに数える。指定の回数に達した時点で true を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1732, 1746]
function: containsAtLeast
difficulty: 3
format: 2
tags: [文字列処理, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`containsAtLeast` は、スライスの中に、ある部分列が何回以上現れるかを判定する関数です。たとえば、文字列に `"ab"` が 2 回以上あるかを調べられます。指定の回数に達した時点で、残りを探さずに `true` を返します。

## コード

```zig:line-numbers=1732
pub fn containsAtLeast(comptime T: type, haystack: []const T, expected_count: usize, needle: []const T) bool {
    if (needle.len == 1) return containsAtLeastScalar(T, haystack, expected_count, needle[0]);
    assert(needle.len > 0);
    if (expected_count == 0) return true;

    var i: usize = 0;
    var found: usize = 0;

    while (indexOfPos(T, haystack, i, needle)) |idx| {
        i = idx + needle.len;
        found += 1;
        if (found == expected_count) return true;
    }
    return false;
}
```

## 前提知識

- **部分列（needle）**: 探される側の列です。`haystack` の中から探します。
- **重ならない出現**: 1 回見つかった後は、その末尾から探し直します。`"aa"` の中の `"aa"` は、1 回だけと数えます。
- **`indexOfPos`**: 指定の位置から部分列を探す、同じファイルの関数です。
- **`?usize`**: 見つかった位置か `null` です。`while` の `|idx|` で、見つかった間だけ回ります。
- **1 要素の部分列**: `needle.len == 1` のときは、より速い `containsAtLeastScalar` に任せます。

## 何をしているか

### 1. 特別な場合を先に処理する

```zig:line-numbers=1733
    if (needle.len == 1) return containsAtLeastScalar(T, haystack, expected_count, needle[0]);
    assert(needle.len > 0);
    if (expected_count == 0) return true;
```

部分列が 1 要素なら、スカラー版に任せます。部分列が空なら、assert で止めます。回数が 0 なら、必ず真です。

### 2. 見つかるたびに数える

```zig:line-numbers=1737
    var i: usize = 0;
    var found: usize = 0;

    while (indexOfPos(T, haystack, i, needle)) |idx| {
        i = idx + needle.len;
        found += 1;
        if (found == expected_count) return true;
    }
```

`indexOfPos` で、位置 `i` から部分列を探します。見つかったら、次の探索の開始位置を、一致の末尾へずらして、`found` を 1 増やします。`found` が指定の回数に達したら、すぐ `true` を返します。

### 3. 見つからなければ偽

```zig:line-numbers=1745
    return false;
```

ループを抜けても回数に届かなければ、`false` を返します。

## ここがすごい

- **早く打ち切る**: 指定の回数に達した時点で止まるので、全体を探す必要がありません。
- **重ならない数え方**: 一致の末尾から探し直すので、重なった出現を二重に数えません。
- **特別な場合の振り分け**: 1 要素の場合は、速い専用の関数に任せています。
- **回数の意味が明確**: `expected_count` が 0 なら必ず真になる、という境界の扱いも、先頭で明示されています。

## まとめ

- `containsAtLeast` は、部分列が指定回数以上、重ならずに現れるかを判定します。
- 一致の末尾から探し直して、重なりを二重に数えません。
- 指定回数に達した時点で打ち切ります。
