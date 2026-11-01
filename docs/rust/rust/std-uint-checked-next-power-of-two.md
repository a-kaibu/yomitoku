---
title: 最上位のビットの位置から 2 のべき乗を作る
description: 整数以上で最小の 2 のべき乗を、1 を引いた値のビット幅から求める関数。型に収まらないときは None を返し、溢れを呼び出し側に知らせる。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [3959, 3967]
function: checked_next_power_of_two
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, 標準ライブラリ]
---

## ひとことで

`checked_next_power_of_two` は、整数 `self` 以上で最も小さい 2 のべき乗を求めて、`Option` で返す関数です。型に収まるときは `Some(値)`、収まらないときは `None` を返します。
求め方は、`self` から 1 を引いて、その数が何ビットで表せるかを数え、その位置だけ 1 を立てる、という方法です。割り算や繰り返しのループは使いません。

## コード

```rust:line-numbers=3959
        pub const fn checked_next_power_of_two(self) -> Option<Self> {
            let m1 = self.saturating_sub(1);
            if m1.cast_signed() >= 0 {
                let exp = m1.bit_width();
                Some(1 << exp)
            } else {
                None
            }
        }
```

`saturating_sub(1)` は、`0` から 1 を引いても 0 のまま止まる引き算です。そのため、`self = 0` の場合も安全に扱えます。

## 前提知識

- **`saturating_sub`**: 引き算の結果が 0 より小さくなるときに、0 で止める引き算です。符号なしの型で、下に溢れるのを防ぎます。
- **`bit_width`**: 数を表すのに必要なビット数を返すメソッドです。たとえば `5`（`101`）は 3、`0` は 0 です。
- **`cast_signed`**: 符号なしの整数を、同じビット幅の符号付きの整数に読み替えるメソッドです。値は変えず、上位のビットを符号として解釈します。
- **`>= 0`**: 符号付きの整数で、0 以上かどうかを比べます。最上位ビットが 0 なら、必ずこの条件を満たします。
- **`1 << exp`**: 1 を `exp` ビット左にずらす操作で、2 の `exp` 乗になります。

## 何をしているか

### 1. 1 を引いて、ビット幅を求める

```rust:line-numbers=3960
            let m1 = self.saturating_sub(1);
            if m1.cast_signed() >= 0 {
                let exp = m1.bit_width();
```

`m1` は `self - 1` です。2 のべき乗 `p` 以上の最小の値を求めるとき、`self - 1` の最上位ビットの位置から、答えの位置が決まります。`bit_width` で、そのビットの数を求めます。

### 2. 溢れを判定して、1 を左にずらす

```rust:line-numbers=3961
            if m1.cast_signed() >= 0 {
                let exp = m1.bit_width();
                Some(1 << exp)
            } else {
                None
            }
```

`m1` を符号付きと見たとき、0 以上なら最上位ビットが立っていません。このときは `1 << exp` が型の中に収まるので、`Some` で返します。
そうでなければ、答えが型の最大値を超えるので、`None` を返します。

## ここがすごい

- **ループを使わない**: 「2 を何回掛けたら超えるか」を繰り返して求める方法もあります。この関数は、ビット幅を 1 回の命令で求めて、そのまま位置にします。
- **0 と 1 の特別扱いが要らない**: `self = 0` のときは `saturating_sub` で `m1 = 0` になり、答えは `1` です。`self = 1` も、`m1 = 0` から `1` が返ります。特別な条件分岐が要りません。
- **溢れの判定が 1 回の比較**: 符号付きとして読むと、最上位ビットが立っているかどうかが、そのまま 0 以上かどうかになります。判定が非常に簡単です。
- **`Option` で結果を表す**: 溢れを例外ではなく `None` で返すので、呼び出し側が処理を分けて書けます。
- **通常版の土台になる**: `next_power_of_two` は、この関数の結果が `None` のときだけ溢れさせています。溢れを扱う仕組みの中心がこの関数です。

## まとめ

- 次の 2 のべき乗は、`self - 1` のビット幅から `1 << exp` で求められる。
- `saturating_sub` と符号の読み替えで、0 と溢れの場合を簡単に扱える。
- 溢れは `None` で返すので、呼び出し側が安全に判断できる。
