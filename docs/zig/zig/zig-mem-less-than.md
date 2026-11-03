---
title: 2 つのスライスを辞書順に比べて、左が小さいかを返す
description: Zig 標準ライブラリの mem.lessThan。order の結果が lt かどうかを返すだけの関数で、ソートの比較関数として使える。空の列と短い列の扱いも決まっている。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [695, 697]
function: lessThan
difficulty: 1
format: 2
tags: [文字列処理, 標準ライブラリ, イディオム]
---

## ひとことで

`lessThan` は、2 つのスライスを辞書順に比べて、左の方が小さいかどうかを `true` か `false` で返す関数です。文字列のソートの比較関数として、そのまま使えます。

## コード

```zig:line-numbers=695
pub fn lessThan(comptime T: type, lhs: []const T, rhs: []const T) bool {
    return order(T, lhs, rhs) == .lt;
}
```

## 前提知識

- **辞書順**: 先頭の要素から順に比べて、最初に違うところで大小を決める並べ方です。片方が途中で終わったら、短い方が小さいとみなします。
- **`order`**: 同じファイルにある関数で、2 つのスライスを比べて `lt`、`eq`、`gt` のどれかを返します。
- **`std.math.Order`**: 比較の結果を表す列挙型です。
- **比較関数（comparator）**: ソートで 2 つの要素の大小を答える関数です。`lessThan` の形をしていると、ソートの関数にそのまま渡せます。
- **`comptime T`**: 要素の型を、コンパイル時に決める引数です。

## 何をしているか

### 1. order の結果を使う

```zig:line-numbers=696
    return order(T, lhs, rhs) == .lt;
```

`order(T, lhs, rhs)` で、2 つのスライスの順序を求めます。その結果が `.lt`（小さい）かどうかを `==` で調べ、`bool` にして返します。

この関数は、比べ方の本体を `order` に任せています。`lessThan` は、結果の形を「小さいか」の 1 つの問いに変えるだけです。

## ここがすごい

- **比べ方が 1 か所に**: 大小の比べ方は `order` にあるので、`lessThan` と `order` の答えは必ず一致します。
- **ソートに渡せる形**: 「左が右より小さいか」を答える関数は、ソートの比較の標準的な形です。そのまま渡せます。
- **空と短い列の扱い**: テストは、空の列同士、空と非空、接頭辞の関係などを並べています。境界の例がそろっています。
- **名前が意図を語る**: `lessThan` という名前で、「小さいかどうか」を答えることが一目で分かります。

## まとめ

- `lessThan` は、2 つのスライスを辞書順に比べて、左が小さいかを返します。
- 比べ方は `order` に任せ、この関数は「小さいか」だけを答えます。
- ソートの比較関数として、そのまま使えます。
