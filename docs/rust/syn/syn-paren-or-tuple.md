---
title: 丸かっこが括弧か、タプルかを見分ける
description: syn の paren_or_tuple。かっこの中身を数えて、空なら空のタプル、要素が 1 つなら括弧式、カンマがあればタプルとして組み立てる。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/expr.rs
lines: [2118, 2154]
function: paren_or_tuple
difficulty: 2
format: 2
tags: [パース, 型システム]
---

## ひとことで

`paren_or_tuple` は、Rust のコードの丸かっこ `( … )` を読むときに、それが **括弧で囲んだ式** なのか、**タプル** なのかを決める関数です。`syn` は、Rust のコードを解析して木構造にする crate で、この関数はその一部です。

丸かっこの中身が「空」「式が 1 つ」「カンマ区切りで式が複数」のどれかによって、作る構文の種類を変えます。たとえば `(x)` は括弧式で、`(x,)` と `(a, b)` はタプルです。

## コード

```rust:line-numbers=2118
    fn paren_or_tuple(input: ParseStream) -> Result<Expr> {
        let content;
        let paren_token = parenthesized!(content in input);
        if content.is_empty() {
            return Ok(Expr::Tuple(ExprTuple {
                attrs: Vec::new(),
                paren_token,
                elems: Punctuated::new(),
            }));
        }

        let first: Expr = content.parse()?;
        if content.is_empty() {
            return Ok(Expr::Paren(ExprParen {
                attrs: Vec::new(),
                paren_token,
                expr: Box::new(first),
            }));
        }

        let mut elems = Punctuated::new();
        elems.push_value(first);
        while !content.is_empty() {
            let punct = content.parse()?;
            elems.push_punct(punct);
            if content.is_empty() {
                break;
            }
            let value = content.parse()?;
            elems.push_value(value);
        }
        Ok(Expr::Tuple(ExprTuple {
            attrs: Vec::new(),
            paren_token,
            elems,
        }))
    }
```

## 前提知識

- **タプル**: 型の異なる値を、かっこでまとめて 1 つの値にしたものです。`(1, "a")` のように書きます。
- **括弧式**: 式を優先順位の都合で囲んだものです。`(1 + 2) * 3` の `(1 + 2)` が例です。値は中身と同じです。
- **構文解析（パース）**: ソースコードの文字列を、意味のある木構造（`Expr` など）に変える作業です。
- **`ParseStream`**: 解析の途中の入力を表す型です。`parse` でそこから値を 1 つ取り出し、読んだ分だけ先へ進みます。
- **`Punctuated`**: 「値」と「区切りの記号（カンマ）」を交互に持つ列です。`push_value` と `push_punct` で、順に追加します。

## 何をしているか

### 1. 中身が空なら、空のタプルを作る

```rust:line-numbers=2119
        let content;
        let paren_token = parenthesized!(content in input);
        if content.is_empty() {
            return Ok(Expr::Tuple(ExprTuple {
                attrs: Vec::new(),
                paren_token,
                elems: Punctuated::new(),
            }));
        }
```

`parenthesized!` で、かっこの中身を `content` という別の入力として取り出します。中身が空なら `()` にあたる空のタプルを返します。`paren_token` は、かっこの位置の情報です。

### 2. 式が 1 つだけなら、括弧式を作る

```rust:line-numbers=2129
        let first: Expr = content.parse()?;
        if content.is_empty() {
            return Ok(Expr::Paren(ExprParen {
                attrs: Vec::new(),
                paren_token,
                expr: Box::new(first),
            }));
        }
```

最初の式を読みます。その後に何も続かなければ、`(x)` と同じなので、`Expr::Paren` を返します。ここで、カンマがない限りはタプルにならないことが分かります。

### 3. カンマが続くなら、要素を集める

```rust:line-numbers=2138
        let mut elems = Punctuated::new();
        elems.push_value(first);
        while !content.is_empty() {
            let punct = content.parse()?;
            elems.push_punct(punct);
            if content.is_empty() {
                break;
            }
            let value = content.parse()?;
            elems.push_value(value);
        }
```

最初の式を `elems` に入れ、中身がなくなるまで、「カンマ、式」の組を読みます。カンマを `push_punct` で追加してから、その後に式がなければ、`break` して終わります。これで、末尾にカンマがある `(x,)` も正しく扱えます。

### 4. タプルとして返す

```rust:line-numbers=2149
        Ok(Expr::Tuple(ExprTuple {
            attrs: Vec::new(),
            paren_token,
            elems,
        }))
```

集めた要素を `ExprTuple` に入れて返します。ここまで来た時点で、カンマが 1 つ以上あることが保証されています。

## ここがすごい

- **少ない先読みで判定する**: 中身を先頭から読みながら、「空か」「続きがあるか」だけを確かめるので、同じ入力を何度も読み直しません。
- **末尾のカンマを特別扱いしない**: カンマの後に式がなければ `break` するだけで、`(x,)` と `(a, b,)` を同じ仕組みで扱えます。
- **区切りを値と分けて持つ**: `Punctuated` は、値とカンマを分けて持つので、後から要素を数えたり、カンマの位置を調べたりしやすい構造になっています。
- **エラーは `?` で伝える**: 途中の式やカンマの解析に失敗すると、その時点でエラーを返します。不完全なタプルが作られることはありません。

## まとめ

- 括弧の判定は、中身の数とカンマの有無を見れば、正しく決められます。
- 末尾の区切りは、「区切りを読んでから、続きがあるかを確かめる」形にすると、特別な場合を減らせます。
- 解析の結果を、値と区切りを分けた構造で持つと、後の処理が扱いやすくなります。
