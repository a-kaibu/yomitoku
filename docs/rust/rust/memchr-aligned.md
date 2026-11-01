---
title: バイト検索を「位置合わせ→16バイトずつ→残り」の3段で速くする
description: バイト列から特定の 1 バイトを探す memchr の本体。メモリの位置をそろえてから整数 2 個ぶんずつまとめて調べ、見つかりそうな所だけ 1 バイトずつ探す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/slice/memchr.rs
lines: [52, 109]
function: memchr_aligned
difficulty: 3
tags: [探索, 最適化, 低レイヤ, ビット演算]
---

## ひとことで

`memchr_aligned` は、バイト列 `text` の中から値 `x` のバイトが **最初に現れる位置** を探す関数です。見つかれば `Some(位置)`、なければ `None` を返します。
たとえば `b"hello"` から `b'l'` を探すと `Some(2)` です。

1 バイトずつ比べる素朴な方法に対し、この関数は **`usize` 2 個分（64 ビット環境なら 16 バイト）ずつまとめて** 「この中にあるか」を判定し、ありそうな場所だけを細かく調べます。

## コード

```rust:line-numbers=52
#[rustc_allow_const_fn_unstable(const_eval_select)] // fallback impl has same behavior
const fn memchr_aligned(x: u8, text: &[u8]) -> Option<usize> {
    // The runtime version behaves the same as the compiletime version, it's
    // just more optimized.
    const_eval_select!(
        @capture { x: u8, text: &[u8] } -> Option<usize>:
        if const {
            memchr_naive(x, text)
        } else {
            // Scan for a single byte value by reading two `usize` words at a time.
            //
            // Split `text` in three parts
            // - unaligned initial part, before the first word aligned address in text
            // - body, scan by 2 words at a time
            // - the last remaining part, < 2 word size

            // search up to an aligned boundary
            let len = text.len();
            let ptr = text.as_ptr();
            let mut offset = ptr.align_offset(USIZE_BYTES);

            if offset > 0 {
                offset = offset.min(len);
                let slice = &text[..offset];
                if let Some(index) = memchr_naive(x, slice) {
                    return Some(index);
                }
            }

            // search the body of the text
            let repeated_x = usize::repeat_u8(x);
            while offset <= len - 2 * USIZE_BYTES {
                // SAFETY: the while's predicate guarantees a distance of at least 2 * usize_bytes
                // between the offset and the end of the slice.
                unsafe {
                    let u = *(ptr.add(offset) as *const usize);
                    let v = *(ptr.add(offset + USIZE_BYTES) as *const usize);

                    // break if there is a matching byte
                    let zu = contains_zero_byte(u ^ repeated_x);
                    let zv = contains_zero_byte(v ^ repeated_x);
                    if zu || zv {
                        break;
                    }
                }
                offset += USIZE_BYTES * 2;
            }

            // Find the byte after the point the body loop stopped.
            // FIXME(const-hack): Use `?` instead.
            // FIXME(const-hack, fee1-dead): use range slicing
            let slice =
            // SAFETY: offset is within bounds
                unsafe { super::from_raw_parts(text.as_ptr().add(offset), text.len() - offset) };
            if let Some(i) = memchr_naive(x, slice) { Some(offset + i) } else { None }
        }
    )
}
```

## 前提知識

- **`Option<usize>`**: 「値があるかもしれないし、ないかもしれない」を表す型です。`Some(値)` か `None` のどちらかになります。
- **`const fn` と `const_eval_select!`**: `const fn` はコンパイル時にも実行できる関数です。`const_eval_select!` は「コンパイル時に実行されるときは `if const` 側、実行時は `else` 側」と実装を切り替える標準ライブラリ内部のマクロです。どちらも同じ結果を返すことが前提です。
- **生ポインタ `*const usize`**: メモリのアドレスを直接指す値です。`ptr.add(n)` で n 要素先を指し、`*p` でその場所の値を読みます。安全性をコンパイラが確認できないので `unsafe` ブロックの中で使います。
- **アラインメント**: CPU は `usize` を 8 の倍数のアドレスから読むと効率がよく、機種によってはそれ以外を読めません。`align_offset(8)` は「次の 8 の倍数のアドレスまで何バイトか」を返します。
- **`if let Some(index) = ...`**: `Option` の中身が `Some` のときだけ、中の値を取り出して処理する書き方です。

## 何をしているか

### 1. 位置がそろうまで 1 バイトずつ探す（69〜79 行目）

`text` の先頭アドレスが 8 の倍数とは限りません。そこで `align_offset` で「そろうまでのバイト数」を求め、その部分だけ素朴な `memchr_naive` で探します。ここで見つかればすぐに返します。

### 2. 16 バイトずつまとめて判定する（82〜98 行目）

`repeated_x` は `x` を 8 バイト全部に並べた値です（`x = 0x6C` なら `0x6C6C6C6C6C6C6C6C`）。
`u ^ repeated_x` を計算すると、`x` と同じバイトだけが `0x00` になります。それを `contains_zero_byte`（引き算を使って「0 のバイトがあるか」を一発で判定する関数）に渡します。

1 回のループで `u` と `v` の 2 ワード、16 バイトを調べ、どちらかに候補があれば `break` します。なければ `offset` を 16 進めて続けます。
ループ条件 `offset <= len - 2 * USIZE_BYTES` により、読み出しが `text` の範囲を超えることはありません。

### 3. 止まった場所から 1 バイトずつ探す（103〜106 行目）

ループを抜けた位置（候補を含む 16 バイトの先頭、または末尾の端数）から最後まで、`memchr_naive` で正確な位置を探し、`offset` を足して返します。

## ここがすごい

- **3 段構え**: 「そろっていない頭」「高速に流す胴体」「端数のしっぽ」に分けるのは、高速なメモリ処理の定番パターンです。胴体は 8 の倍数のアドレスから読むので速く、機種を問わず安全です。
- **2 ワード同時に判定**: 2 つの判定は互いに独立しているので、CPU が並列に計算できます。ループの回数も半分になります。
- **「あるか」と「どこか」を分ける**: まとめて調べる段階では「この 16 バイトにあるか」だけを判定し、正確な位置は最後に 1 回だけ素朴に探します。判定を単純にできるので速くなります。
- **コンパイル時にも使える**: `const_eval_select!` によって、コンパイル時の評価では生ポインタを使わない素朴な実装、実行時には高速な実装が選ばれます。`const fn` のまま最適化を両立する工夫です。
- **短い入力は別ルート**: この関数を呼ぶ `memchr` 側で、16 バイト未満の入力は最初から素朴な検索に回しています。準備のコストが見合わないからです。

## まとめ

- メモリをまとめて読むときは、位置合わせ（アラインメント）をしてから読む。
- XOR で「一致したバイト」を 0 にすれば、0 のバイト検出で検索ができる。
- まず粗く速く絞り込み、最後に細かく正確に調べる。
- 同じ関数でも、コンパイル時用と実行時用で実装を切り替えられる。
