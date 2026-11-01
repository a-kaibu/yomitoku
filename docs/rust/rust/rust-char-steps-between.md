---
title: 文字の範囲で、代理の区間を飛ばして歩数を数える
description: 標準ライブラリで char の範囲の大きさを数える関数。char には代理の区間（0xD800 から 0xDFFF）が含まれないので、その 2048 個を引いて正確な歩数を返す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/iter/range.rs
lines: [715, 736]
function: Step::steps_between
difficulty: 3
format: 2
tags: [イテレータ, Unicode, 型システム]
---

## ひとことで

`steps_between` は、`'a'..='z'` のような **文字の範囲** が、いくつの文字を含むかを数える関数です。範囲の大きさを、イテレータの `size_hint` などに渡すために使われます。

Rust の `char` は、Unicode のスカラー値だけを表します。その中には、UTF-16 の代理（サロゲート）の区間 `0xD800` から `0xDFFF` は含まれません。そのため、単純な引き算では、実際の文字の数と食い違います。この関数は、その 2048 個を正しく引きます。

## コード

```rust:line-numbers=715
    fn steps_between(&start: &char, &end: &char) -> (usize, Option<usize>) {
        let start = start as u32;
        let end = end as u32;
        if start <= end {
            let count = end - start;
            if start < 0xD800 && 0xE000 <= end {
                if let Ok(steps) = usize::try_from(count - 0x800) {
                    (steps, Some(steps))
                } else {
                    (usize::MAX, None)
                }
            } else {
                if let Ok(steps) = usize::try_from(count) {
                    (steps, Some(steps))
                } else {
                    (usize::MAX, None)
                }
            }
        } else {
            (0, None)
        }
    }
```

この関数は、`Step` トレイトの実装です。範囲の両端が `start` と `end` で与えられ、その間の歩数を、`(下限, 上限)` の組として返します。範囲が逆なら、歩数は 0 です。

## 前提知識

- **`char`**: 1 つの Unicode スカラー値を表す型です。0 から `0x10FFFF` までのうち、代理の区間を除いた値だけが有効です。
- **代理（サロゲート）**: UTF-16 の内部で使われる 0xD800 から 0xDFFF の値です。単独の文字としては存在できないので、`char` には含まれません。
- **`Step` トレイト**: 範囲の端の型が、次の値や歩数を数えられるようにする仕組みです。
- **`size_hint`**: イテレータが残りの要素数の見込みを返すための仕組みです。下限と上限の組で表します。
- **`usize::try_from`**: 大きな値を `usize` に変換します。溢れたら失敗するので、`usize::MAX` を返して対応します。

## 何をしているか

### 1. 差を取る

```rust:line-numbers=716
        let start = start as u32;
        let end = end as u32;
        if start <= end {
            let count = end - start;
```

両端を `u32` の値にして、差を計算します。範囲が逆なら、後の処理に入らず `(0, None)` を返します。

### 2. 代理の区間をまたぐかを確かめる

```rust:line-numbers=720
            if start < 0xD800 && 0xE000 <= end {
```

範囲の始まりが代理の区間より前で、終わりが代理の区間より後ろなら、範囲は代理の区間をまたいでいます。このとき、その区間の 2048 個を差から引きます。

### 3. 歩数を `usize` に収める

```rust:line-numbers=721
                if let Ok(steps) = usize::try_from(count - 0x800) {
                    (steps, Some(steps))
                } else {
                    (usize::MAX, None)
                }
```

引いた値を `usize` に変換します。収まればその値を、収まらなければ `usize::MAX` と「上限なし」を返します。

```rust:line-numbers=726
            } else {
                if let Ok(steps) = usize::try_from(count) {
                    (steps, Some(steps))
                } else {
                    (usize::MAX, None)
                }
```

代理をまたがない場合は、差をそのまま使い、同じように変換します。

## ここがすごい

- **無効な値を飛ばす**: 代理の区間を数えないので、イテレータが返す件数と、範囲の見込みが一致します。
- **溢れを隠さない**: `usize` に収まらない場合は、上限を「不明」として返します。誤った大きさを信じないための設計です。
- **分岐がわかりやすい**: 逆の範囲、代理をまたぐ範囲、またがない範囲の 3 つに分けて書かれています。

## まとめ

- `char` の範囲は、代理の区間 2048 個を除いて歩数を数える。
- 変換の溢れは `usize::MAX` と上限なしで表し、誤った大きさを返さない。
- 範囲が逆なら、歩数は 0 で返す。
