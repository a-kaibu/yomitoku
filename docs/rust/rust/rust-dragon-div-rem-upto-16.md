---
title: 0 から 15 までの商を、4 回の引き算で求める
description: 標準ライブラリの浮動小数点の表示（Dragon 法）で使う関数。大きな整数どうしの割り算で、商が 0 から 15 までだと分かっているとき、8、4、2、1 の倍数を順に引いて商と余りを求める。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/imp/flt2dec/strategy/dragon.rs
lines: [107, 133]
function: div_rem_upto_16
difficulty: 3
format: 2
tags: [数値計算, アルゴリズム, 最適化]
---

## ひとことで

`div_rem_upto_16` は、大きな整数 `x` を `scale` で割ったときの **商（0 から 15 まで）と余り** を求める関数です。浮動小数点数を 10 進数の文字列にする Dragon 法で使われます。

Dragon 法では、大きな整数を何度も割ります。その商は、桁の数字 1 つ分、つまり 0 から 9 の範囲に収まるはずです。この関数は、その性質を使って、割り算の代わりに引き算だけで答えを出します。

## コード

```rust:line-numbers=107
fn div_rem_upto_16<'a>(
    x: &'a mut Big,
    scale: &Big,
    scale2: &Big,
    scale4: &Big,
    scale8: &Big,
) -> (u8, &'a mut Big) {
    let mut d = 0;
    if *x >= *scale8 {
        x.sub(scale8);
        d += 8;
    }
    if *x >= *scale4 {
        x.sub(scale4);
        d += 4;
    }
    if *x >= *scale2 {
        x.sub(scale2);
        d += 2;
    }
    if *x >= *scale {
        x.sub(scale);
        d += 1;
    }
    debug_assert!(*x < *scale);
    (d, x)
}
```

この関数は、`x` を直接書き換えて、余りを `x` に残します。`scale2`、`scale4`、`scale8` は、`scale` の 2 倍、4 倍、8 倍です。事前に計算して渡されるので、この関数の中では掛け算をしません。

## 前提知識

- **Dragon 法**: 浮動小数点数を、正確な 10 進数の桁へ変換する方法です。大きな整数どうしの計算を使います。
- **`Big`**: 任意の大きさの整数を表す型です。標準の整数より大きな値を扱えます。
- **商と余り**: 割り算の結果です。`x = 商 × scale + 余り` の関係があります。
- **二進の分解**: 商を 8、4、2、1 の和として表す考え方です。0 から 15 までのどの数も、この 4 つの組み合わせで表せます。
- **`debug_assert!`**: デバッグのときだけ、余りが `scale` より小さいことを確かめます。

## 何をしているか

### 1. 大きい単位から順に引く

```rust:line-numbers=115
    if *x >= *scale8 {
        x.sub(scale8);
        d += 8;
    }
```

まず `scale8`（`scale` の 8 倍）と比べます。`x` がそれ以上なら、`x` から引いて、商に 8 を足します。

### 2. 同じように、4、2、1 の単位で引く

```rust:line-numbers=119
    if *x >= *scale4 {
        x.sub(scale4);
        d += 4;
    }
    if *x >= *scale2 {
        x.sub(scale2);
        d += 2;
    }
    if *x >= *scale {
        x.sub(scale);
        d += 1;
    }
```

続けて、`scale4`、`scale2`、`scale` の順に、同じ判定をします。引けるならそのたびに引いて、商に対応する値を足します。

### 3. 余りを確かめて返す

```rust:line-numbers=131
    debug_assert!(*x < *scale);
    (d, x)
```

最後に、余りが `scale` より小さいことを確かめます。その後、商と、余りを格納した `x` を返します。

## ここがすごい

- **割り算を使わない**: 大きな整数の割り算は重いですが、比べて引くだけなら、速く行えます。
- **判定が 4 回だけ**: 0 から 15 までの商は、4 回の判定で決まります。ループの回数が一定です。
- **事前の倍数を再利用**: `scale2`、`scale4`、`scale8` を外から渡すので、この関数の中では掛け算が要りません。同じ `scale` を何度も使う Dragon 法では、この再利用が効きます。

## まとめ

- 商が 0 から 15 だと分かっているなら、8、4、2、1 の倍数を順に引けば商が決まる。
- 割り算の代わりに、比べて引くだけで済むので速い。
- 事前に計算した倍数を渡すことで、この関数の中の掛け算を省く。
