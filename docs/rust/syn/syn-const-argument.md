---
title: const ジェネリクスの引数を読み分ける
description: syn の const_argument。ジェネリクスに渡す定数の引数を、リテラル、識別子、波かっこの式のどれかとして読み、どれにも当たらなければ候補付きのエラーを返す。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/path.rs
lines: [408, 444]
function: const_argument
difficulty: 2
format: 2
tags: [パース, 型システム, 移植性]
---

## ひとことで

`const_argument` は、`syn` で const ジェネリクスの **定数の引数** を読む関数です。たとえば `Array::<3>` の `3`、`Array::<N>` の `N`、`Array::<{ N + 1 }>` の波かっこの中身が対象になります。

読める形は 3 通りです。リテラル（数値など）、識別子（定数の名前）、波かっこで囲んだ式です。どれにも当たらなければ、「ここには何が来るべきだったか」という候補を付けて、エラーを返します。

## コード

```rust:line-numbers=408
    pub(crate) fn const_argument(input: ParseStream) -> Result<Expr> {
        let lookahead = input.lookahead1();

        if input.peek(Lit) {
            let lit = input.parse()?;
            return Ok(Expr::Lit(lit));
        }

        if input.peek(Ident) {
            let ident: Ident = input.parse()?;
            return Ok(Expr::Path(ExprPath {
                attrs: Vec::new(),
                qself: None,
                path: Path::from(ident),
            }));
        }

        if input.peek(token::Brace) {
            #[cfg(feature = "full")]
            {
                let block: ExprBlock = input.parse()?;
                return Ok(Expr::Block(block));
            }

            #[cfg(not(feature = "full"))]
            {
                let begin = input.cursor();
                let content;
                braced!(content in input);
                content.parse::<Expr>()?;
                let verbatim = verbatim::between(begin, input.cursor());
                return Ok(Expr::Verbatim(verbatim));
            }
        }

        Err(lookahead.error())
    }
```

## 前提知識

- **const ジェネリクス**: 型の引数に、型ではなく定数（数値など）を渡せる仕組みです。`[i32; N]` のように、配列の長さを型で表すときに使われます。
- **リテラル**: ソースに直接書かれた値です。`3`、`true`、`"a"` などが該当します。
- **波かっこ `{ … }`**: 式を囲むための記号です。定数の引数では、`{ N + 1 }` のように、計算を含む式を書けるようにします。
- **`lookahead1`（先読み）**: 次に来てよい形を複数確かめ、どれにも当たらなかったときに、その候補をまとめてエラーにする仕組みです。`Lookahead1::error` と同じ仕組みです。
- **`ParseStream` の `peek`**: 次のトークンが指定した種類かを、読み進めずに確かめる操作です。

## 何をしているか

### 1. リテラルを読む

```rust:line-numbers=411
        if input.peek(Lit) {
            let lit = input.parse()?;
            return Ok(Expr::Lit(lit));
        }
```

`peek(Lit)` で、次のトークンがリテラルかを確かめます。そうなら、リテラルとして読み、`Expr::Lit` にして返します。

### 2. 識別子を読む

```rust:line-numbers=416
        if input.peek(Ident) {
            let ident: Ident = input.parse()?;
            return Ok(Expr::Path(ExprPath {
                attrs: Vec::new(),
                qself: None,
                path: Path::from(ident),
            }));
        }
```

次が識別子なら、1 つの名前だけからなる経路（`Path`）として読みます。`Expr::Path` の `qself` は `None` にします。`qself` は、`<T as Trait>` のような修飾された経路の情報を入れる場所で、ここでは使いません。

### 3. 波かっこの式を読む

```rust:line-numbers=425
        if input.peek(token::Brace) {
            #[cfg(feature = "full")]
            {
                let block: ExprBlock = input.parse()?;
                return Ok(Expr::Block(block));
            }

```

`full` 機能が有効なら、波かっこを `ExprBlock` として完全に読みます。

```rust:line-numbers=432
            #[cfg(not(feature = "full"))]
            {
                let begin = input.cursor();
                let content;
                braced!(content in input);
                content.parse::<Expr>()?;
                let verbatim = verbatim::between(begin, input.cursor());
                return Ok(Expr::Verbatim(verbatim));
            }
```

`full` 機能が無効なら、中身を `Expr` として読めるかを確かめた上で、範囲のトークンを `Expr::Verbatim` として保存します。解析の精度は下がりますが、書かれた内容は失われません。

### 4. どれにも当たらなければエラーにする

```rust:line-numbers=443
        Err(lookahead.error())
```

`lookahead.error()` で、ここで試した 3 つの形を候補に並べたエラーを返します。利用者は、「リテラル、識別子、または波かっこが必要」という内容を読めます。

## ここがすごい

- **先に種類で振り分ける**: 次のトークンの種類を見てから読むので、読み直しをしません。3 つの形が互いに重ならないことが、この順番を安全にしています。
- **候補を自動で集める**: 各 `peek` が候補を記録しているので、エラーの文を書く人が候補の一覧を手で管理する必要がありません。
- **機能による精度の切り替え**: `full` の有無で、波かっこの中身の読み方を変えています。軽い解析では、中身を失わずに残す形を選べます。
- **形の意味がはっきりしている**: リテラル、識別子、式を分けて `Expr` の別の形にするので、後の処理で、定数がどの形で書かれたかを区別できます。

## まとめ

- 文法の選択肢は、次のトークンの種類で振り分けると、読みやすく安全になります。
- 候補を記録しておくと、エラーメッセージを自動で分かりやすくできます。
- 機能の有無で解析の精度を変えるときも、内容を失わない形にしておくと安心です。
