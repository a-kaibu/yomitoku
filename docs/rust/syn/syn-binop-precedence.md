---
title: 二項演算子を優先順位の区分に振り分ける
description: syn の Precedence::of_binop。加算、乗算、比較、代入などの二項演算子を、式を組み立てるときの優先順位の区分へ対応させる。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/precedence.rs
lines: [59, 88]
function: of_binop
difficulty: 1
format: 2
tags: [パース, 型システム]
---

## ひとことで

`of_binop` は、`syn` が式を読むときに使う **演算子の優先順位（precedence）** を求める関数です。`a + b * c` を読むとき、`*` が `+` より先にまとまることを決めるために、各演算子を区分へ振り分けます。

この関数は、`BinOp`（二項演算子の種類）を受け取り、`Precedence`（優先順位の区分）を返すだけです。計算は行わず、どの演算子が同じ区分に入るかを表にしています。

## コード

```rust:line-numbers=59
    pub(crate) fn of_binop(op: &BinOp) -> Self {
        match op {
            BinOp::Add(_) | BinOp::Sub(_) => Precedence::Sum,
            BinOp::Mul(_) | BinOp::Div(_) | BinOp::Rem(_) => Precedence::Product,
            BinOp::And(_) => Precedence::And,
            BinOp::Or(_) => Precedence::Or,
            BinOp::BitXor(_) => Precedence::BitXor,
            BinOp::BitAnd(_) => Precedence::BitAnd,
            BinOp::BitOr(_) => Precedence::BitOr,
            BinOp::Shl(_) | BinOp::Shr(_) => Precedence::Shift,

            BinOp::Eq(_)
            | BinOp::Lt(_)
            | BinOp::Le(_)
            | BinOp::Ne(_)
            | BinOp::Ge(_)
            | BinOp::Gt(_) => Precedence::Compare,

            BinOp::AddAssign(_)
            | BinOp::SubAssign(_)
            | BinOp::MulAssign(_)
            | BinOp::DivAssign(_)
            | BinOp::RemAssign(_)
            | BinOp::BitXorAssign(_)
            | BinOp::BitAndAssign(_)
            | BinOp::BitOrAssign(_)
            | BinOp::ShlAssign(_)
            | BinOp::ShrAssign(_) => Precedence::Assign,
        }
    }
```

## 前提知識

- **優先順位**: 演算子どうしが結びつく強さの順番です。`*` は `+` より強く結びつくので、`a + b * c` は `a + (b * c)` になります。
- **結合性**: 同じ優先順位の演算子が並んだときに、どちらから結びつくかの決まりです。
- **`BinOp`**: 二項演算子（2 つの値をとる演算子）の種類を表す `syn` の列挙型です。`Add`、`Mul`、`Eq` などがあります。
- **`Precedence`**: `syn` の内部で使う、優先順位の区分です。`Sum`（和）、`Product`（積）、`Compare`（比較）などがあります。
- **複合代入**: `+=` のように、計算と代入をまとめた演算子です。ここでは、代入と同じ区分に入ります。

## 何をしているか

### 1. 算術と論理の演算子

```rust:line-numbers=61
            BinOp::Add(_) | BinOp::Sub(_) => Precedence::Sum,
            BinOp::Mul(_) | BinOp::Div(_) | BinOp::Rem(_) => Precedence::Product,
            BinOp::And(_) => Precedence::And,
            BinOp::Or(_) => Precedence::Or,
            BinOp::BitXor(_) => Precedence::BitXor,
            BinOp::BitAnd(_) => Precedence::BitAnd,
            BinOp::BitOr(_) => Precedence::BitOr,
            BinOp::Shl(_) | BinOp::Shr(_) => Precedence::Shift,
```

加算と減算は `Sum`、乗算、除算、剰余は `Product` に入ります。`&&` と `||` は、それぞれ `And` と `Or` です。ビット演算（`^`、`&`、`|`）と、シフト（`<<`、`>>`）も、別々の区分に分けられています。

### 2. 比較の演算子

```rust:line-numbers=70
            BinOp::Eq(_)
            | BinOp::Lt(_)
            | BinOp::Le(_)
            | BinOp::Ne(_)
            | BinOp::Ge(_)
            | BinOp::Gt(_) => Precedence::Compare,
```

`==`、`<`、`<=`、`!=`、`>=`、`>` は、すべて `Compare` にまとめられます。比較どうしは、ひとまとまりとして扱われるからです。

### 3. 代入の演算子

```rust:line-numbers=77
            BinOp::AddAssign(_)
            | BinOp::SubAssign(_)
            | BinOp::MulAssign(_)
            | BinOp::DivAssign(_)
            | BinOp::RemAssign(_)
            | BinOp::BitXorAssign(_)
            | BinOp::BitAndAssign(_)
            | BinOp::BitOrAssign(_)
            | BinOp::ShlAssign(_)
            | BinOp::ShrAssign(_) => Precedence::Assign,
```

`+=` や `<<=` などの複合代入は、すべて `Assign` に入ります。代入はもっとも弱く結びつく区分なので、式の中で最後にまとめられます。

## ここがすごい

- **表を `match` で網羅する**: すべての `BinOp` の種類を書いているので、新しい演算子が追加されると、この関数はコンパイルエラーになります。
- **同じ区分をまとめて書く**: `|` で複数の種類を並べ、同じ区分に入るものを 1 行にまとめています。読む人が、区分の構成をすぐに把握できます。
- **計算と分類を分ける**: 関数は、演算子を区分へ振り分けるだけです。実際の計算や文字列の処理とは切り離されているので、テストもしやすくなっています。
- **列挙型の値だけで決まる**: 演算子の種類から区分が決まるので、字句の位置や周囲の式に影響されません。

## まとめ

- 演算子の優先順位は、表として書き出すと、読み間違いを防げます。
- 網羅的な `match` にすると、新しい演算子を足したときに、対応の漏れを防げます。
- 分類と計算を分けて考えると、それぞれを独立して理解できます。
