---
title: 型の情報を見て、中身までさかのぼって比べる深い比較
description: Ghostty の deepEqual。コンパイル時に型を調べ、文字列、数値、配列、構造体などの種類ごとに中身を比べる。型に equal があればその関数に任せる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/comparison.zig
lines: [9, 38]
function: deepEqual
difficulty: 3
format: 2
tags: [型システム, メタプログラミング, 防御的プログラミング]
---

## ひとことで

`deepEqual` は、2 つの値が「中身まで同じ」かを比べる関数です。たとえば、構造体の中に配列や文字列が入っていても、その中身まで順番に比べます。
ポインタの比較とは違い、同じ内容の別の値も「同じ」と判定します。テストで、期待する値と実際の値が一致するかを確かめる場面で使われます。

比べる方法は、型によって違います。関数の中で、`comptime` の型の情報を見て、型の種類ごとに比べ方を選んでいます。

## コード

::: code-group

```zig:line-numbers=9 [日本語訳]
pub fn deepEqual(comptime T: type, old: T, new: T) bool {
// まず、名前のある既知の型を扱う
    switch (T) {
        inline []const u8,
        [:0]const u8,
        => return std.mem.eql(u8, old, new),

        []const [:0]const u8,
        => {
            if (old.len != new.len) return false;
            for (old, new) |a, b| {
                if (!std.mem.eql(u8, a, b)) return false;
            }

            return true;
        },

        else => {},
    }

// 型の種類（型の情報）に分けて比べる
    switch (@typeInfo(T)) {
        .void => return true,

        inline .bool,
        .int,
        .float,
        .@"enum",
        => return old == new,

```

```zig:line-numbers=9 [原文]
pub fn deepEqual(comptime T: type, old: T, new: T) bool {
    // Do known named types first
    switch (T) {
        inline []const u8,
        [:0]const u8,
        => return std.mem.eql(u8, old, new),

        []const [:0]const u8,
        => {
            if (old.len != new.len) return false;
            for (old, new) |a, b| {
                if (!std.mem.eql(u8, a, b)) return false;
            }

            return true;
        },

        else => {},
    }

    // Back into types of types
    switch (@typeInfo(T)) {
        .void => return true,

        inline .bool,
        .int,
        .float,
        .@"enum",
        => return old == new,

```

:::
## 前提知識

- **`comptime T: type`**: 型を引数として受け取る書き方です。`deepEqual(u32, a, b)` のように、型を指定して呼びます。
- **`switch (T)`**: 型そのものを値として調べる書き方です。`[]const u8` のように、特定の型かを判定できます。
- **`@typeInfo(T)`**: 型の情報を、タグ付きの値として取り出す組み込み関数です。`.int`、`.optional`、`.array`、`.@"struct"` などの種類があります。
- **`std.mem.eql`**: 2 つのスライスの中身が同じかを比べる標準の関数です。
- **`@hasDecl(T, "equal")`**: 型に `equal` という関数があるかを、コンパイル時に調べます。
- **`inline`**: 呼び出しや繰り返しを、コンパイル時に展開する指定です。型ごとに別の処理が作られます。

## 何をしているか

### 1. 文字列の型は、中身をそのまま比べる

```zig:line-numbers=11
    switch (T) {
        inline []const u8,
        [:0]const u8,
        => return std.mem.eql(u8, old, new),
```

型が `[]const u8` や `[:0]const u8`（文字列）なら、`std.mem.eql` で中身を比べます。ポインタの位置が違っても、同じ文字なら `true` です。

### 2. 文字列の配列は、要素ごとに比べる

```zig:line-numbers=16
        []const [:0]const u8,
        => {
            if (old.len != new.len) return false;
            for (old, new) |a, b| {
                if (!std.mem.eql(u8, a, b)) return false;
            }

            return true;
        },
```

文字列の配列は、まず長さを比べます。長さが同じなら、1 つずつ文字列の中身を比べます。途中で違うものがあれば、すぐに `false` を返します。

### 3. 型の種類で分ける

```zig:line-numbers=30
    switch (@typeInfo(T)) {
        .void => return true,

        inline .bool,
        .int,
        .float,
        .@"enum",
        => return old == new,
```

ここでは、型の種類で分岐します。`void` は、値がないので常に等しいと判定します。`bool`、整数、浮動小数点数、列挙型は、`==` で比べられます。

### 4. オプショナルと配列は中へ進む

```zig:line-numbers=39
        .optional => |info| {
            if (old == null and new == null) return true;
            if (old == null or new == null) return false;
            return deepEqual(info.child, old.?, new.?);
        },

        .array => |info| for (old, new) |old_elem, new_elem| {
            if (!deepEqual(
                info.child,
                old_elem,
                new_elem,
            )) return false;
        } else return true,
```

オプショナルは、両方が `null` なら等しく、片方だけ `null` なら違います。両方に値があれば、中身の型 `info.child` で、同じ関数を再び呼びます。配列は、要素を 1 つずつ同じ関数で比べます。

### 5. 構造体は、equal があれば任せる

```zig:line-numbers=53
        .@"struct" => |info| {
            if (@hasDecl(T, "equal")) return old.equal(new);
```

構造体に `equal` という関数があれば、その関数に比べ方を任せます。型が独自の比べ方を持つときは、その定義を優先するという考え方です。

## ここがすごい

- **型ごとに比べ方を自動で選ぶ**: 比べる関数を型ごとに書かなくても、型の情報から自動で比べ方が決まります。新しい型を追加しても、同じ仕組みで比べられます。
- **再帰で深く比べる**: オプショナルや配列の中にさらに値があれば、同じ関数を呼びます。入れ子になった構造も、同じ形で比べられます。
- **`comptime` で無駄をなくす**: 型の判定はコンパイル時に行われます。実行時には、その型に必要な比べ方だけが残ります。
- **独自の比べ方を尊重**: `equal` を持つ型は、その定義を使います。ポインタを含む型などで、単純な比べ方では不十分な場合にも対応できます。

## まとめ

- 深い比較は、型の種類を見て、中身まで順番に比べる関数です。
- 文字列は `std.mem.eql`、配列は要素ごと、オプショナルは中身の型へ進めます。
- 型が `equal` を持つなら、その定義に任せます。
- 型の判定はコンパイル時に行われるので、実行時の無駄がありません。
