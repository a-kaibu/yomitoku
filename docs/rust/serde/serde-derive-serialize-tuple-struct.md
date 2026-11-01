---
title: タプル構造体の書き出しコードを組み立てる
description: serde_derive の serialize_tuple_struct。フィールドの数を、skip_serializing_if の条件付きの式として足し合わせ、書き出しのコードをトークンとして組み立てる。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde_derive/src/ser.rs
lines: [257, 294]
function: serialize_tuple_struct
difficulty: 3
format: 2
tags: [メタプログラミング, マクロ, 入出力]
---

## ひとことで

`serialize_tuple_struct` は、serde の派生マクロが、**タプル構造体（`struct P(i32, i32);`）の書き出し処理を、Rust のコードとして組み立てる** 関数です。関数は実行時にデータを書き出すのではなく、生成されるコードの断片（`Fragment`）を作ります。

生成されるコードの中で、書き出すフィールドの数（`len`）を求める式を組み立てるのが、この関数の大事な仕事です。`skip_serializing_if` という属性が付いたフィールドは、条件によって数えないようにします。

## コード

```rust:line-numbers=257
fn serialize_tuple_struct(
    params: &Parameters,
    fields: &[Field],
    cattrs: &attr::Container,
) -> Fragment {
    let serialize_stmts =
        serialize_tuple_struct_visitor(fields, params, false, &TupleTrait::SerializeTupleStruct);

    let type_name = cattrs.name().serialize_name();

    let mut serialized_fields = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| !field.attrs.skip_serializing())
        .peekable();

    let let_mut = mut_if(serialized_fields.peek().is_some());

    let len = serialized_fields
        .map(|(i, field)| match field.attrs.skip_serializing_if() {
            None => quote!(1),
            Some(path) => {
                let index = syn::Index {
                    index: i as u32,
                    span: Span::call_site(),
                };
                let field_expr = get_member(params, field, &Member::Unnamed(index));
                quote!(if #path(#field_expr) { 0 } else { 1 })
            }
        })
        .fold(quote!(0), |sum, expr| quote!(#sum + #expr));

    quote_block! {
        let #let_mut __serde_state = _serde::Serializer::serialize_tuple_struct(__serializer, #type_name, #len)?;
        #(#serialize_stmts)*
        _serde::ser::SerializeTupleStruct::end(__serde_state)
    }
}
```

## 前提知識

- **派生マクロ（procedural macro）**: `#[derive(Serialize)]` などの処理を、Rust のコードを読んで新しいコードを出力するプログラムとして書いたものです。serde_derive がこの仕組みを使います。
- **`quote!` マクロ**: Rust のコードの形をしたテンプレートに、変数の値を埋め込み、トークンの列を作るマクロです。`#var` の形で値を埋め込みます。
- **`Fragment`**: 生成する処理の一部を表す型です。関数の本体にそのまま組み込めるコードの断片です。
- **`skip_serializing_if`**: serde の属性の 1 つです。指定した関数が `true` を返したフィールドは、書き出さないことを表します。
- **`fold`**: 初期値から始めて、要素を 1 つずつ足し合わせる操作です。ここでは、式の足し算を作るために使われます。

## 何をしているか

### 1. 書き出しの本体と、名前と可変性を用意する

```rust:line-numbers=262
    let serialize_stmts =
        serialize_tuple_struct_visitor(fields, params, false, &TupleTrait::SerializeTupleStruct);

    let type_name = cattrs.name().serialize_name();
```

`serialize_tuple_struct_visitor` で、各フィールドを書き出す文の列を作ります。次に、構造体の名前を、serde が使う名前に変えます。

```rust:line-numbers=267
    let mut serialized_fields = fields
        .iter()
        .enumerate()
        .filter(|(_, field)| !field.attrs.skip_serializing())
        .peekable();

    let let_mut = mut_if(serialized_fields.peek().is_some());
```

書き出すフィールドだけを残すために、`skip_serializing` を満たすものを除きます。残りが 1 つでもあれば、変数 `__serde_state` に `mut` を付ける必要があるので、その判定もします。

### 2. フィールド数を式として組み立てる

```rust:line-numbers=275
    let len = serialized_fields
        .map(|(i, field)| match field.attrs.skip_serializing_if() {
            None => quote!(1),
            Some(path) => {
                let index = syn::Index {
                    index: i as u32,
                    span: Span::call_site(),
                };
                let field_expr = get_member(params, field, &Member::Unnamed(index));
                quote!(if #path(#field_expr) { 0 } else { 1 })
            }
        })
        .fold(quote!(0), |sum, expr| quote!(#sum + #expr));
```

条件のないフィールドは `1` として数えます。条件のあるフィールドは、`if 条件(フィールド) { 0 } else { 1 }` という式を作ります。最後に、`fold` で `0 + 式 + 式 …` という 1 つの式にまとめます。この式は、実行時に条件を判定して、数を決めます。

### 3. 生成するコードのブロックを作る

```rust:line-numbers=289
    quote_block! {
        let #let_mut __serde_state = _serde::Serializer::serialize_tuple_struct(__serializer, #type_name, #len)?;
        #(#serialize_stmts)*
        _serde::ser::SerializeTupleStruct::end(__serde_state)
    }
```

`quote_block!` で、`serialize_tuple_struct` を呼び出す文、フィールドの書き出し文、`end` を呼ぶ文を並べたブロックを作ります。`#len` の部分に、先ほどの式が入ります。

## ここがすごい

- **コードを生成する**: 書き出しを行うコードそのものを、マクロの中で組み立てています。利用者は、同じ書き方を型ごとに手で書く必要がありません。
- **実行時の判定を式にする**: 数を決める条件を、コードの式として埋め込むので、フィールドの値によって `len` が変わっても正しく動きます。
- **`fold` で式を連結する**: 条件のあるフィールドとないフィールドが混ざっても、同じ方法で 1 つの式にできます。
- **`mut` の付与を条件で決める**: 書き出すフィールドがなければ `mut` を付けない、という細かい配慮があります。生成されたコードの警告を減らせます。

## まとめ

- 型の定義からコードを生成するときは、実行されるコードそのものを組み立てると、型ごとの手書きが不要になります。
- 実行時に決まる値（フィールド数など）は、生成するコードの式として表すと、柔軟に扱えます。
- 式の連結は `fold` のような畳み込みで書くと、要素数が変わっても同じ書き方で済みます。
