---
title: SipHash の最後に長さを混ぜて、結果の 64 ビットを作る
description: 標準ライブラリの SipHash の finish。最後のブロックに入力の長さを混ぜ、特別な定数を加えてから、さらに複数ラウンド混ぜて、4 つの状態を 1 つの 64 ビットにまとめる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/hash/sip.rs
lines: [311, 324]
function: Hasher::finish
difficulty: 3
format: 2
tags: [ハッシュ, 暗号, ビット演算]
---

## ひとことで

`finish` は、SipHash が **ハッシュ値（64 ビット）を確定させる** 最後の関数です。それまでに読み込んだ入力を、残りの端数（tail）と **入力の長さ** を組み合わせた最後のブロックとして混ぜます。そのあと、特別な定数を 1 か所に入れ、さらに混ぜ直してから、4 つの状態を 1 つにまとめます。
ここまでに入力を読むときの `write` と、混ぜるための `compress!` が、この関数の土台です。

## コード

```rust:line-numbers=311
    fn finish(&self) -> u64 {
        let mut state = self.state;

        let b: u64 = ((self.length as u64 & 0xff) << 56) | self.tail;

        state.v3 ^= b;
        S::c_rounds(&mut state);
        state.v0 ^= b;

        state.v2 ^= 0xff;
        S::d_rounds(&mut state);

        state.v0 ^ state.v1 ^ state.v2 ^ state.v3
    }
```

この関数は `&self` を取るので、元のハッシュの状態を変えずに値を取り出せます。内部では `state` のコピーを作ってから、混ぜ直しています。

## 前提知識

- **SipHash の状態**: 4 つの 64 ビットの値（`v0` から `v3`）と、入力の端数（`tail`）、入力の長さ（`length`）で構成されます。
- **`compress!` と `c_rounds` / `d_rounds`**: `compress!` は 1 ラウンドの混ぜ合わせです。`c_rounds` は入力のブロックごとに、`d_rounds` は最後に使われ、SipHash-1-3 では 1 回と 3 回です。
- **端数（tail）**: 8 バイトに足りない入力の残りを、1 つの 64 ビット整数にしたものです。
- **`as u64` と `& 0xff`**: 長さを 64 ビットに変換し、下位 8 ビットだけを取り出します。長さの下位 1 バイトを、ブロックの一番上の位に入れます。
- **`^=`**: 排他的論理和を、値に代入する演算子です。

## 何をしているか

### 1. 長さと端数を 1 つのブロックにする

```rust:line-numbers=314
        let b: u64 = ((self.length as u64 & 0xff) << 56) | self.tail;
```

入力の長さの下位 8 ビットを、64 ビットの一番上のバイトに入れ、残りの端数 `tail` と `|` で合わせます。これが最後のブロック `b` です。長さを混ぜることで、同じ内容でも長さが違う入力は、別のハッシュになります。

### 2. 最後のブロックを混ぜる

```rust:line-numbers=316
        state.v3 ^= b;
        S::c_rounds(&mut state);
        state.v0 ^= b;
```

`b` を `v3` に排他的論理和で混ぜ、1 ラウンド（`c_rounds`）で混ぜ直します。そのあと `b` を `v0` にも混ぜます。こうすると、最後のブロックが状態の全体に広がります。

### 3. 定数を入れてから、最終のラウンドを回す

```rust:line-numbers=320
        state.v2 ^= 0xff;
        S::d_rounds(&mut state);

        state.v0 ^ state.v1 ^ state.v2 ^ state.v3
```

`v2` に `0xff` を排他的論理和で入れると、最後のラウンドで使う状態が、入力とは違うものになります。`d_rounds` で最終の混ぜ合わせを行い、4 つの状態の排他的論理和を取って、64 ビットの結果にします。

## ここがすごい

- **長さで区別する**: 長さを最後のブロックに入れるので、末尾に 0 を足しただけの入力も、別のハッシュになります。SipHash の安全性の重要な部分です。
- **`0xff` で最後の段階を分ける**: 定数を 1 か所に入れるだけで、最後の混ぜ合わせが途中の段階と区別されます。同じ状態から、途中の段階と最終の段階を取り違えることがありません。
- **状態を壊さずに結果を取る**: `let mut state = self.state;` でコピーを作り、元の状態を変えません。`finish` を何回呼んでも、同じ結果が得られます。
- **4 つの状態をまとめる**: 最後に 4 つを排他的論理和で合わせると、すべての状態のビットが出力に反映されます。
- **ラウンド数の違いを型で表す**: `S::c_rounds` と `S::d_rounds` は、SipHash-1-3 と SipHash-2-4 の違いを、型のパラメータで切り替えています。同じ `finish` を両方の仕様で使えます。

## まとめ

- `finish` は、長さと端数を最後のブロックにして混ぜ、定数を入れてから最終のラウンドを回す。
- 4 つの状態の排他的論理和が、64 ビットのハッシュ値になる。
- 長さを混ぜることで、末尾の追加による衝突を防いでいる。
