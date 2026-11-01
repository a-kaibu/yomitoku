---
title: enum の判別値を、読めなければそのまま残す
description: syn の Variant::parse。「= 式」の部分を、full 機能なら式として読み、そうでなければ先読みで試し、読めなければトークンのまま残す。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/data.rs
lines: [295, 332]
function: parse
difficulty: 2
format: 2
tags: [パース, 型システム, 移植性]
---

## ひとことで

`Variant::parse` は、Rust の `enum` の 1 つの「バリアント」（例: `Red = 1`）を読む関数です。名前、フィールド、そして `= 式` で書かれる判別値（discriminant）を読みます。

判別値の式は、`syn` の機能によって読み方が変わります。`full` 機能が有効なら、式として完全に読みます。無効なら、式を読めるかを先に試し、読めなければトークンの並びをそのまま残します。

## コード

```rust:line-numbers=295
        fn parse(input: ParseStream) -> Result<Self> {
            let attrs = input.call(Attribute::parse_outer)?;
            let _visibility: Visibility = input.parse()?;
            let ident: Ident = input.parse()?;
            let fields = if input.peek(token::Brace) {
                Fields::Named(input.parse()?)
            } else if input.peek(token::Paren) {
                Fields::Unnamed(input.parse()?)
            } else {
                Fields::Unit
            };
            let discriminant = if input.peek(Token![=]) {
                let eq_token: Token![=] = input.parse()?;
                #[cfg(feature = "full")]
                let discriminant: Expr = input.parse()?;
                #[cfg(not(feature = "full"))]
                let discriminant = {
                    let begin = input.cursor();
                    let ahead = input.fork();
                    let mut discriminant: Result<Expr> = ahead.parse();
                    if discriminant.is_ok() {
                        input.advance_to(&ahead);
                    } else if scan_expr(input).is_ok() {
                        discriminant = Ok(Expr::Verbatim(verbatim::between(begin, input.cursor())));
                    }
                    discriminant?
                };
                Some((eq_token, discriminant))
            } else {
                None
            };
            Ok(Variant {
                attrs,
                ident,
                fields,
                discriminant,
            })
        }
```

## 前提知識

- **`enum` のバリアント**: 列挙型の 1 つの選択肢です。`Red`、`Point { x: i32 }`、`Some(T)` のように、フィールドを持つ形もあります。
- **判別値（discriminant）**: バリアントに付ける整数の値です。`Red = 1` の `1` がこれに当たります。
- **`feature = "full"`**: `syn` の機能の 1 つです。有効なときは、Rust の式を完全に解析する型が使えます。無効なときは、一部を簡単な形で扱います。
- **`fork` と `advance_to`**: 入力を複製して、試しに読むための仕組みです。読めたら、本体の入力を複製先の位置まで進めます。
- **`Expr::Verbatim`**: 解析せずに、トークンをそのまま保存する式です。`verbatim::between` で、ある範囲のトークンを取り出せます。

## 何をしているか

### 1. 名前、フィールド、判別値の有無を読む

```rust:line-numbers=296
            let attrs = input.call(Attribute::parse_outer)?;
            let _visibility: Visibility = input.parse()?;
            let ident: Ident = input.parse()?;
            let fields = if input.peek(token::Brace) {
                Fields::Named(input.parse()?)
            } else if input.peek(token::Paren) {
                Fields::Unnamed(input.parse()?)
            } else {
                Fields::Unit
            };
```

属性、可視性、名前を読みます。次に、`{` ならば名前付きフィールド、`(` ならば無名のフィールド、どちらでもなければ空のフィールドとします。`input.peek` は、次のトークンを消費せずに確かめる操作です。

### 2. `full` 機能のとき

```rust:line-numbers=306
            let discriminant = if input.peek(Token![=]) {
                let eq_token: Token![=] = input.parse()?;
                #[cfg(feature = "full")]
                let discriminant: Expr = input.parse()?;
```

`=` が続いていれば、`=` を読んでから、判別値を `Expr` として完全に読みます。この部分は `full` 機能が有効なときにだけコンパイルされます。

### 3. `full` 機能がないとき

```rust:line-numbers=310
                #[cfg(not(feature = "full"))]
                let discriminant = {
                    let begin = input.cursor();
                    let ahead = input.fork();
                    let mut discriminant: Result<Expr> = ahead.parse();
                    if discriminant.is_ok() {
                        input.advance_to(&ahead);
                    } else if scan_expr(input).is_ok() {
                        discriminant = Ok(Expr::Verbatim(verbatim::between(begin, input.cursor())));
                    }
                    discriminant?
                };
```

まず、`fork` で入力を複製し、式を読んでみます。読めたら、その分だけ本体の入力を進めます。読めなければ `scan_expr` で式の範囲を飛ばし、その間のトークンを `Expr::Verbatim` として保存します。どちらも失敗したときだけ、`?` によりエラーになります。

### 4. バリアントを組み立てる

```rust:line-numbers=322
                Some((eq_token, discriminant))
            } else {
                None
            };
            Ok(Variant {
                attrs,
                ident,
                fields,
                discriminant,
            })
```

`=` と判別値のペアを `Some` で包みます。`=` がなければ `None` になり、判別値のない通常のバリアントとして返します。

## ここがすごい

- **機能によって精度を変える**: 利用者が `full` を選んだときは完全な式を、選ばなかったときは最小限の読み方を使うので、軽さと正確さを切り替えられます。
- **試し読みを安全に行う**: `fork` で複製した入力を使うので、読みに失敗しても本体の位置は変わりません。
- **読めない式も失わない**: `Expr::Verbatim` によって、解析しきれない式もトークンとして残ります。コード生成のときに、元の形をそのまま出力できます。
- **判別値を `Option` で表す**: 「ある」と「ない」を型で分けるので、後の処理で書き漏れが起きにくくなっています。

## まとめ

- 読みの失敗を前提にするときは、入力を複製して試してから、確定させる形が安全です。
- 解析しきれないものを、そのまま保存しておくと、情報を失わずに済みます。
- 任意の要素を `Option` で表すと、「ない」場合の処理が型で明確になります。
