---
title: 列の末尾から探して、1 つの値が最後に現れる位置を見つける
description: Zig 標準ライブラリの mem.findScalarLast。末尾の位置から 1 つずつ前に戻りながら比べ、最初に一致した位置を返す。一致がなければ null を返す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [1267, 1274]
function: findScalarLast
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`findScalarLast` は、スライスの中で指定の値が最後に現れる位置を探す関数です。後ろから探すので、最初に見つかったものが、最後の出現になります。

## コード

```zig:line-numbers=1267
pub fn findScalarLast(comptime T: type, slice: []const T, value: T) ?usize {
    var i: usize = slice.len;
    while (i != 0) {
        i -= 1;
        if (slice[i] == value) return i;
    }
    return null;
}
```

## 前提知識

- **最後の出現**: 同じ値が複数あるとき、一番後ろにあるものです。
- **`while (i != 0)`**: 添字が 0 になるまで回るループです。`usize` は負にならないので、この書き方で終わりを判定します。
- **`i -= 1` を先に**: 先に 1 つ減らしてから比べると、`slice[i]` が範囲内であることが保たれます。
- **`?usize`**: 見つかれば位置、見つからなければ `null` です。
- **`findScalar`**: 先頭から探す同じ系統の関数です。

## 何をしているか

### 1. 末尾から 1 つずつ戻って比べる

```zig:line-numbers=1268
    var i: usize = slice.len;
    while (i != 0) {
        i -= 1;
        if (slice[i] == value) return i;
    }
```

末尾の位置 `i` から、1 つずつ前へ戻ります。`i -= 1` を先にしてから `slice[i]` を比べるので、範囲の外を読むことはありません。一致した位置を、そのまま返します。

### 2. 一致がなければ null

```zig:line-numbers=1273
    return null;
```

ループが終わるまで一致がなければ、`null` を返します。

## ここがすごい

- **前から探す版と対**: 同じ値の別の出現（最後）を、同じ形の関数で求められます。
- **範囲外を読まない順序**: 先に減らしてから読むので、添字が 0 のときも安全です。
- **早く止まる**: 見つかった時点で返すので、必要な分だけ読みます。
- **型で結果を表す**: `?usize` なので、見つからない場合を明示的に扱えます。

## まとめ

- `findScalarLast` は、末尾から探して、値の最後の位置を返します。
- 添字は、先に減らしてから読むので、範囲の外を読みません。
- 見つからなければ `null` を返します。
