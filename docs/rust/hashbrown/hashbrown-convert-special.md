---
title: 16 バイトを一度に書き換える、符号付き比較の小技
description: hashbrown が SSE2 で 16 個の制御バイトを一度に並べ替える関数。符号付きの比較と OR だけで、空きと削除済みを変換する。
language: rust
project: hashbrown
repo: https://github.com/rust-lang/hashbrown
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Amanieu d'Antras
commit: "f7bae3d165a3191d086a506ce6a39e516ffd5c67"
file: src/control/group/sse2.rs
lines: [117, 141]
function: Group::convert_special_to_empty_and_full_to_deleted
difficulty: 3
format: 2
tags: [ビット演算, キャッシュ, ハッシュ, 最適化]
---

## ひとことで

`convert_special_to_empty_and_full_to_deleted` は、16 個の **制御バイト**（タグ）を並べた `Group` に対して、一度の命令列で次の変換をする関数です。

- `EMPTY` は `EMPTY` のまま
- `DELETED` は `EMPTY` に
- `FULL`（データが入っている印）は `DELETED` に

hashbrown は、テーブルの掃除（再ハッシュ）をするとき、この変換をすべてのグループに使います。16 個を 1 つずつ見て分岐する代わりに、SSE2 の 128 ビット命令で 16 バイトをまとめて処理します。

## コード

::: code-group

```rust:line-numbers=117 [日本語訳]
    /// グループ内のすべてのタグに、次の変換を行う:
    /// - `EMPTY` は `EMPTY` のまま
    /// - `DELETED` は `EMPTY` にする
    /// - `FULL` は `DELETED` にする
    #[inline]
    pub(crate) fn convert_special_to_empty_and_full_to_deleted(self) -> Self {
        // 最上位ビットが 1（EMPTY または DELETED）のものを 1111_1111 にし、
        // 最上位ビットが 0（FULL）のものを 1000_0000 にする
        //
        // この処理を具体的な値で書き下すと次のとおり:
        //   let special = 0 > tag は、1111_1111（真）または 0000_0000（偽）
        //   1111_1111 | 1000_0000 = 1111_1111
        //   0000_0000 | 1000_0000 = 1000_0000
        #[expect(
            clippy::cast_possible_wrap, // tag: Tag::DELETED.0 を i8 として扱う
        )]
        unsafe {
            let zero = x86::_mm_setzero_si128();
            let special = x86::_mm_cmpgt_epi8(zero, self.0);
            Group(x86::_mm_or_si128(
                special,
                x86::_mm_set1_epi8(Tag::DELETED.0 as i8),
            ))
        }
    }
```

```rust:line-numbers=117 [原文]
    /// Performs the following transformation on all tags in the group:
    /// - `EMPTY => EMPTY`
    /// - `DELETED => EMPTY`
    /// - `FULL => DELETED`
    #[inline]
    pub(crate) fn convert_special_to_empty_and_full_to_deleted(self) -> Self {
        // Map high_bit = 1 (EMPTY or DELETED) to 1111_1111
        // and high_bit = 0 (FULL) to 1000_0000
        //
        // Here's this logic expanded to concrete values:
        //   let special = 0 > tag = 1111_1111 (true) or 0000_0000 (false)
        //   1111_1111 | 1000_0000 = 1111_1111
        //   0000_0000 | 1000_0000 = 1000_0000
        #[expect(
            clippy::cast_possible_wrap, // tag: Tag::DELETED.0 as i8
        )]
        unsafe {
            let zero = x86::_mm_setzero_si128();
            let special = x86::_mm_cmpgt_epi8(zero, self.0);
            Group(x86::_mm_or_si128(
                special,
                x86::_mm_set1_epi8(Tag::DELETED.0 as i8),
            ))
        }
    }
```

:::

## 前提知識

- **制御バイト（タグ）**: hashbrown は、各バケットの状態を 1 バイトで表します。最上位ビットが 0 なら `FULL`（データあり）、1 なら特別な状態です。`EMPTY` は `0b1111_1111`、`DELETED` は `0b1000_0000` です。
- **`Group`**: 16 個の制御バイトを 1 つの 128 ビットのレジスタに載せたものです。`self.0` は、その 128 ビットの値を持っています。
- **SSE2**: x86 の 128 ビット SIMD 命令の集まりです。`_mm_cmpgt_epi8` などの関数で、16 バイトを並列に比較・演算できます。
- **符号付き比較**: `_mm_cmpgt_epi8` は各バイトを **符号付き 8 ビット整数** として比べます。最上位ビットが 1 のバイトは負の数になります。
- **`unsafe`**: SIMD の関数は `unsafe` で呼ぶ必要があります。CPU の対応機能が前提だからです。
- **`#[expect(...)]`**: コンパイラの警告を、理由つきで意図的に抑えるための属性です。

## 何をしているか

### 1. 0 より小さいかどうかで、特別な状態を集める

```rust:line-numbers=133
        unsafe {
            let zero = x86::_mm_setzero_si128();
            let special = x86::_mm_cmpgt_epi8(zero, self.0);
```

`zero` は 16 バイトすべてが 0 のレジスタです。`_mm_cmpgt_epi8(zero, self.0)` は、各バイトについて「0 > そのバイト」（符号付き）を調べます。最上位ビットが 1 のバイト、つまり `EMPTY` と `DELETED` は負の数なので、結果は `1111_1111`（真）になります。`FULL` は結果が `0000_0000`（偽）です。

```
tag = 1111_1111 (EMPTY)   → special = 1111_1111
tag = 1000_0000 (DELETED) → special = 1111_1111
tag = 0xxx_xxxx (FULL)    → special = 0000_0000
```

### 2. 最上位ビットを立てて、結果をまとめる

```rust:line-numbers=136
            Group(x86::_mm_or_si128(
                special,
                x86::_mm_set1_epi8(Tag::DELETED.0 as i8),
            ))
```

`_mm_set1_epi8` は 16 バイトすべてを `DELETED`（`1000_0000`）にした値を作ります。`special` と OR を取ると、次のようになります。

- `EMPTY` と `DELETED` は `1111_1111`、つまり `EMPTY` になる
- `FULL` は `0000_0000 | 1000_0000 = 1000_0000`、つまり `DELETED` になる

上の仕様どおりの変換が、16 バイト分まとめて 2 命令で済みます。

## ここがすごい

- **16 個を 1 度に変換する**: 1 バイトずつ `if` で判定すると、16 回の分岐が必要です。SIMD の比較と OR を使うと、命令 3 つ程度で全部を変換できます。
- **分岐がない**: データによって結果がどう変わっても、同じ命令列が実行されます。分岐予測の失敗が起きないので、テーブルの掃除の速さが安定します。
- **符号付き比較の利用**: 「最上位ビットが 1 か」を調べる代わりに、符号付きの「0 より小さいか」を比べるだけで済ませています。比較命令 1 つで、特別な状態の判定が完了します。
- **コメントで計算を書き下す**: 40 行近くのコードのうち、コメントで「値の例」を示しています。`1111_1111 | 1000_0000 = 1111_1111` のように、読者が手で計算を追えるようになっています。
- **役割を限定する**: この関数は再ハッシュのときの掃除だけに使われます。変換の仕様を 3 行の箇条書きで明示しているので、呼び出し側が何を期待できるかがはっきりします。

## まとめ

- 制御バイトの最上位ビットを使うと、状態の判定を比較 1 回で行える。
- SIMD の比較と OR で、16 個の変換をまとめて済ませられる。
- 符号付きと符号なしの違いを利用すると、少ない命令で条件を表せる。
- 仕様は箇条書きと具体例で書くと、読み手が計算を追いやすい。
