---
title: 2 つの文字列の辞書を、キーごとに照らし合わせて比べる
description: Ghostty の RepeatableStringMap.equal。件数を先に比べ、片方の各キーがもう片方にあり、値も同じかを確かめる。どこかで違えば、すぐ false を返す。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/config/RepeatableStringMap.zig
lines: [97, 104]
function: RepeatableStringMap.equal
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, イディオム]
---

## ひとことで

`equal` は、2 つの文字列の辞書（キーと値の組の集まり）が、同じ内容かを比べる関数です。
Ghostty では、設定ファイルの一部のように、キーと値を繰り返し指定できる項目を扱っています。その項目が、以前の設定と同じかどうかを判定するときに使われます。

同じかどうかは、件数、キー、値の 3 つの順番で比べます。

## コード

```zig:line-numbers=97
pub fn equal(self: RepeatableStringMap, other: RepeatableStringMap) bool {
    if (self.map.count() != other.map.count()) return false;
    var it = self.map.iterator();
    while (it.next()) |entry| {
        const value = other.map.get(entry.key_ptr.*) orelse return false;
        if (!std.mem.eql(u8, entry.value_ptr.*, value)) return false;
    } else return true;
}
```
## 前提知識

- **辞書（map）**: キーから値を探せるデータ構造です。キーは重複しません。
- **`count()`**: 辞書に入っている組の数を返します。
- **`iterator()` と `entry`**: 辞書の中の組を、順に取り出すための仕組みです。`entry.key_ptr` と `entry.value_ptr` で、キーと値を指します。
- **`orelse return false`**: 値がないなら、その場で `false` を返す書き方です。
- **`while (it.next()) |entry| { ... } else return true`**: 繰り返しが最後まで進んだら、`else` の部分を実行する書き方です。途中で `return` すれば、`else` は実行されません。
- **`std.mem.eql`**: 2 つのバイト列が同じかを調べる標準の関数です。

## 何をしているか

### 1. 件数を先に比べる

```zig:line-numbers=98
    if (self.map.count() != other.map.count()) return false;
```

件数が違えば、内容も違います。ここで答えが決まるので、中身を調べずに済みます。

### 2. 片方の組を、もう一方で探す

```zig:line-numbers=99
    var it = self.map.iterator();
    while (it.next()) |entry| {
        const value = other.map.get(entry.key_ptr.*) orelse return false;
```

`self` の組を 1 つずつ取り出し、同じキーを `other` の中から探します。見つからなければ、`orelse` で `false` を返します。

### 3. 値が同じかを比べる

```zig:line-numbers=102
        if (!std.mem.eql(u8, entry.value_ptr.*, value)) return false;
    } else return true;
```

キーが見つかったら、両方の値を `std.mem.eql` で比べます。違えば `false` です。すべての組で一致したら、繰り返しの `else` が実行され、`true` を返します。

## ここがすごい

- **件数で早めに決める**: 件数が違えば、探す前に答えが出ます。無駄な検索を省けます。
- **片方向で十分な理由**: 件数が同じで、片方のすべてのキーがもう一方にあり、値も一致するなら、2 つの辞書は同じです。両方向を調べる必要はありません。キーが重複しないからです。
- **途中で打ち切る**: 1 つでも違う組があれば、すぐ `false` を返します。大きな辞書でも、早く答えが分かることがあります。
- **`else` で最後の結果**: 繰り返しが最後まで進んだら `true` を返す書き方で、成功の条件が 1 か所にまとまっています。

## まとめ

- 2 つの辞書の比較は、件数、キーの存在、値の一致の順に確かめます。
- キーが重複しないので、片方のすべてのキーを調べれば十分です。
- 途中で違いが見つかったら、すぐ `false` を返します。
- 繰り返しの `else` を使うと、全部一致したときの結果を明確に書けます。
