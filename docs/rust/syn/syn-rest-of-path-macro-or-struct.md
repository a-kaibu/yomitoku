---
title: 経路の後に続く記号で、式の種類を決める
description: syn の rest_of_path_or_macro_or_struct。経路の後ろが感嘆符なら マクロ、波かっこなら構造体リテラル、どちらでもなければ単なる経路の式として読み分ける。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/expr.rs
lines: [2071, 2106]
function: rest_of_path_or_macro_or_struct
difficulty: 2
format: 2
tags: [パース, 型システム, 移植性]
---

## ひとことで

`rest_of_path_or_macro_or_struct` は、`syn` が Rust の式を読むときに、**名前（経路）の後ろに続く記号を見て、式の種類を決める** 関数です。たとえば `vec![1, 2]` はマクロ、`Point { x: 1 }` は構造体リテラル、`value` だけなら単なる経路の式になります。

経路はすでに読まれていて、その後ろの 1 つのトークンを見るだけで判断します。判断の順序は、マクロ、構造体リテラル、経路の順です。

## コード

```rust:line-numbers=2071
    fn rest_of_path_or_macro_or_struct(
        qself: Option<QSelf>,
        path: Path,
        input: ParseStream,
        #[cfg(feature = "full")] allow_struct: AllowStruct,
    ) -> Result<Expr> {
        if qself.is_none()
            && input.peek(Token![!])
            && !input.peek(Token![!=])
            && path.is_mod_style()
        {
            let bang_token: Token![!] = input.parse()?;
            let (delimiter, tokens) = mac::parse_delimiter(input)?;
            return Ok(Expr::Macro(ExprMacro {
                attrs: Vec::new(),
                mac: Macro {
                    path,
                    bang_token,
                    delimiter,
                    tokens,
                },
            }));
        }

        #[cfg(not(feature = "full"))]
        let allow_struct = (true,);
        if allow_struct.0 && input.peek(token::Brace) {
            return expr_struct_helper(input, qself, path).map(Expr::Struct);
        }

        Ok(Expr::Path(ExprPath {
            attrs: Vec::new(),
            qself,
            path,
        }))
    }
```

## 前提知識

- **経路（path）**: `std::vec::Vec` や `value` のように、名前を `::` でつなげたものです。
- **マクロ呼び出し**: `名前!(…)`、`名前![…]`、`名前!{…}` の形で書く呼び出しです。`!` の後ろの区切り記号で、中身の囲み方が決まります。
- **構造体リテラル**: `Point { x: 1, y: 2 }` のように、構造体の値を波かっこで直接書いたものです。
- **`allow_struct`**: 構造体リテラルを式として読んでよいかを表す設定です。`if` の条件など、波かっこが別の意味を持つ場所では、読まないように指定されます。
- **`QSelf`**: `<T as Trait>::Name` のような修飾された経路の先頭の情報です。修飾があるときは、マクロや構造体リテラルにはならないと決まっています。

## 何をしているか

### 1. マクロかどうかを確かめる

```rust:line-numbers=2077
        if qself.is_none()
            && input.peek(Token![!])
            && !input.peek(Token![!=])
            && path.is_mod_style()
        {
            let bang_token: Token![!] = input.parse()?;
            let (delimiter, tokens) = mac::parse_delimiter(input)?;
            return Ok(Expr::Macro(ExprMacro {
                attrs: Vec::new(),
                mac: Macro {
                    path,
                    bang_token,
                    delimiter,
                    tokens,
                },
            }));
        }
```

修飾されていない経路の後に、`!` が続き、それが `!=` という 1 つの比較演算子ではなく、経路がジェネリクスの引数を持たない普通の形（mod style）なら、マクロ呼び出しとして読みます。`!=` は比較演算子なので、マクロとは区別します。`parse_delimiter` で、囲みの記号と中のトークンを読みます。

### 2. 構造体リテラルかどうかを確かめる

```rust:line-numbers=2095
        #[cfg(not(feature = "full"))]
        let allow_struct = (true,);
        if allow_struct.0 && input.peek(token::Brace) {
            return expr_struct_helper(input, qself, path).map(Expr::Struct);
        }
```

`full` 機能が無効のときは、`allow_struct` を真として扱います。その上で、許されていて次が波かっこなら、`expr_struct_helper` で構造体リテラルとして読みます。

### 3. どれでもなければ経路の式にする

```rust:line-numbers=2101
        Ok(Expr::Path(ExprPath {
            attrs: Vec::new(),
            qself,
            path,
        }))
```

上のどれにも当たらなければ、`Expr::Path` として、経路と修飾の情報をそのまま入れて返します。

## ここがすごい

- **判断を 1 トークンずつ行う**: 次の記号を 1 つずつ見て、判断を積み重ねるので、同じ入力を読み直すことがありません。
- **順序で曖昧さを解く**: `Point { … }` は構造体リテラルにも、`if` の後の波かっこ（ブロック）にもなり得ます。`allow_struct` を先に確かめることで、この曖昧さを解いています。
- **`!=` を見分ける**: `a != b` を、マクロの `!` と取り違えないように、次のトークンを別に確かめています。
- **機能によって判断の材料を変える**: `full` の有無で、`allow_struct` の扱いを変えています。同じ判断の流れを保ちながら、利用できる機能に合わせられます。

## まとめ

- 似た形の構文が複数あるときは、判断の順序を決めておくと、曖昧さを解決できます。
- 1 つ先のトークンを確かめるだけで十分な場合は、そこだけを見れば効率的です。
- 記号の組み合わせ（`!` と `!=` など）は、先に長い形を確かめると誤読を防げます。
