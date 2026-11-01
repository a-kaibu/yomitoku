---
title: 16 バイトずつ「全部 ASCII か」を調べてまとめて変換する
description: 大文字・小文字変換の高速化部品。文字列の先頭から 16 バイトずつ ASCII かどうかを判定し、全部 ASCII なら一気に変換する。コンパイラが SIMD 命令を使えるよう書き方を工夫している。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/str.rs
lines: [966, 1037]
function: convert_while_ascii
difficulty: 3
tags: [文字列処理, 最適化, メモリ管理]
---

## ひとことで

`convert_while_ascii` は、文字列の **先頭から ASCII 文字が続く部分** を、渡された関数（たとえば小文字化）でまとめて変換する関数です。変換済みの `String` と、最初の非 ASCII 文字から始まる残りの文字列を返します。

`"HELLO, 世界"` を小文字化関数と一緒に渡すと、`("hello, ", "世界")` が返ります。`to_lowercase` や `to_uppercase` は、この関数で ASCII 部分を片付けてから、残りだけを 1 文字ずつ Unicode の表で変換します。

## コード

```rust:line-numbers=966
pub unsafe fn convert_while_ascii(s: &str, convert: fn(&u8) -> u8) -> (String, &str) {
    // Process the input in chunks of 16 bytes to enable auto-vectorization.
    // Previously the chunk size depended on the size of `usize`,
    // but on 32-bit platforms with sse or neon is also the better choice.
    // The only downside on other platforms would be a bit more loop-unrolling.
    const N: usize = 16;

    let mut slice = s.as_bytes();
    let mut out = Vec::with_capacity(slice.len());
    let mut out_slice = out.spare_capacity_mut();

    let mut ascii_prefix_len = 0_usize;
    let mut is_ascii = [false; N];

    while slice.len() >= N {
        // SAFETY: checked in loop condition
        let chunk = unsafe { slice.get_unchecked(..N) };
        // SAFETY: out_slice has at least same length as input slice and gets sliced with the same offsets
        let out_chunk = unsafe { out_slice.get_unchecked_mut(..N) };

        for j in 0..N {
            is_ascii[j] = chunk[j] <= 127;
        }

        // Auto-vectorization for this check is a bit fragile, sum and comparing against the chunk
        // size gives the best result, specifically a pmovmsk instruction on x86.
        // See https://github.com/llvm/llvm-project/issues/96395 for why llvm currently does not
        // currently recognize other similar idioms.
        if is_ascii.iter().map(|x| *x as u8).sum::<u8>() as usize != N {
            break;
        }

        for j in 0..N {
            out_chunk[j] = MaybeUninit::new(convert(&chunk[j]));
        }

        ascii_prefix_len += N;
        // SAFETY: checked in loop condition.
        slice = unsafe { slice.get_unchecked(N..) };
        // SAFETY: out_slice has at least same length as input slice.
        out_slice = unsafe { out_slice.get_unchecked_mut(N..) };
    }

    // handle the remainder as individual bytes
    while !slice.is_empty() {
        let byte = slice[0];
        if byte > 127 {
            break;
        }
        // SAFETY: out_slice has at least same length as input slice
        unsafe {
            *out_slice.get_unchecked_mut(0) = MaybeUninit::new(convert(&byte));
        }
        ascii_prefix_len += 1;
        // SAFETY: slice has at least one byte, so slicing from 1.. is safe
        slice = unsafe { slice.get_unchecked(1..) };
        // SAFETY: out_slice has at least same length as input slice
        out_slice = unsafe { out_slice.get_unchecked_mut(1..) };
    }

    // SAFETY: ascii_prefix_len bytes have been initialized above
    unsafe { out.set_len(ascii_prefix_len) };

    // SAFETY: We have written only valid ascii to the output vec
    let ascii_string = unsafe { String::from_utf8_unchecked(out) };

    // SAFETY: we know this is a valid char boundary
    // since we only skipped over leading ascii bytes
    let rest = unsafe { core::str::from_utf8_unchecked(slice) };

    (ascii_string, rest)
}
```

## 前提知識

- **`fn(&u8) -> u8`**: 関数ポインタ型です。「`u8` の参照を受け取って `u8` を返す関数」を引数として渡せます。
- **ASCII**: 0〜127 の 1 バイトで表される文字（英数字や記号）です。UTF-8 では ASCII はそのまま 1 バイトで、128 以上のバイトは多バイト文字の一部です。
- **`Vec::with_capacity` と `spare_capacity_mut`**: 前者は要素数 0 のまま領域だけ確保した `Vec` を作ります。後者は「確保済みだがまだ使っていない領域」を `MaybeUninit<u8>`（未初期化かもしれない値）のスライスとして返します。そこに直接書き込んでから `set_len` で長さを確定させます。
- **`[false; N]`**: 要素が `N` 個すべて `false` の配列です。
- **`get_unchecked`**: 範囲チェックなしで部分スライスを取り出します。安全な理由は `SAFETY` コメントに書かれています。
- **`from_utf8_unchecked`**: バイト列を、UTF-8 として正しいか確認せずに文字列とみなします。

## 何をしているか

### 1. 出力の領域を用意（973〜975 行目）

出力は入力と同じ長さを超えないので、入力の長さぶんを最初に確保します。

### 2. 16 バイトずつ処理（980〜1007 行目）

16 バイトを取り出し、各バイトが 127 以下か（ASCII か）を `is_ascii` 配列に記録します（986〜988 行目）。
次に、`true` の数を数えて 16 個そろっているかを確かめます（994 行目）。1 つでも非 ASCII があれば、ここで止めます。
全部 ASCII なら 16 バイトをまとめて変換し（998〜1000 行目）、入力と出力をそれぞれ 16 バイト進めます。

### 3. 残りを 1 バイトずつ（1010〜1024 行目）

16 バイトに満たない残りや、非 ASCII を含んでいた 16 バイトの先頭部分は、1 バイトずつ調べて変換します。非 ASCII に出会ったら止めます。

### 4. 結果をまとめる（1027〜1036 行目）

書き込んだ長さを `set_len` で確定させ、ASCII だけなので UTF-8 の確認を省いて `String` にします。残りの部分も、ASCII の直後は必ず文字の境目なので、確認なしで `&str` にできます。

## ここがすごい

- **自動ベクトル化を狙った書き方**: 990〜993 行目のコメントのとおり、「各バイトを `bool` 配列に書き、合計して 16 と比べる」という一見回りくどい書き方は、LLVM が x86 の `pmovmskb` 命令（16 バイトの最上位ビットを一度に集める命令）を生成できる形として選ばれています。`iter().all(...)` のような自然な書き方では、うまく SIMD 化されないのです。
- **チャンクの大きさを固定**: 967〜970 行目のコメントのとおり、以前は `usize` の大きさに応じて変えていましたが、32 ビット環境でも SIMD 命令がある以上 16 バイトがよい、と固定しています。
- **未初期化の領域に直接書く**: 出力を `push` で 1 バイトずつ追加すると、そのたびに容量のチェックが入ります。最初に確保した領域へ直接書き込み、最後に長さを確定させることで、そのチェックをなくしています。
- **テストで最適化を守る**: 956〜957 行目のコメントのとおり、この関数は「SIMD 化されているか」を確かめるコード生成テストのためだけに公開されています。最適化が壊れたら気づけるようにしているのです。

## まとめ

- テキスト処理は ASCII の部分をまとめて処理するだけで大きく速くなる。
- コンパイラに SIMD 命令を使わせたいときは、認識されやすい書き方がある（コメントとテストで守る）。
- 出力の大きさの上限がわかるなら、先に確保して直接書き込むと速い。
- 「ASCII の直後は文字の境目」のような性質を使えば、UTF-8 の再検証を省ける。
