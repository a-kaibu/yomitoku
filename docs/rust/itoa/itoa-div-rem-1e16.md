---
title: 1 京で割る割り算を、掛け算 1 回とシフトで置き換える
description: u128 の値を 1E16 で割った商と余りを求める itoa の関数。定数による割り算を、論文の方法で掛け算と右シフトに変えている。
language: rust
project: itoa
repo: https://github.com/dtolnay/itoa
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "1577ed901354d0d7448ac162328f9dbf5183124c"
file: src/lib.rs
lines: [440, 466]
function: div_rem_1e16
difficulty: 3
format: 2
tags: [数値計算, 最適化, アルゴリズム]
---

## ひとことで

`div_rem_1e16` は、`u128` の値 `n` を **1 京（1E16 = 10000000000000000）で割った商と余り** を返す関数です。
たとえば `n = 12345678901234567890123` なら、商は `1234567`、余りは `8901234567890123`（下位 16 桁）になります。

割る数が 1E16 と決まっているので、ここでは割り算命令を使わず、掛け算 1 回と右シフトで商を求めています。その掛け算の定数は、Granlund と Montgomery の論文の方法で、あらかじめ計算された値です。

## コード

::: code-group

```rust:line-numbers=440 [日本語訳]
// 定数 1E16 による割り算と余りの計算は、基本的に n から 16 桁を取り出す処理にあたる。
//（n から 16 桁の 10 進数を取り出す）
//
// この整数の割り算の方法は、次の論文に基づく:
//
//   T. Granlund と P. Montgomery「Division by Invariant Integers Using Multiplication」
//   SIGPLAN94（プログラミング言語の設計と実装に関する会議）の論文集より（原題は次の行）
//   Implementation, 1994, pp. 61–72（1994 年、61〜72 ページ）
//
#[cfg_attr(feature = "no-panic", no_panic)]
fn div_rem_1e16(n: u128) -> (u128, u64) {
    const D: u128 = 1_0000_0000_0000_0000;
    // この判定は、呼び出し側の流れにうまく溶け込む（インライン化される）。
    if n < D {
        return (0, n as u64);
    }

    // この定数は、論文の CHOOSE_MULTIPLIER という手続きで計算されている。
    // Granlund と Montgomery の論文の手続きで、N=128、prec=128、d=1E16 を使って求めた。
    const M_HIGH: u128 = 76624777043294442917917351357515459181;
    const SH_POST: u8 = 51;

    // n と M_HIGH の積の上位 128 ビットを取り、SH_POST ビット右にずらす
    let quot = u128_ext::mulhi(n, M_HIGH) >> SH_POST;
    let rem = n - quot * D;
    (quot, rem as u64)
}
```

```rust:line-numbers=440 [原文]
// Euclidean division plus remainder with constant 1E16 basically consumes 16
// decimals from n.
//
// The integer division algorithm is based on the following paper:
//
//   T. Granlund and P. Montgomery, “Division by Invariant Integers Using Multiplication”
//   in Proc. of the SIGPLAN94 Conference on Programming Language Design and
//   Implementation, 1994, pp. 61–72
//
#[cfg_attr(feature = "no-panic", no_panic)]
fn div_rem_1e16(n: u128) -> (u128, u64) {
    const D: u128 = 1_0000_0000_0000_0000;
    // The check inlines well with the caller flow.
    if n < D {
        return (0, n as u64);
    }

    // These constant values are computed with the CHOOSE_MULTIPLIER procedure
    // from the Granlund & Montgomery paper, using N=128, prec=128 and d=1E16.
    const M_HIGH: u128 = 76624777043294442917917351357515459181;
    const SH_POST: u8 = 51;

    // n.widening_mul(M_HIGH).1 >> SH_POST
    let quot = u128_ext::mulhi(n, M_HIGH) >> SH_POST;
    let rem = n - quot * D;
    (quot, rem as u64)
}
```

:::

## 前提知識

- **`u128`**: 0 から約 3.4 × 10^38 までを表す符号なし 128 ビット整数です。`u64` より大きい値を扱えます。
- **`u64` の変換**: `rem as u64` は、余りが 16 桁以下なので `u64` に安全に収まることを意味します。`as` は型の変換を行う演算子です。
- **`const`**: コンパイル時に値が決まる定数です。`M_HIGH` や `SH_POST` のような、計算の前提になる値がここに入ります。
- **`u128_ext::mulhi`**: 128 ビットどうしを掛けたときの、上位 128 ビットを返す関数です。このファイルで別に定義されています。
- **`return`**: 途中で関数から値を返す文です。`if n < D { return ...; }` は、小さい値なら即座に答えを返します。
- **Granlund と Montgomery の論文**: 定数による整数の割り算を、掛け算とシフトで実装する方法を示した論文です。定数の作り方まで書かれています。

## 何をしているか

### 1. 小さい値は即答する

```rust:line-numbers=451
    const D: u128 = 1_0000_0000_0000_0000;
    // The check inlines well with the caller flow.
    if n < D {
        return (0, n as u64);
    }
```

`n` が 1E16 より小さければ、商は 0、余りは `n` そのものです。ほとんどの数は 16 桁より大きいとは限らないので、この早い戻りが効きます。

### 2. 掛け算とシフトで商を求める

```rust:line-numbers=459
    const M_HIGH: u128 = 76624777043294442917917351357515459181;
    const SH_POST: u8 = 51;
```

```rust:line-numbers=462
    // n.widening_mul(M_HIGH).1 >> SH_POST
    let quot = u128_ext::mulhi(n, M_HIGH) >> SH_POST;
```

`M_HIGH` は、1E16 で割るための掛け算の係数です。`n` と `M_HIGH` を掛けて上位 128 ビットを取り、`SH_POST = 51` ビット右にずらすと、`n / 1E16` になります。
割り算の代わりに掛け算とシフトを使うため、CPU で重い割り算命令を避けられます。

### 3. 余りは引き算で求める

```rust:line-numbers=464
    let rem = n - quot * D;
    (quot, rem as u64)
```

商に 1E16 を掛けてもとの `n` から引くと、余りが出ます。余りは 0 以上 1E16 未満なので、`u64` に入ります。

## ここがすごい

- **定数による割り算の一般的な方法**: 論文では、割る数が決まっているとき、掛け算と右シフトでどんな整数も割れることが示されています。この関数はその手法を 1E16 に当てはめた実装です。
- **係数は測って決めたのではなく計算で求める**: コメントによると、`CHOOSE_MULTIPLIER` という手続きで、N=128、prec=128、d=1E16 から計算された値です。手で決めた数字ではなく、理論に基づいています。
- **早い戻りで多くの呼び出しを安くする**: 小さい値を先に返すので、掛け算を使わずに済みます。コメントには「呼び出し側の流れにうまく溶け込む」とあり、インライン化の効果を意識しています。
- **余りを引き算で出す**: 商を求めたあと、もう一度割る必要がありません。掛け算 1 回、引き算 1 回で、商と余りの両方が手に入ります。

## まとめ

- 割る数が定数なら、掛け算と右シフトで割り算を置き換えられる。
- その係数は、論文の手続きで計算して求めると確かである。
- 小さい値を先に返すと、よくある場合を最も速く済ませられる。
- 余りは商から引き算で求めると、割り算をもう一度せずに済む。
