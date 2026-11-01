---
title: 式の最初の部品を、先頭のトークンで振り分ける
description: syn の atom_expr。式の先頭を、グループ、リテラル、丸かっこ、経路、波かっこの順に見て読み方を決める。full 機能がない場合は、波かっこの式を生の形で残す。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/expr.rs
lines: [2005, 2039]
function: atom_expr
difficulty: 2
format: 2
tags: [パース, 型システム, 移植性]
---

## ひとことで

`atom_expr` は、`syn` が Rust の式を読むときの **最初の部品（atom）** を読む関数です。部品とは、リテラル（`1`）、丸かっこ `(…)`、経路（`value`、`Vec::new`）などのことです。式の先頭のトークンを見て、どの読み方を使うかを決めます。

この関数は、先頭のトークンだけで判断できるように、条件を順に並べています。どの条件にも当たらなければ、エラーにします。ただし、`full` 機能がない場合の波かっこだけは、特別に生の形で残せます。

## コード

```rust:line-numbers=2005
    fn atom_expr(input: ParseStream) -> Result<Expr> {
        if input.peek(token::Group) && {
            let group = crate::group::parse_group(&input.fork())?;
            !(group.content.peek(Lifetime) && group.content.peek2(End))
        } {
            expr_group(input)
        } else if input.peek(Lit) {
            input.parse().map(Expr::Lit)
        } else if input.peek(token::Paren) {
            paren_or_tuple(input)
        } else if input.peek(Ident)
            || input.peek(Token![::])
            || input.peek(Token![<])
            || input.peek(Token![self])
            || input.peek(Token![Self])
            || input.peek(Token![super])
            || input.peek(Token![crate])
        {
            path_or_macro_or_struct(input)
        } else if input.is_empty() {
            Err(input.error("expected an expression"))
        } else {
            if input.peek(token::Brace) {
                let scan = input.fork();
                let content;
                braced!(content in scan);
                if content.parse::<Expr>().is_ok() && content.is_empty() {
                    let expr_block = verbatim::between(input.cursor(), scan.cursor());
                    input.advance_to(&scan);
                    return Ok(Expr::Verbatim(expr_block));
                }
            }
            Err(input.error("unsupported expression; enable syn's features=[\"full\"]"))
        }
    }
```

## 前提知識

- **atom（部品）**: 式を組み立てる最小の単位です。演算子で結ばれる前の、一番小さなまとまりを指します。
- **`Group` トークン**: マクロの展開などで生まれる、見えない囲みのトークンです。ソースに直接書かれた括弧とは違います。
- **`Lifetime`**: `'a` のような寿命の名前です。ラベルの付いた式（`'a: loop {}`）で使われます。
- **経路の先頭にある記号**: `::`、`<`、`self`、`Self`、`super`、`crate` は、経路の始まりを表す特別なトークンです。
- **`ParseStream::fork`**: 入力を複製して試し読みをする仕組みです。本体の入力の位置は変わりません。

## 何をしているか

### 1. グループを読む

```rust:line-numbers=2006
        if input.peek(token::Group) && {
            let group = crate::group::parse_group(&input.fork())?;
            !(group.content.peek(Lifetime) && group.content.peek2(End))
        } {
            expr_group(input)
```

見えない囲みのグループなら、その中身を試し読みします。ただし、中身がラベル（寿命の名前）だけの場合は除きます。該当するなら `expr_group` で式として読みます。

### 2. リテラルと丸かっこを読む

```rust:line-numbers=2011
        } else if input.peek(Lit) {
            input.parse().map(Expr::Lit)
        } else if input.peek(token::Paren) {
            paren_or_tuple(input)
```

次がリテラルなら、そのまま `Expr::Lit` にします。丸かっこなら、`paren_or_tuple` で括弧式かタプルかを決めます。

### 3. 経路で始まるものを読む

```rust:line-numbers=2015
        } else if input.peek(Ident)
            || input.peek(Token![::])
            || input.peek(Token![<])
            || input.peek(Token![self])
            || input.peek(Token![Self])
            || input.peek(Token![super])
            || input.peek(Token![crate])
        {
            path_or_macro_or_struct(input)
```

識別子や、経路の先頭になる記号（`::`、`<`、`self` など）であれば、`path_or_macro_or_struct` で経路、マクロ、構造体リテラルのどれかを読みます。

### 4. 空と、それ以外の場合

```rust:line-numbers=2024
        } else if input.is_empty() {
            Err(input.error("expected an expression"))
```

入力が空なら、「式が必要」というエラーを返します。

```rust:line-numbers=2026
        } else {
            if input.peek(token::Brace) {
                let scan = input.fork();
                let content;
                braced!(content in scan);
                if content.parse::<Expr>().is_ok() && content.is_empty() {
                    let expr_block = verbatim::between(input.cursor(), scan.cursor());
                    input.advance_to(&scan);
                    return Ok(Expr::Verbatim(expr_block));
                }
            }
            Err(input.error("unsupported expression; enable syn's features=[\"full\"]"))
```

どれにも当たらず、次が波かっこの場合は、中身が式として読めるかを試します。`full` 機能がなくても、式として正しければ、その範囲を `Expr::Verbatim` として残します。それ以外は、「`full` 機能を有効にしてください」というエラーを返します。

## ここがすごい

- **先頭のトークンだけで決まる**: 式の読み方は、先頭の 1 つか 2 つのトークンを見れば決まります。読み直しが少なく、速く判定できます。
- **順序が重要**: グループを最初に確かめるのは、見えない囲みが他の形と似ていて、取り違えやすいからです。順序で誤読を防いでいます。
- **機能の違いを親切に伝える**: `full` がないために読めない式は、どの機能を有効にすればよいかを、エラーのメッセージで示しています。
- **生の形で残す**: 解析しきれない式も、トークンとして残すことができるので、情報を失わずに済みます。

## まとめ

- 文法の判断は、先頭のトークンの種類で順に振り分けると、読みやすく速くなります。
- 似た形が混ざるときは、確かめる順序を決めておくと誤読を防げます。
- エラーには、解決の方法（有効にすべき機能など）を含めると、利用者が直しやすくなります。
