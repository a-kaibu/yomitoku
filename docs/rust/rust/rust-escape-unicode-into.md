---
title: 文字を \u{...} の形に、左詰めで書き出す
description: String に文字の Unicode エスケープを書き込む内部関数。先頭の 0 の個数から要らない桁を数え、常に全桁を書いてから、不要な分を後の書き込みで上書きする。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/string.rs
lines: [3301, 3324]
function: escape_unicode_into
difficulty: 3
format: 2
tags: [文字列処理, Unicode, ビット演算]
---

## ひとことで

`escape_unicode_into` は、1 つの文字を `\u{1F600}` のような **Unicode エスケープの形** に変えて、固定長のバッファへ書き込む関数です。`String` の `escape_unicode` などの表示の処理で使われます。

文字の値は、最大で 6 桁の 16 進数になります。表示に必要な桁数は、文字の大きさで変わるので、先頭の 0 を数えて要らない桁を決めます。書き込みは、左詰めのバッファに対して行います。

## コード

::: code-group

```rust:line-numbers=3301 [日本語訳]
fn escape_unicode_into(output: &mut [MaybeUninit<ascii::Char>; 10], c: char) -> usize {
    const HEX_DIGITS: [ascii::Char; 16] = *b"0123456789abcdef".as_ascii().unwrap();

    let c = c as u32;
    // `1` との OR により、`c == 0` のときも 1 桁は必要だと計算されます
    // 1 桁は出力される必要があります。
    let prefix_skip = (c | 1).leading_zeros() as usize / 4 - 2;

    // 常に全桁を書き込みます。短い表現では、使われない桁を
    // 後の書き込みで上書きします。
    output[3usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 20) & 15) as usize]);
    output[4usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 16) & 15) as usize]);
    output[5usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 12) & 15) as usize]);
    output[6usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 8) & 15) as usize]);
    output[7usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 4) & 15) as usize]);
    output[8usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[(c & 15) as usize]);

    output[0].write(ascii::Char::ReverseSolidus);
    output[1].write(ascii::Char::SmallU);
    output[2].write(ascii::Char::LeftCurlyBracket);
    output[9 - prefix_skip].write(ascii::Char::RightCurlyBracket);

    10 - prefix_skip
}
```

```rust:line-numbers=3301 [原文]
fn escape_unicode_into(output: &mut [MaybeUninit<ascii::Char>; 10], c: char) -> usize {
    const HEX_DIGITS: [ascii::Char; 16] = *b"0123456789abcdef".as_ascii().unwrap();

    let c = c as u32;
    // OR-ing `1` ensures that for `c == 0` the code computes that
    // one digit should be printed.
    let prefix_skip = (c | 1).leading_zeros() as usize / 4 - 2;

    // Always write all digits, but for shorter representations the unused
    // digits get overwritten by later writes.
    output[3usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 20) & 15) as usize]);
    output[4usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 16) & 15) as usize]);
    output[5usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 12) & 15) as usize]);
    output[6usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 8) & 15) as usize]);
    output[7usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 4) & 15) as usize]);
    output[8usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[(c & 15) as usize]);

    output[0].write(ascii::Char::ReverseSolidus);
    output[1].write(ascii::Char::SmallU);
    output[2].write(ascii::Char::LeftCurlyBracket);
    output[9 - prefix_skip].write(ascii::Char::RightCurlyBracket);

    10 - prefix_skip
}
```

:::

この関数は、書き込んだ長さを返します。呼び出し側は、その長さだけバッファの先頭から読んで、文字列にします。

## 前提知識

- **Unicode エスケープ**: 文字を `\u{...}` の形で、16 進数の番号として表す書き方です。
- **16 進数の 1 桁**: 4 ビットを表します。`c >> 20` のように、4 ビットずつずらして 1 桁を取り出せます。
- **`leading_zeros`**: 先頭の 0 の個数を返します。文字の値が小さいほど、この数は大きくなります。
- **`MaybeUninit`**: まだ初期化していないバッファを扱う型です。ここでは、書き込んだ部分だけを読みます。
- **`saturating_sub`**: 引き算の結果が負になるとき、0 で止める引き算です。桁の位置を安全に計算できます。

## 何をしているか

### 1. 要らない桁の数を求める

```rust:line-numbers=3305
    // OR-ing `1` ensures that for `c == 0` the code computes that
    // one digit should be printed.
    let prefix_skip = (c | 1).leading_zeros() as usize / 4 - 2;
```

`c | 1` は、`c` が 0 でも先頭の 1 を確かめられるように、最下位のビットを 1 にします。その先頭の 0 の個数を 4 で割ると、16 進数の何桁が不要かが分かります。残りの桁数から、2 を引いて `prefix_skip` とします。

### 2. 全桁を書き込む

```rust:line-numbers=3309
    // Always write all digits, but for shorter representations the unused
    // digits get overwritten by later writes.
    output[3usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 20) & 15) as usize]);
    output[4usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 16) & 15) as usize]);
    output[5usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 12) & 15) as usize]);
    output[6usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 8) & 15) as usize]);
    output[7usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[((c >> 4) & 15) as usize]);
    output[8usize.saturating_sub(prefix_skip)].write(HEX_DIGITS[(c & 15) as usize]);
```

6 桁すべてを、左詰めの位置に書きます。桁が短い文字では、この書き込みが一部の位置を超えますが、`saturating_sub` によって、先頭側の位置に寄せられます。そのため、不要な桁は後の書き込みで上書きされます。

### 3. 前後の記号を書く

```rust:line-numbers=3318
    output[0].write(ascii::Char::ReverseSolidus);
    output[1].write(ascii::Char::SmallU);
    output[2].write(ascii::Char::LeftCurlyBracket);
    output[9 - prefix_skip].write(ascii::Char::RightCurlyBracket);
```

先頭の `\u{` と、末尾の `}` を書きます。末尾の位置は `prefix_skip` で決まるので、桁が短い文字では、閉じ括弧も前に詰められます。

### 4. 書いた長さを返す

```rust:line-numbers=3323
    10 - prefix_skip
}
```

全体の長さは `10 - prefix_skip` です。これで、呼び出し側は必要な部分だけを読めます。

## ここがすごい

- **分岐なしで桁を揃える**: 桁数に応じた `if` を書かず、常に 6 桁を書くことで、コードを単純にしています。
- **上書きで答えを残す**: 不要な桁を消す処理は要りません。後の書き込みが正しい位置を上書きするので、結果だけが残ります。
- **ヒープを使わない**: 出力先は呼び出し側の固定長のバッファです。表示のたびに領域を確保する必要がありません。

## まとめ

- 先頭の 0 の個数から、Unicode エスケープで要らない桁の数を求める。
- 常に全桁を書き、不要な分は後の書き込みで上書きする。
- 固定長のバッファに書くので、確保の費用がかからない。
