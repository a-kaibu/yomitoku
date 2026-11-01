---
title: 派生入力を、元の順序でトークンに戻す
description: syn の DeriveInput の to_tokens。属性、可視性、キーワード、名前、ジェネリクスを書き、where 句を構造体の種類ごとに決まった位置に置いてから、本体を書く。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/derive.rs
lines: [219, 258]
function: to_tokens
difficulty: 2
format: 2
tags: [入出力, 型システム, 設計パターン]
---

## ひとことで

`DeriveInput` の `to_tokens` は、`syn` が解析した派生マクロの入力（`struct` や `enum` の定義全体）を、**トークンの列に戻す** 処理です。マクロが定義を読み取って、それをソースとして書き出すときに使われます。

書き出しの順序は、Rust の文法に沿っています。属性と可視性、種類を表すキーワード、名前、ジェネリクスの順に書きます。そのあと、`where` 句と本体を、定義の種類ごとに異なる位置に置きます。

## コード

```rust:line-numbers=219
        fn to_tokens(&self, tokens: &mut TokenStream) {
            for attr in self.attrs.outer() {
                attr.to_tokens(tokens);
            }
            self.vis.to_tokens(tokens);
            match &self.data {
                Data::Struct(d) => d.struct_token.to_tokens(tokens),
                Data::Enum(d) => d.enum_token.to_tokens(tokens),
                Data::Union(d) => d.union_token.to_tokens(tokens),
            }
            self.ident.to_tokens(tokens);
            self.generics.to_tokens(tokens);
            match &self.data {
                Data::Struct(data) => match &data.fields {
                    Fields::Named(fields) => {
                        self.generics.where_clause.to_tokens(tokens);
                        fields.to_tokens(tokens);
                    }
                    Fields::Unnamed(fields) => {
                        fields.to_tokens(tokens);
                        self.generics.where_clause.to_tokens(tokens);
                        TokensOrDefault(&data.semi_token).to_tokens(tokens);
                    }
                    Fields::Unit => {
                        self.generics.where_clause.to_tokens(tokens);
                        TokensOrDefault(&data.semi_token).to_tokens(tokens);
                    }
                },
                Data::Enum(data) => {
                    self.generics.where_clause.to_tokens(tokens);
                    data.brace_token.surround(tokens, |tokens| {
                        data.variants.to_tokens(tokens);
                    });
                }
                Data::Union(data) => {
                    self.generics.where_clause.to_tokens(tokens);
                    data.fields.to_tokens(tokens);
                }
            }
        }
```

## 前提知識

- **`DeriveInput`**: `#[derive]` が付いた型定義の全体を表す `syn` の型です。属性、可視性、名前、ジェネリクス、そして `Data` を持ちます。
- **`Data`**: 定義の種類を表す列挙型です。`Struct`、`Enum`、`Union` の 3 種類があります。
- **`where` 句**: ジェネリクスに付ける条件の並びです。`struct S<T> where T: Clone { … }` のように書きます。
- **`Fields`**: 構造体のフィールドの形です。名前付き（`{ … }`）、無名（`( … )`）、なし（`;` だけ）の 3 種類があります。
- **`ToTokens`**: 値をトークンの列に書き出すためのトレイトです。`to_tokens` を呼ぶと、その値に対応する文字列の要素が `TokenStream` に追加されます。

## 何をしているか

### 1. 属性と可視性、キーワード、名前を書く

```rust:line-numbers=220
            for attr in self.attrs.outer() {
                attr.to_tokens(tokens);
            }
            self.vis.to_tokens(tokens);
```

まず、外側の属性を順に書き、次に `pub` などの可視性を書きます。

```rust:line-numbers=224
            match &self.data {
                Data::Struct(d) => d.struct_token.to_tokens(tokens),
                Data::Enum(d) => d.enum_token.to_tokens(tokens),
                Data::Union(d) => d.union_token.to_tokens(tokens),
            }
            self.ident.to_tokens(tokens);
            self.generics.to_tokens(tokens);
```

次に、`struct`、`enum`、`union` のどれかを書き、続けて名前とジェネリクスを書きます。ここで、どの種類の定義かによって、書くキーワードが変わります。

### 2. 名前付き構造体の where 句

```rust:line-numbers=231
            match &self.data {
                Data::Struct(data) => match &data.fields {
                    Fields::Named(fields) => {
                        self.generics.where_clause.to_tokens(tokens);
                        fields.to_tokens(tokens);
                    }
```

名前付きフィールドの構造体では、`where` 句をフィールドの前に置きます。そのあと、`{ … }` のフィールドを書きます。

### 3. 無名構造体とユニット構造体

```rust:line-numbers=237
                    Fields::Unnamed(fields) => {
                        fields.to_tokens(tokens);
                        self.generics.where_clause.to_tokens(tokens);
                        TokensOrDefault(&data.semi_token).to_tokens(tokens);
                    }
                    Fields::Unit => {
                        self.generics.where_clause.to_tokens(tokens);
                        TokensOrDefault(&data.semi_token).to_tokens(tokens);
                    }
```

無名構造体（タプル構造体）では、フィールドを書いたあとに `where` 句と、末尾の `;` を置きます。フィールドのないユニット構造体では、`where` 句と `;` だけを書きます。

### 4. enum と union

```rust:line-numbers=247
                Data::Enum(data) => {
                    self.generics.where_clause.to_tokens(tokens);
                    data.brace_token.surround(tokens, |tokens| {
                        data.variants.to_tokens(tokens);
                    });
                }
                Data::Union(data) => {
                    self.generics.where_clause.to_tokens(tokens);
                    data.fields.to_tokens(tokens);
                }
```

`enum` では、`where` 句を置いたあと、波かっこでバリアントの一覧を囲みます。`union` では、`where` 句のあとにフィールドを書きます。

## ここがすごい

- **書く順序を型の種類から決める**: 定義の種類ごとに、`where` 句と本体の位置が異なるという Rust の文法を、`match` で素直に表しています。
- **書き戻しを解析と対応させる**: 解析で読んだ情報（`semi_token` など）をそのまま使うので、元のソースに近い形を再現できます。
- **欠けた記号を補う**: `TokensOrDefault` で、ソースにない `;` も必要なら補えます。出力は必ず有効な形になります。
- **同じ書き方を全体で使う**: どの部分も `to_tokens` を呼ぶだけなので、一つ一つの部品の書き方を、全体の仕組みから分けて考えられます。

## まとめ

- 文法の順序は、定義の種類ごとの `match` で書くと、分岐が分かりやすくなります。
- 解析の情報を書き戻しに使うと、元の形に近い出力が得られます。
- 欠けた記号は、既定の値で補うと、出力を常に有効な形に保てます。
