---
title: UTF-8 の文字数を 8 バイトずつまとめて数える
description: str の chars().count() の高速版。UTF-8 の「続きのバイト」以外を数えればよいことに着目し、整数 1 個に 8 個のカウンタを詰めて一気に数える。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/str/count.rs
lines: [39, 108]
function: do_count_chars
difficulty: 3
tags: [Unicode, 文字列処理, 最適化, ビット演算]
---

## ひとことで

`do_count_chars` は、UTF-8 の文字列に **何文字入っているか** を数える関数です。`"あいう".chars().count()` が `3` を返すときの中身です。

UTF-8 では 1 文字が 1〜4 バイトになります。ただし 2 バイト目以降（継続バイト）は必ず `10xxxxxx` という形をしているので、「継続バイト **ではない** バイトの数」を数えれば文字数になります。
この関数はそれを 1 バイトずつではなく、**`usize`（64 ビット環境なら 8 バイト）単位でまとめて** 数えます。

## コード

```rust:line-numbers=39
fn do_count_chars(s: &str) -> usize {
    // For correctness, `CHUNK_SIZE` must be:
    //
    // - Less than or equal to 255, otherwise we'll overflow bytes in `counts`.
    // - A multiple of `UNROLL_INNER`, otherwise our `break` inside the
    //   `body.chunks(CHUNK_SIZE)` loop is incorrect.
    //
    // For performance, `CHUNK_SIZE` should be:
    // - Relatively cheap to `/` against (so some simple sum of powers of two).
    // - Large enough to avoid paying for the cost of the `sum_bytes_in_usize`
    //   too often.
    const CHUNK_SIZE: usize = 192;

    // Check the properties of `CHUNK_SIZE` and `UNROLL_INNER` that are required
    // for correctness.
    const _: () = assert!(CHUNK_SIZE < 256);
    const _: () = assert!(CHUNK_SIZE.is_multiple_of(UNROLL_INNER));

    // SAFETY: transmuting `[u8]` to `[usize]` is safe except for size
    // differences which are handled by `align_to`.
    let (head, body, tail) = unsafe { s.as_bytes().align_to::<usize>() };

    // This should be quite rare, and basically exists to handle the degenerate
    // cases where align_to fails (as well as miri under symbolic alignment
    // mode).
    //
    // The `unlikely` helps discourage LLVM from inlining the body, which is
    // nice, as we would rather not mark the `char_count_general_case` function
    // as cold.
    if unlikely(body.is_empty() || head.len() > USIZE_SIZE || tail.len() > USIZE_SIZE) {
        return char_count_general_case(s.as_bytes());
    }

    let mut total = char_count_general_case(head) + char_count_general_case(tail);
    // Split `body` into `CHUNK_SIZE` chunks to reduce the frequency with which
    // we call `sum_bytes_in_usize`.
    for chunk in body.chunks(CHUNK_SIZE) {
        // We accumulate intermediate sums in `counts`, where each byte contains
        // a subset of the sum of this chunk, like a `[u8; size_of::<usize>()]`.
        let mut counts = 0;

        let (unrolled_chunks, remainder) = chunk.as_chunks::<UNROLL_INNER>();
        for unrolled in unrolled_chunks {
            for &word in unrolled {
                // Because `CHUNK_SIZE` is < 256, this addition can't cause the
                // count in any of the bytes to overflow into a subsequent byte.
                counts += contains_non_continuation_byte(word);
            }
        }

        // Sum the values in `counts` (which, again, is conceptually a `[u8;
        // size_of::<usize>()]`), and accumulate the result into `total`.
        total += sum_bytes_in_usize(counts);

        // If there's any data in `remainder`, then handle it. This will only
        // happen for the last `chunk` in `body.chunks()` (because `CHUNK_SIZE`
        // is divisible by `UNROLL_INNER`), so we explicitly break at the end
        // (which seems to help LLVM out).
        if !remainder.is_empty() {
            // Accumulate all the data in the remainder.
            let mut counts = 0;
            for &word in remainder {
                counts += contains_non_continuation_byte(word);
            }
            total += sum_bytes_in_usize(counts);
            break;
        }
    }
    total
}
```

## 前提知識

- **`&str` と UTF-8**: Rust の文字列 `&str` は、中身が必ず正しい UTF-8 のバイト列です。`as_bytes()` でそのバイト列 `&[u8]` を取り出せます。
- **`usize`**: ポインタと同じ大きさの符号なし整数です。64 ビットの PC なら 8 バイトです。
- **スライス `&[T]`**: 配列の一部を指す「参照」です。`chunks(n)` は n 個ずつに区切ったスライスを順に返します。
- **`align_to::<usize>()`**: バイト列を「メモリ上の位置がそろっていない先頭部分」「`usize` として読める中央部分」「末尾の残り」の 3 つに分けます。メモリの読み出しはアドレスが 8 の倍数のときに効率がよいため、この分割をします。`unsafe` が必要なのは、型を読み替える操作だからです。
- **`const _: () = assert!(...)`**: コンパイル時にチェックされるアサーションです。条件が偽ならコンパイルエラーになります。
- **`for &word in unrolled`**: `&word` と書くと、参照から値を取り出して `word` に入れられます（パターンマッチ）。

## 何をしているか

### 1. 3 分割する（59〜72 行目）

`align_to` で `head`・`body`・`tail` に分けます。`head` と `tail` は高々数バイトなので、1 バイトずつ数える素朴な関数 `char_count_general_case` に任せます（72 行目）。
万一 `body` が空だったりしたら、全体を素朴な方法で数えて終わりです（68〜70 行目）。`unlikely` は「ほぼ起きない」とコンパイラに伝える印です。

### 2. 192 ワードごとに区切る（75 行目）

`body`（`usize` の並び）を 192 個ずつに区切ります。それぞれの区切りで、`counts` という 1 個の `usize` を **8 個の 1 バイトカウンタの集まり** として使います。

### 3. 1 ワードで 8 バイトぶんを判定して足す（80〜87 行目）

`contains_non_continuation_byte(word)` は、`word` の各バイトについて「継続バイトでなければ `0x01`、継続バイトなら `0x00`」を並べた値を返します。
たとえば `"aあ"` の一部で `61 E3 81 82 ...` というバイトなら `01 01 00 00 ...` です。これを `counts` に足すと、8 個のカウンタが同時に 1 ずつ増えます。

各カウンタは 1 回で最大 1 しか増えず、192 回足しても最大 192 です。1 バイト（最大 255）からあふれないので、隣のカウンタに繰り上がりません。これが 42 行目の「255 以下」の理由です。

### 4. 8 個のカウンタを合計する（91 行目）

`sum_bytes_in_usize(counts)` で 8 個のバイトを合計し、`total` に足します。これを 192 ワードに 1 回だけ行うので、合計の手間はほとんどかかりません。

### 5. 端数の処理（97〜105 行目）

`as_chunks::<4>()` は 4 ワードずつの組とその余りに分けます。余りが出るのは最後の区切りだけなので、そこで処理して `break` します。

## ここがすごい

- **「数えるべきもの」を言い換える**: 文字を 1 つずつデコードせず、「継続バイトでないバイトを数える」という単純な問題に置き換えています。
- **1 つの整数に 8 個のカウンタ**: SWAR（SIMD Within A Register）と呼ばれる技法で、特別な命令なしに 8 バイトを同時に処理します。
- **あふれる前にまとめる**: カウンタが 255 を超えないように 192 ワードごとに合計をとります。192 は 128 + 64 なので、割り算もシフトと足し算で安く済みます（46〜49 行目のコメント）。
- **条件をコンパイル時に検査**: 54〜55 行目で、正しさに必要な条件を `const` のアサーションにしています。将来だれかが定数を変えても、壊れればコンパイルが止まります。
- **4 個ずつのアンロール**: 内側のループを 4 ワード単位にすることで、コンパイラがループの制御を減らし、CPU が並列に計算しやすくなります。

## まとめ

- UTF-8 の文字数は「`10xxxxxx` ではないバイトの数」で求まる。
- 整数を小さなカウンタの集まりとみなすと、複数のデータを一度に数えられる。
- カウンタがあふれないように、区切りごとに合計をとる。
- 正しさの前提となる定数の条件は、コンパイル時アサーションで守る。
