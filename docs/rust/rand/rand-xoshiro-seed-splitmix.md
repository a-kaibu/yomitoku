---
title: 1 つの種から 256 ビットの状態を作る
description: 乱数生成器の内部状態を、u64 1 個の種から作る関数。SplitMix64 で 4 つの値を作り、全部が 0 にならないことを確かめる。
language: rust
project: rand
repo: https://github.com/rust-random/rand
license: MIT OR Apache-2.0
copyright: Copyright 2018 Developers of the Rand project
commit: "9e7d328f60d6372ae22927f37d1a816fc980f25e"
file: src/rngs/xoshiro256plusplus.rs
lines: [47, 63]
function: Xoshiro256PlusPlus::seed_from_u64
difficulty: 2
format: 2
tags: [乱数, ビット演算, イディオム]
---

## ひとことで

`seed_from_u64` は、`u64` の 1 つの数（種）から、`Xoshiro256PlusPlus` の内部状態 4 つ（合計 256 ビット）を作る関数です。
利用者にとっては、長い状態を毎回用意するのは面倒です。そこで、1 つの数から状態を決めるために、**SplitMix64** という小さな乱数生成器を使っています。

同じ種からは、いつも同じ状態が作られるので、再現できる乱数の並びが得られます。テストやシミュレーションで役立ちます。

## コード

::: code-group

```rust:line-numbers=47 [日本語訳]
    #[inline]
    fn seed_from_u64(mut state: u64) -> Self {
        const PHI: u64 = 0x9e3779b97f4a7c15;
        let mut s = [0; 4];
        for i in s.iter_mut() {
            state = state.wrapping_add(PHI);
            let mut z = state;
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            z = z ^ (z >> 31);
            *i = z;
        }
        // 0 でない PHI を使うので、0 でない状態が必ず作られる
        // そのため、from_seed と seed_from_u64 が互いに呼び合う再帰を防ぐ
        debug_assert_ne!(s, [0; 4]);
        Xoshiro256PlusPlus { s }
    }
```

```rust:line-numbers=47 [原文]
    #[inline]
    fn seed_from_u64(mut state: u64) -> Self {
        const PHI: u64 = 0x9e3779b97f4a7c15;
        let mut s = [0; 4];
        for i in s.iter_mut() {
            state = state.wrapping_add(PHI);
            let mut z = state;
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            z = z ^ (z >> 31);
            *i = z;
        }
        // By using a non-zero PHI we are guaranteed to generate a non-zero state
        // Thus preventing a recursion between from_seed and seed_from_u64.
        debug_assert_ne!(s, [0; 4]);
        Xoshiro256PlusPlus { s }
    }
```

:::

`PHI` は黄金比に由来する定数です。定数を足すたびに状態が変わるので、同じ種から別々の 4 つの値が作られます。

## 前提知識

- **種（seed）**: 乱数生成器を初期化するための値です。同じ種なら同じ並びが出ます。
- **SplitMix64**: 1 つの 64 ビットの状態を、定数の足し算と混ぜ合わせだけで進める、小さな乱数生成器です。状態の初期化によく使われます。
- **`wrapping_mul`**: 掛け算が 64 ビットを超えたら、上位を捨てて余りを返す掛け算です。
- **`>>`（右シフト）と `^`**: `z ^ (z >> 30)` のように、値を右にずらしてから自分と排他的論理和を取ると、上位のビットが下位へ混ざります。
- **`debug_assert_ne!`**: デバッグビルドで、2 つの値が等しくないことを確かめるマクロです。

## 何をしているか

### 1. 定数を足して状態を変える

```rust:line-numbers=49
        const PHI: u64 = 0x9e3779b97f4a7c15;
        let mut s = [0; 4];
        for i in s.iter_mut() {
            state = state.wrapping_add(PHI);
            let mut z = state;
```

`PHI` は約 2^64 を黄金比で割った値に近い定数です。足すたびに状態が必ず変わり、連続した値が同じにならないようにしています。

### 2. 状態を混ぜ合わせて 4 つの値を作る

```rust:line-numbers=54
            z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
            z = z ^ (z >> 31);
            *i = z;
```

足し算で作った `state` を、右シフトと排他的論理和、掛け算で混ぜます。この計算を 4 回繰り返し、それぞれ `s[0]` から `s[3]` に保存します。

### 3. 全部が 0 でないことを確かめる

```rust:line-numbers=61
        debug_assert_ne!(s, [0; 4]);
        Xoshiro256PlusPlus { s }
```

全部が 0 の状態になると、乱数生成器は 0 しか返せなくなります。PHI が 0 でないので、この関数で作られた状態が全部 0 になることはなく、`debug_assert_ne!` でデバッグ時にも確かめています。

## ここがすごい

- **1 つの種から 4 つの値を作れる**: 利用者は `u64` 1 個だけ渡せば済みます。内部で必要な状態の量を、SplitMix64 が自動で広げます。
- **状態がつぶれない**: 状態が全部 0 になると、生成器が止まってしまいます。PHI を使うことで、この問題を初期化の段階で防いでいます。
- **循環する呼び出しを防ぐ**: コメントにあるように、`from_seed` は、全部 0 のときに `seed_from_u64(0)` を呼びます。その `seed_from_u64` が 0 でない状態を作ることで、呼び出しが無限に続かないように設計されています。
- **定数が意味を持つ**: 掛け算の定数は、混ぜ合わせを良くするために選ばれた値です。コードの中の数字に、設計の理由があります。
- **速さと単純さ**: 数回の掛け算とシフトだけなので、初期化が非常に速く終わります。

## まとめ

- 1 つの `u64` の種は、SplitMix64 の計算で 4 つの 64 ビット値に広げられる。
- 黄金比の定数を足すことで、状態が 0 にならないことを初期化の段階で保証する。
- 同じ種からは同じ状態が作られるので、再現性のある乱数が得られる。
