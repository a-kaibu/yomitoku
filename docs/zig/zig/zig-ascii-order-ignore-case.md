---
title: 大文字と小文字を区別せずに、文字列の辞書順を比べる
description: Zig 標準ライブラリの ascii.orderIgnoreCase。両方の文字列を 1 文字ずつ小文字にして比べ、最初に違うところで順番を決める。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/ascii.zig
lines: [422, 435]
function: orderIgnoreCase
difficulty: 2
format: 2
tags: [文字列処理, 標準ライブラリ, アルゴリズム]
---

## ひとことで

`orderIgnoreCase` は、2 つの ASCII 文字列を、大文字と小文字を区別せずに並べ替えるときの順番を返す関数です。「apple」と「Banana」のような文字列を、辞書の順に並べられます。

## コード

```zig:line-numbers=422
pub fn orderIgnoreCase(lhs: []const u8, rhs: []const u8) std.math.Order {
    if (lhs.ptr != rhs.ptr) {
        const n = @min(lhs.len, rhs.len);
        var i: usize = 0;
        while (i < n) : (i += 1) {
            switch (std.math.order(toLower(lhs[i]), toLower(rhs[i]))) {
                .eq => continue,
                .lt => return .lt,
                .gt => return .gt,
            }
        }
    }
    return std.math.order(lhs.len, rhs.len);
}
```

## 前提知識

- **辞書順（lexicographical order）**: 先頭の文字から順に比べて、最初に違う文字で大小を決める並べ方です。片方が途中で終わったら、短い方が先になります。
- **ASCII の大文字と小文字**: `A` と `a` は、ビットの 1 つ（0x20）だけが違います。そのため、小文字に変換する処理は、ビットの操作で行えます。
- **`std.math.Order`**: `lt`、`eq`、`gt` の 3 つの値を持つ列挙型です。比較の結果を表します。
- **`@min`**: 2 つの値のうち小さい方を返す組み込み関数です。
- **`lhs.ptr != rhs.ptr`**: 2 つのスライスが同じメモリを指していないかを調べています。同じなら、中身を比べる必要がありません。

## 何をしているか

関数は、3 段階で結果を決めます。

### 1. 同じ場所を指していないか確かめる

```zig:line-numbers=423
    if (lhs.ptr != rhs.ptr) {
        const n = @min(lhs.len, rhs.len);
        var i: usize = 0;
```

2 つのスライスが同じ先頭の位置を指していれば、中身は同じです。その場合は、1 文字ずつの比較をスキップします。ここで `n` は、2 つの長さの短い方です。

### 2. 1 文字ずつ小文字にして比べる

```zig:line-numbers=426
        while (i < n) : (i += 1) {
            switch (std.math.order(toLower(lhs[i]), toLower(rhs[i]))) {
                .eq => continue,
                .lt => return .lt,
                .gt => return .gt,
            }
        }
```

`toLower` で両方の文字を小文字にしてから比べます。違う文字が見つかれば、`lt` か `gt` をすぐ返します。同じ文字なら `continue` で次へ進みます。

### 3. 長さで順番を決める

```zig:line-numbers=434
    return std.math.order(lhs.len, rhs.len);
```

ここまで全部同じだった場合は、長さの比較で決めます。短い方が先になります。

## ここがすごい

- **比較の途中で止まる**: 違う文字が見つかった時点で結果を返すので、長い文字列でも全部を読むことはほとんどありません。
- **大小を一度に変換**: 小文字に変換する `toLower` は、ビットの操作だけなので、速く動きます。大文字の表を用意する必要がありません。
- **長さの扱いが明確**: 先頭の部分が同じなら、短い方が先になる、という辞書順の規則を、最後の 1 行で示しています。
- **`eqlIgnoreCase` と同じ考え方**: 同じファイルの `eqlIgnoreCase` も、小文字に揃えて比べています。等しいか、順番がどうか、という 2 つの関数の作りが対になっています。

## まとめ

- `orderIgnoreCase` は、両方を小文字にしながら、最初に違う文字で順番を決めます。
- 同じ文字が続いた場合は、長さの比較で順番を決めます。
- 比較は違う文字が見つかった時点で止まるので、無駄な処理がありません。
