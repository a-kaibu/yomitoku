---
title: 先頭から 1 要素ずつコピーする、前方向のコピー関数
description: Zig 標準ライブラリの mem.copyForwards。コピー元の要素を先頭から順に、コピー先へ代入する。重なる場合はコピー先がコピー元より前にある必要がある、非推奨の関数。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [238, 240]
function: copyForwards
difficulty: 2
format: 2
tags: [メモリ管理, 低レイヤ, 標準ライブラリ]
---

## ひとことで

`copyForwards` は、コピー元の要素を、先頭から順に 1 つずつコピー先へ書き込む関数です。前から後ろへ書くので、コピー先がコピー元より前にあるような重なりでも、正しくコピーできます。ただし、現在は非推奨で、`@memmove` の使用が勧められています。

## コード

```zig:line-numbers=238
pub fn copyForwards(comptime T: type, dest: []T, source: []const T) void {
    for (dest[0..source.len], source) |*d, s| d.* = s;
}
```

## 前提知識

- **スライス**: 配列の一部を指す値です。`dest` と `source` の 2 つを受け取ります。
- **重なるコピー**: コピー元とコピー先の領域が一部重なるコピーです。書く順番を間違えると、読みたい値を先に壊してしまいます。
- **前方向（forwards）**: 先頭から末尾へ向かってコピーする向きです。
- **`for` の複数の入力**: `for (a, b) |x, y|` のように、2 つのスライスを同時に回す書き方です。
- **`|*d, s|`**: `d` はコピー先の要素へのポインタ、`s` はコピー元の値です。

## 何をしているか

### 1. コピー先の長さを揃えて回す

```zig:line-numbers=239
    for (dest[0..source.len], source) |*d, s| d.* = s;
```

`dest[0..source.len]` で、コピー元と同じ長さの部分だけを対象にします。`for` の 2 つの入力を同時に回し、要素を組にして取り出します。

### 2. 要素ごとに代入する

```zig:line-numbers=239
    for (dest[0..source.len], source) |*d, s| d.* = s;
```

各要素 `s` を、コピー先の `d` へ書き込みます。先頭から順に書くので、コピー元の値を読む前に壊すことはありません。

## ここがすごい

- **重なりの向きが明確**: 前方向に書くので、コピー先がコピー元より前にある重なりに対応します。向きが違う場合は、`copyBackwards` を使います。
- **ループで中身が見える**: 1 要素ずつの代入なので、動きが読み手にそのまま伝わります。
- **型に依存しない**: `comptime T` で、どの要素の型でも使えます。
- **非推奨が注釈で示される**: ドキュメントには、`@memmove` を使うように書かれています。組み込みの移動の方が、速く安全だからです。

## まとめ

- `copyForwards` は、先頭から 1 要素ずつコピーします。
- 重なりがある場合は、コピー先がコピー元より前にあるときに使えます。
- 現在は非推奨で、`@memmove` の使用が勧められています。
