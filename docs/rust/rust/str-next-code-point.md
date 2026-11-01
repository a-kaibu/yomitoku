---
title: UTF-8 のバイト列から 1 文字ぶんのコードポイントを組み立てる
description: 文字列の chars() の中核。先頭バイトを見て 1〜4 バイトのどれかを判断し、各バイトから必要なビットを取り出してシフトでつなげ、文字番号を作る。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/str/validations.rs
lines: [27, 69]
function: next_code_point
difficulty: 3
tags: [Unicode, 文字列処理, イテレータ, 最適化]
---

## ひとことで

`next_code_point` は、UTF-8 のバイト列から **次の 1 文字を読み取り、その文字の番号（コードポイント）を返す** 関数です。`"あ".chars()` で文字を 1 つずつ取り出すときの中身にあたります。

たとえば「あ」は UTF-8 で `E3 81 82` の 3 バイトです。この関数はこの 3 バイトを読んで、Unicode の番号 `U+3042`（10 進数で 12354）を返します。

## コード

```rust:line-numbers=27
/// Reads the next code point out of a byte iterator (assuming a
/// UTF-8-like encoding).
///
/// # Safety
///
/// `bytes` must produce a valid UTF-8-like (UTF-8 or WTF-8) string
#[unstable(feature = "str_internals", issue = "none")]
#[inline]
pub unsafe fn next_code_point<'a, I: Iterator<Item = &'a u8>>(bytes: &mut I) -> Option<u32> {
    // Decode UTF-8
    let x = *bytes.next()?;
    if x < 128 {
        return Some(x as u32);
    }

    // Multibyte case follows
    // Decode from a byte combination out of: [[[x y] z] w]
    // NOTE: Performance is sensitive to the exact formulation here
    let init = utf8_first_byte(x, 2);
    // SAFETY: `bytes` produces an UTF-8-like string,
    // so the iterator must produce a value here.
    let y = unsafe { *bytes.next().unwrap_unchecked() };
    let mut ch = utf8_acc_cont_byte(init, y);
    if x >= 0xE0 {
        // [[x y z] w] case
        // 5th bit in 0xE0 .. 0xEF is always clear, so `init` is still valid
        // SAFETY: `bytes` produces an UTF-8-like string,
        // so the iterator must produce a value here.
        let z = unsafe { *bytes.next().unwrap_unchecked() };
        let y_z = utf8_acc_cont_byte((y & CONT_MASK) as u32, z);
        ch = init << 12 | y_z;
        if x >= 0xF0 {
            // [x y z w] case
            // use only the lower 3 bits of `init`
            // SAFETY: `bytes` produces an UTF-8-like string,
            // so the iterator must produce a value here.
            let w = unsafe { *bytes.next().unwrap_unchecked() };
            ch = (init & 7) << 18 | utf8_acc_cont_byte(y_z, w);
        }
    }

    Some(ch)
}
```

## 前提知識

- **UTF-8 の形**: 1 文字は 1〜4 バイトです。ASCII は `0xxxxxxx` の 1 バイト、それ以外は先頭バイトが `110xxxxx`（2 バイト）、`1110xxxx`（3 バイト）、`11110xxx`（4 バイト）で、そのあとに `10xxxxxx` の継続バイトが続きます。`x` の部分をつなげたものがコードポイントです。
- **ジェネリクスとトレイト境界**: `I: Iterator<Item = &'a u8>` は「`I` は `u8` への参照を順に返すイテレータなら何でもよい」という意味です。`'a` はライフタイム（参照が有効な期間）の名前です。
- **`?` 演算子**: `bytes.next()?` は、`next()` が `None`（もう要素がない）ならその場で関数から `None` を返し、`Some(x)` なら中の `x` を取り出します。
- **`unsafe fn` と `unwrap_unchecked`**: `unsafe fn` は「呼び出す側が前提条件を守る必要がある関数」です。ここでは「正しい UTF-8 が渡される」ことが前提です。`unwrap_unchecked()` は `Some` であることを確認せずに中身を取り出すので、前提が破られると未定義動作になります。
- **補助関数**: `utf8_first_byte(x, 2)` は `x & 0x1F`（下位 5 ビット）、`utf8_acc_cont_byte(ch, b)` は `(ch << 6) | (b & 0x3F)`、つまり「これまでの値を 6 ビットずらし、継続バイトの下位 6 ビットをつなぐ」計算です。`CONT_MASK` は `0x3F` です。

## 何をしているか

### 1. ASCII ならすぐ返す（37〜40 行目）

1 バイト目 `x` が 128 未満なら ASCII なので、そのまま返します。英数字だけの文字列ではここで終わるので高速です。

### 2. 2 バイト目までを組み立てる（45〜49 行目）

`init = x & 0x1F` と、2 バイト目 `y` の下位 6 ビットをつなげます。2 バイト文字ならこの `ch` が答えです。

### 3. 3 バイト文字（50〜57 行目）

「あ」`E3 81 82` で追います。

```
init = 0xE3 & 0x1F = 0x03
y_z  = (0x81 & 0x3F) << 6 | (0x82 & 0x3F) = 0x01 << 6 | 0x02 = 0x42
ch   = 0x03 << 12 | 0x42 = 0x3042
```

`init` は本来 3 バイト文字では下位 4 ビットだけ使うべきですが、52 行目のコメントのとおり `0xE0`〜`0xEF` では 5 ビット目が必ず 0 なので、5 ビットのマスクのままで正しい値になります。

### 4. 4 バイト文字（58〜65 行目）

`x >= 0xF0` なら 4 バイト目 `w` も読み、`init` の下位 3 ビットだけを使って `(init & 7) << 18 | (y_z << 6 | w の下位6ビット)` を作ります。絵文字などがこれにあたります。

## ここがすごい

- **よくあるケースを先に**: ASCII を最初に判定して即座に返すので、英語のテキストではほぼ比較 1 回で 1 文字が読めます。
- **マスクを使い回す**: 先頭バイトのマスクを 2・3・4 バイトで作り直さず、`0x1F` で取った `init` を使い回しています。3 バイトでは「5 ビット目が必ず 0」、4 バイトでは `& 7` で上位を削る、と必要最小限の補正だけをしています。44 行目には「性能はこの書き方に敏感」とあり、細かく調整された結果だとわかります。
- **検証と変換を分ける**: この関数は「正しい UTF-8 である」ことを前提に、範囲チェックを省いています。Rust の `str` は作られた時点で UTF-8 として検証済みなので、読むたびに検証し直す必要がないのです。型で正しさを保証し、その分処理を速くするという Rust らしい設計です。
- **汎用的なイテレータを受け取る**: 前からでも、別の型のイテレータからでも使えるように、ジェネリクスで書かれています。

## まとめ

- UTF-8 の 1 文字は、先頭バイトの形で長さがわかり、各バイトの下位ビットをつなげるとコードポイントになる。
- `(値 << 6) | (次のバイト & 0x3F)` を繰り返すのがデコードの基本形。
- 「入力は検証済み」という前提を型で保証できれば、毎回のチェックを省いて速くできる。
- 頻出ケース（ASCII）を先に処理すると、全体が速くなる。
