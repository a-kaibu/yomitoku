---
title: クロージャの引数に属性と型を付けて読む
description: syn の closure_arg。クロージャの引数のパターンを読み、続いてコロンがあれば型を付ける。そうでなければ先頭の属性をパターンの種類ごとに書き込む。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/expr.rs
lines: [2718, 2752]
function: closure_arg
difficulty: 2
format: 2
tags: [パース, 型システム, 防御的プログラミング]
---

## ひとことで

`closure_arg` は、`syn` がクロージャ（無名関数）の引数を読む関数です。たとえば `|x| x + 1` の `x`、`|x: i32| x + 1` の `x: i32`、`|#[allow(unused)] x| 0` の属性付きの引数を読みます。

引数は、まずパターン（名前など）として読みます。その後に `:` があれば型を付け、なければ、引数の前に書かれた属性を、そのパターンに付け直します。

## コード

```rust:line-numbers=2718
    fn closure_arg(input: ParseStream) -> Result<Pat> {
        let attrs = input.call(Attribute::parse_outer)?;
        let mut pat = Pat::parse_single(input)?;

        if input.peek(Token![:]) {
            Ok(Pat::Type(PatType {
                attrs,
                pat: Box::new(pat),
                colon_token: input.parse()?,
                ty: input.parse()?,
            }))
        } else {
            match &mut pat {
                Pat::Const(pat) => pat.attrs = attrs,
                Pat::Guard(_) => unreachable!(),
                Pat::Ident(pat) => pat.attrs = attrs,
                Pat::Lit(pat) => pat.attrs = attrs,
                Pat::Macro(pat) => pat.attrs = attrs,
                Pat::Or(pat) => pat.attrs = attrs,
                Pat::Paren(pat) => pat.attrs = attrs,
                Pat::Path(pat) => pat.attrs = attrs,
                Pat::Range(pat) => pat.attrs = attrs,
                Pat::Reference(pat) => pat.attrs = attrs,
                Pat::Rest(pat) => pat.attrs = attrs,
                Pat::Slice(pat) => pat.attrs = attrs,
                Pat::Struct(pat) => pat.attrs = attrs,
                Pat::Tuple(pat) => pat.attrs = attrs,
                Pat::TupleStruct(pat) => pat.attrs = attrs,
                Pat::Type(_) => unreachable!(),
                Pat::Verbatim(_) => {}
                Pat::Wild(pat) => pat.attrs = attrs,
            }
            Ok(pat)
        }
    }
```

## 前提知識

- **クロージャ**: `|引数| 式` の形で書く無名の関数です。引数の書き方は、通常の関数の引数に近い形です。
- **パターン（`Pat`）**: 値の形を表す書き方です。名前（`x`）、タプル（`(a, b)`）、構造体などがあります。引数にもパターンを書けます。
- **属性（attribute）**: `#[allow(...)]` のように、コードに付ける注釈です。引数の前にも付けられます。
- **`Pat::parse_single`**: 1 つのパターンを読む関数です。`|a | b|` のような、`|` を含むパターンは読みません。
- **`unreachable!`**: 到達しないはずの場所で使うマクロです。もし到達したら、パニックします。

## 何をしているか

### 1. 属性とパターンを読む

```rust:line-numbers=2719
        let attrs = input.call(Attribute::parse_outer)?;
        let mut pat = Pat::parse_single(input)?;
```

まず、引数の前にある属性を読みます。次に、1 つのパターンを読みます。この段階では、型はまだ読みません。

### 2. 型が続く場合

```rust:line-numbers=2722
        if input.peek(Token![:]) {
            Ok(Pat::Type(PatType {
                attrs,
                pat: Box::new(pat),
                colon_token: input.parse()?,
                ty: input.parse()?,
            }))
```

次がコロン `:` なら、`PatType` を作ります。パターン、コロン、型を順に読み、属性は `PatType` の属性として入れます。

### 3. 型が続かない場合

```rust:line-numbers=2730
            match &mut pat {
                Pat::Const(pat) => pat.attrs = attrs,
                Pat::Guard(_) => unreachable!(),
                Pat::Ident(pat) => pat.attrs = attrs,
                Pat::Lit(pat) => pat.attrs = attrs,
                Pat::Macro(pat) => pat.attrs = attrs,
                Pat::Or(pat) => pat.attrs = attrs,
                Pat::Paren(pat) => pat.attrs = attrs,
                Pat::Path(pat) => pat.attrs = attrs,
                Pat::Range(pat) => pat.attrs = attrs,
                Pat::Reference(pat) => pat.attrs = attrs,
                Pat::Rest(pat) => pat.attrs = attrs,
                Pat::Slice(pat) => pat.attrs = attrs,
                Pat::Struct(pat) => pat.attrs = attrs,
                Pat::Tuple(pat) => pat.attrs = attrs,
                Pat::TupleStruct(pat) => pat.attrs = attrs,
                Pat::Type(_) => unreachable!(),
                Pat::Verbatim(_) => {}
                Pat::Wild(pat) => pat.attrs = attrs,
            }
            Ok(pat)
```

コロンがなければ、パターンの種類ごとに、属性の入る場所を書き込みます。`match` は、すべての種類を列挙しています。`Pat::Guard` と `Pat::Type` は、ここでは現れない種類なので `unreachable!` にしています。`Pat::Verbatim` は、属性を保存できないので何もしません。

## ここがすごい

- **`match` で全部を列挙する**: 種類を 1 つも省略していないので、`syn` に新しいパターンの種類が加わると、この関数はコンパイルエラーになります。書き漏れを、コンパイラが指摘してくれます。
- **属性の付け先を型で決める**: 属性は、そのパターンの種類が持つ `attrs` にだけ入ります。どこに付くかを、型の仕組みで保証しています。
- **到達しない場合を明示する**: `unreachable!` で、この関数の前提（型の付いたパターンは来ない）を文字で表しています。前提が崩れれば、すぐに分かります。
- **型付きの引数を分けて扱う**: 型の有無で流れを 2 つに分けるので、どちらの形も読みやすく保たれます。

## まとめ

- 列挙型の各要素に同じ処理をするときは、`match` で全部を書くと、新しい要素の追加に気づけます。
- 前提として到達しない場合は、`unreachable!` で明示すると、読む人に意図が伝わります。
- 付属する情報（属性）は、その情報を持つ場所を型で決めると、取り違えを防げます。
