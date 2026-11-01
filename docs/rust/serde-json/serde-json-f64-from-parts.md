---
title: 仮数と指数から、浮動小数点の値を組み立てる
description: serde_json が数の文字列を f64 にするときの最後の段。仮数に 10 の冪を掛けたり割ったりし、表の外の大きな指数は段階的に縮めてから、結果を組み立てる。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/de.rs
lines: [639, 672]
function: f64_from_parts
difficulty: 3
format: 2
tags: [数値計算, パース, 防御的プログラミング]
---

## ひとことで

`f64_from_parts` は、JSON の数値を読んだあとに、**仮数（有効数字の並び）と指数（10 の何乗か）から、`f64` の値を作る** 関数です。たとえば `1.5e3` は、仮数 15 と指数 2 として渡され、15 に 10 の 2 乗を掛けた値になります。

10 の冪は、表（`POW10`）を引いて得ます。表の範囲を超える指数は、値を少しずつ縮めながら、繰り返し計算します。桁があふれたら、エラーを返します。

## コード

```rust:line-numbers=639
    fn f64_from_parts(
        &mut self,
        positive: bool,
        significand: u64,
        mut exponent: i32,
    ) -> Result<f64> {
        let mut f = significand as f64;
        loop {
            match POW10.get(exponent.wrapping_abs() as usize) {
                Some(&pow) => {
                    if exponent >= 0 {
                        f *= pow;
                        if f.is_infinite() {
                            return Err(self.error(ErrorCode::NumberOutOfRange));
                        }
                    } else {
                        f /= pow;
                    }
                    break;
                }
                None => {
                    if f == 0.0 {
                        break;
                    }
                    if exponent >= 0 {
                        return Err(self.error(ErrorCode::NumberOutOfRange));
                    }
                    f /= 1e308;
                    exponent += 308;
                }
            }
        }
        Ok(if positive { f } else { -f })
    }
```

この関数は、数値を読み取るデシリアライザの内部にあります。符号 `positive` は最後に適用されます。値は一時的に絶対値として計算されます。

## 前提知識

- **仮数と指数**: 数を「仮数 × 10^指数」の形に分けたものです。`1.5e3` は仮数 15、指数 2 として表せます。
- **`f64`**: 倍精度の浮動小数点数です。桁数に限りがあるので、大きすぎる値や小さすぎる値は表せません。
- **`POW10`**: 10 の冪を並べた表です。ある範囲までは、正確な値を表せます。
- **`is_infinite`**: 値が無限大かを確かめます。溢れたときに、エラーにするかどうかの判断に使われます。
- **`wrapping_abs`**: 絶対値を取ります。最小値の場合にも、パニックせずに折り返します。

## 何をしているか

### 1. 表から 10 の冪を引き、掛けるか割る

```rust:line-numbers=645
        let mut f = significand as f64;
        loop {
            match POW10.get(exponent.wrapping_abs() as usize) {
                Some(&pow) => {
                    if exponent >= 0 {
                        f *= pow;
                        if f.is_infinite() {
                            return Err(self.error(ErrorCode::NumberOutOfRange));
                        }
                    } else {
                        f /= pow;
                    }
                    break;
```

まず仮数を `f64` にします。指数の絶対値で表から 10 の冪を引き、正の指数なら掛け、負の指数なら割ります。掛けた結果が無限大になったら、桁あふれとしてエラーを返します。

### 2. 表の外の大きな指数を、段階的に扱う

```rust:line-numbers=659
                None => {
                    if f == 0.0 {
                        break;
                    }
                    if exponent >= 0 {
                        return Err(self.error(ErrorCode::NumberOutOfRange));
                    }
                    f /= 1e308;
                    exponent += 308;
                }
```

表に無い指数のとき、値が 0 ならそのまま終わります。正の指数なら、表の外なので桁あふれです。負の指数なら、値を 1e308 で割り、指数を 308 だけ 0 に近づけます。これを、表に入る大きさになるまで繰り返します。

### 3. 符号を付けて返す

```rust:line-numbers=671
        Ok(if positive { f } else { -f })
```

最後に、符号を適用して返します。

## ここがすごい

- **表の範囲では正確**: 10 の冪のうち、表の範囲は `f64` で正確に表せます。よく使われる数はこの段階で済みます。
- **表の外も扱える**: 極端に小さい数は、少しずつ縮めて表の範囲に入れます。値を直接計算すると桁が溢れる場合でも、正しく処理できます。
- **溢れを早めに検出**: 掛けた途中で無限大になったら、すぐにエラーを返します。誤った値を返すことを防ぎます。

## まとめ

- 仮数に 10 の冪を掛けるか割って、値を組み立てる。
- 表の範囲では正確な冪を使い、表の外は段階的に縮めて計算する。
- 桁あふれは無限大で検出し、エラーとして返す。
