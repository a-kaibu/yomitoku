---
title: 2 つの範囲を、両方を含む 1 つの範囲にまとめる
description: ZLS の locMerge。2 つの Loc の開始の小さい方と、終了の大きい方を取って、両方を包む範囲を作る。範囲の和集合の外側の形を求める。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [646, 651]
function: locMerge
difficulty: 1
format: 2
tags: [アルゴリズム, データ構造, 標準ライブラリ]
---

## ひとことで

`locMerge` は、2 つの範囲を受け取り、両方をすっぽり含む 1 つの範囲を返す関数です。範囲が離れていても、間の部分を含めて 1 つにまとめます。ZLS で、複数のトークンにまたがる編集範囲を 1 つにするときなどに使われます。

## コード

```zig:line-numbers=646
pub fn locMerge(a: Loc, b: Loc) Loc {
    std.debug.assert(a.start <= a.end and b.start <= b.end);
    return .{
        .start = @min(a.start, b.start),
        .end = @max(a.end, b.end),
    };
```

## 前提知識

- **`Loc`**: `start` と `end` を持つ範囲です。`end` は範囲に含まれない位置です。
- **和集合の外形**: 2 つの範囲を両方含む最小の範囲です。重なっていても、離れていても、この形で 1 つに表せます。
- **`@min` と `@max`**: 2 つの値の小さい方、大きい方を返す組み込み関数です。
- **構造体のリテラル（`.{ .start = ..., .end = ... }`）**: 名前付きの値を並べて `Loc` を作る書き方です。型は戻り値の型から決まります。
- **前提の確認**: 2 つの範囲とも、開始が終了以下であることを `assert` で確かめます。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=647
    std.debug.assert(a.start <= a.end and b.start <= b.end);
```

両方の範囲が正しい形（開始が終了以下）であることを確かめます。

### 2. 開始の小さい方と、終了の大きい方を取る

```zig:line-numbers=648
    return .{
        .start = @min(a.start, b.start),
        .end = @max(a.end, b.end),
    };
```

`start` には 2 つの開始のうち小さい方を、`end` には 2 つの終了のうち大きい方を入れます。その結果、両方を包む範囲ができます。

## ここがすごい

- **1 回の関数で終わる**: 4 つの値を比べるだけで、結果が必ず両方を含みます。条件分岐がないので、読み間違えにくいです。
- **離れた範囲も扱える**: 重なっていなくても、間を含めて 1 つにします。範囲の集まりを扱うときに便利です。
- **テストが 5 つの場合を並べる**: ファイルの `test` は、左に寄った範囲、重なる範囲、内側に含まれる範囲などの例を示しています。
- **`locIntersect` と対になる**: 重なりを調べる関数と、和を作る関数が、同じ `Loc` の上で組になっています。

## まとめ

- `locMerge` は、2 つの範囲の開始の小さい方と、終了の大きい方を取ります。
- 結果は、両方を含む最小の範囲になります。
- `locIntersect` と組み合わせると、範囲の重なりと和を両方扱えます。
