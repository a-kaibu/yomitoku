---
title: 数字を 2 桁ずつ表から写して 16 桁を書き出す
description: 64 ビット整数の下位 16 桁を、2 桁ずつの対応表から 10 進数の文字列にする itoa の内部関数。割り算は 100 で割る操作だけに絞られている。
language: rust
project: itoa
repo: https://github.com/dtolnay/itoa
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "1577ed901354d0d7448ac162328f9dbf5183124c"
file: src/lib.rs
lines: [406, 438]
function: enc_16lsd
difficulty: 3
format: 2
tags: [数値計算, 文字列処理, キャッシュ, 最適化]
---

## ひとことで

`enc_16lsd` は、`u64` の値 `n` の **下位 16 桁** を、10 進数の文字列として `buf` に書き込む関数です。
たとえば `n = 1234567890` なら、先頭に 0 を補って `0000001234567890` の 16 文字を書き込みます。

整数を文字列にする処理は、1 桁ずつ `% 10` と `/ 10` を繰り返すのが素朴な方法です。この関数は **2 桁ずつ** まとめて扱い、その組を対応表 `DECIMAL_PAIRS` から直接コピーします。割り算の回数が減り、表を引くだけで文字が手に入ります。

## コード

::: code-group

```rust:line-numbers=406 [日本語訳]
// n の下位 16 桁の 10 進数を `buf[OFFSET..OFFSET + 16]` に書き込む。
#[cfg_attr(feature = "no-panic", no_panic)]
fn enc_16lsd<const OFFSET: usize>(buf: &mut [MaybeUninit<u8>], n: u64) {
    // 作業用のコピーから、下位の桁を順に取り出していく。
    let mut remain = n;

    // 4 桁ずつ、対応表から書式化する。
    for quad_index in (1..4).rev() {
        // 2 桁のペアを 2 つ取り出す
        let quad = remain % 1_00_00;
        remain /= 1_00_00;
        let (pair1, pair2) = divmod100(quad as u32);
        unsafe {
            buf[quad_index * 4 + OFFSET + 0]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
            buf[quad_index * 4 + OFFSET + 1]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 1));
            buf[quad_index * 4 + OFFSET + 2]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 0));
            buf[quad_index * 4 + OFFSET + 3]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 1));
        }
    }

    // 最後の 2 組（4 桁）
    let (pair1, pair2) = divmod100(remain as u32);
    unsafe {
        buf[OFFSET + 0].write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
        buf[OFFSET + 1].write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 1));
        buf[OFFSET + 2].write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 0));
        buf[OFFSET + 3].write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 1));
    }
}
```

```rust:line-numbers=406 [原文]
// Encodes the 16 least-significant decimals of n into `buf[OFFSET..OFFSET + 16]`.
#[cfg_attr(feature = "no-panic", no_panic)]
fn enc_16lsd<const OFFSET: usize>(buf: &mut [MaybeUninit<u8>], n: u64) {
    // Consume the least-significant decimals from a working copy.
    let mut remain = n;

    // Format per four digits from the lookup table.
    for quad_index in (1..4).rev() {
        // pull two pairs
        let quad = remain % 1_00_00;
        remain /= 1_00_00;
        let (pair1, pair2) = divmod100(quad as u32);
        unsafe {
            buf[quad_index * 4 + OFFSET + 0]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
            buf[quad_index * 4 + OFFSET + 1]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 1));
            buf[quad_index * 4 + OFFSET + 2]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 0));
            buf[quad_index * 4 + OFFSET + 3]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 1));
        }
    }

    // final two pairs
    let (pair1, pair2) = divmod100(remain as u32);
    unsafe {
        buf[OFFSET + 0].write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
        buf[OFFSET + 1].write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 1));
        buf[OFFSET + 2].write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 0));
        buf[OFFSET + 3].write(*DECIMAL_PAIRS.0.get_unchecked(pair2 as usize * 2 + 1));
    }
}
```

:::

同じファイルにある対応表の先頭は次のとおりです。`"00"`、`"01"`、…、`"99"` の 2 桁の並びが、100 組ぶん 1 本の文字列として並んでいます。

```rust:line-numbers=222
static DECIMAL_PAIRS: DecimalPairs = DecimalPairs(
    *b"0001020304050607080910111213141516171819\
       2021222324252627282930313233343536373839\
```

## 前提知識

- **`&mut [MaybeUninit<u8>]`**: まだ初期化されていないかもしれないバイトの列への可変参照です。`MaybeUninit` は「値が入っているとは限らない」ことを型で表します。
- **`const OFFSET: usize`**: ジェネリクスの定数引数です。関数を呼ぶとき、`enc_16lsd::<3>` のように値を型の一部として指定でき、コンパイル時に決まります。
- **`for quad_index in (1..4).rev()`**: 1, 2, 3 の順に、`rev()` で逆向き（3, 2, 1）に回すループです。
- **`%` と `/=`**: 余り（`%`）と、割った商を代入する演算子（`/=`）です。`1_00_00` は `10000` と同じ値で、区切りのアンダースコアは読みやすさのためです。
- **`write(...)`**: `MaybeUninit` の値に書き込むメソッドです。`unsafe` ブロックで囲むのは、範囲外の添字を使うと未定義動作になるからです。
- **`*DECIMAL_PAIRS.0.get_unchecked(i)`**: 範囲チェックをせずに対応表の `i` 番目のバイトを読みます。`*` は参照先の値を取り出す記号です。

## 何をしているか

### 1. 4 桁ずつ、上の位から書く

```rust:line-numbers=413
    for quad_index in (1..4).rev() {
        // pull two pairs
        let quad = remain % 1_00_00;
        remain /= 1_00_00;
        let (pair1, pair2) = divmod100(quad as u32);
```

`remain % 1_00_00` で下位 4 桁を取り出し、`remain /= 1_00_00` で残りを 4 桁ぶん減らします。`divmod100` は前の記事で見た、100 で割った商と余りを求める関数で、4 桁を 2 桁ずつの `pair1` と `pair2` に分けます。
`quad_index` は 3, 2, 1 と減っていくので、書き込み位置を `quad_index * 4` でずらせます。後ろの位置から埋めていくので、数字は右から左へ正しく並びます。

### 2. 1 組の 2 桁を表からコピーする

```rust:line-numbers=418
        unsafe {
            buf[quad_index * 4 + OFFSET + 0]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
            buf[quad_index * 4 + OFFSET + 1]
                .write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 1));
```

`pair1` は 0〜99 の数です。対応表では 1 組が 2 バイトなので、`pair1 * 2` が表の中の位置になります。`+ 0` と `+ 1` で 2 バイトを順にコピーします。
たとえば `pair1 = 12` なら位置は 24 で、表の 24 番目と 25 番目のバイトは `'1'` と `'2'` です。割り算をせずに、2 桁の文字列が表から直接取れます。

### 3. 最後の 4 桁

```rust:line-numbers=431
    let (pair1, pair2) = divmod100(remain as u32);
    unsafe {
        buf[OFFSET + 0].write(*DECIMAL_PAIRS.0.get_unchecked(pair1 as usize * 2 + 0));
```

残った下位 4 桁を、同じ方法で書きます。ループは上位 3 組で、最後の組はループの外で処理しています。`remain` はここで 0〜9999 の範囲に収まっているので、`divmod100` の前提を満たします。

## ここがすごい

- **割り算の回数を減らす**: 1 桁ずつなら 16 回の割り算が必要ですが、この関数は `1_00_00` で割る処理が 3 回と、`divmod100` の中の掛け算だけで済みます。
- **表を引くだけで文字になる**: 「数字」を計算してから文字に変換する手間がなく、表の 2 バイトをそのままコピーします。ASCII の数字の文字コードがあらかじめ表に入っているので、変換の処理がありません。
- **ループと最後の処理の分離**: 4 桁ずつのループは 3 回で、最後の 1 組は別に書かれています。端数を特別扱いせず、ループの回数を見ればどこまで書いたかがわかります。
- **書き込み先を型で守る**: 引数に `MaybeUninit` を使うので、書いていない領域を誤って読むことがありません。初期化されていないバッファを扱う安全な入り口になっています。
- **定数でオフセットを指定**: `OFFSET` をジェネリクスの定数にしているので、呼び出し側が書き込み位置を決めるときに、ずれを実行時に計算しなくて済みます。

## まとめ

- 2 桁ずつ表から写すと、10 進数への変換で割り算の回数を大きく減らせる。
- 文字の表を用意しておけば、数字から文字への変換そのものが不要になる。
- ループと端数の処理を分けると、どこまで書いたかが明確になる。
- 未初期化の領域は `MaybeUninit` で型として表し、書き込みを安全に限定する。
