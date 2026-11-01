---
title: 制御バイトの最上位 2 ビットで、空きを一度に見つける
description: hashbrown の SIMD を使わない実装で、EMPTY の制御バイトを探す関数。EMPTY は上位 2 ビットがどちらも 1 なので、隣り合うビットの論理積で判定する。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/control/group/generic.rs
lines: [116, 121]
function: Group::match_empty
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, ビット演算]
---

## ひとことで

`match_empty` は、ハッシュテーブルの **制御バイト（タグ）の並び** の中から、「空き（EMPTY）」の位置を見つける関数です。SIMD という特別な命令を使えない環境向けに、1 語（8 バイト）の整数を使って、同じことを行います。

ハッシュテーブルは、各要素の状態を 1 バイトの制御バイトで表します。その中で、EMPTY と DELETED は、どちらも最上位ビットが 1 になるように決められています。さらに EMPTY は次のビットも 1 なので、上位 2 ビットを見るだけで EMPTY を判定できます。

## コード

::: code-group

```rust:line-numbers=116 [日本語訳]
    pub(crate) fn match_empty(self) -> BitMask {
        // 最上位ビットが 1 なら、そのタグは次のどちらかです：
        // 1111_1111（EMPTY）か 1000_0000（DELETED）です。
        // そのため、上位 2 ビットが 1 かを論理積で確かめれば十分です。
        BitMask((self.0 & (self.0 << 1) & repeat(Tag::DELETED)).to_le())
    }
```

```rust:line-numbers=116 [原文]
    pub(crate) fn match_empty(self) -> BitMask {
        // If the high bit is set, then the tag must be either:
        // 1111_1111 (EMPTY) or 1000_0000 (DELETED).
        // So we can just check if the top two bits are 1 by ANDing them.
        BitMask((self.0 & (self.0 << 1) & repeat(Tag::DELETED)).to_le())
    }
```

:::

この関数は、`Group` という構造体のメソッドです。`Group` は、8 個分の制御バイトを 1 つの整数として持ちます。戻り値の `BitMask` は、一致した位置にだけ 1 が立っているビットの集まりです。

## 前提知識

- **制御バイト（タグ）**: ハッシュテーブルの各要素の状態を表す 1 バイトです。空き、削除済み、使用中の 3 種類があります。
- **EMPTY と DELETED**: EMPTY は一度も使われていない空き、DELETED は削除されて再利用できる印です。どちらも最上位ビットが 1 です。
- **`BitMask`**: 一致した位置を、ビットで表した型です。それぞれのビットが、1 つのタグに対応します。
- **`repeat`**: 1 バイトの値を、整数の全バイトに並べます。`DELETED` の値を並べて、各バイトの同じビットを比べられるようにします。
- **論理積（`&`）と左シフト（`<<`）**: 隣り合うビットを重ねて比べるのに使います。`self.0 << 1` は、各バイトの下位ビットを上位側へずらします。

## 何をしているか

### 1. 上位 2 ビットを重ねて比べる

```rust:line-numbers=120
        BitMask((self.0 & (self.0 << 1) & repeat(Tag::DELETED)).to_le())
```

`self.0 << 1` で、各バイトを 1 ビットずらします。これで、元のバイトの上位ビットと、そのすぐ下のビットが、同じ位置に並びます。`self.0 & (self.0 << 1)` は、その 2 ビットがどちらも 1 かを一度に調べます。

### 2. 最上位ビットの位置だけを残す

`repeat(Tag::DELETED)` は、各バイトに `1000_0000` を並べたマスクです。論理積でこれを当てると、各バイトの最上位ビットの位置だけが残ります。上位 2 ビットがどちらも 1 だったバイトだけ、その位置に 1 が立ちます。

ここで得られる `BitMask` は、一致した位置を表します。この関数が見つけるのは EMPTY の位置です。DELETED は上位 2 ビットが「10」なので、この判定には当たりません。

## ここがすごい

- **8 個分を一度に判定**: 1 バイトずつ調べる代わりに、8 個の制御バイトを 1 回の論理演算で処理します。
- **分岐がない**: 判定の中に `if` がないので、CPU の分岐予測に影響されません。
- **SIMD がなくても速い**: 専用の命令がない環境でも、整数演算だけで同じ性質を使えます。

## まとめ

- EMPTY と DELETED は、どちらも最上位ビットが 1 である。EMPTY だけは上位 2 ビットが 1 なので、それを使って見分ける。
- 隣り合うビットの論理積で、2 つの状態をまとめて検出する。
- 8 個分の制御バイトを、一度の整数演算で判定できる。
