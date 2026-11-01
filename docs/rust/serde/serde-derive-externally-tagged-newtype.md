---
title: 値を 1 つ持つバリアントの読み込みコードを作る
description: serde_derive の外部タグ付き newtype バリアント。スキップ指定ならデフォルト値で作り、deserialize_with があればラッパーを通し、なければ型をそのまま読んで、バリアントの値に包む。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde_derive/src/de/enum_externally.rs
lines: [177, 213]
function: deserialize_externally_tagged_newtype_variant
difficulty: 3
format: 2
tags: [メタプログラミング, マクロ, 型システム]
---

## ひとことで

`deserialize_externally_tagged_newtype_variant` は、serde の派生マクロが、**値を 1 つだけ持つ列挙型のバリアント**（例: `Message::Text(String)`）を読み込むコードを組み立てる関数です。読み込み時には、バリアント名の後に続く値を 1 つ読み、それをバリアントの形に包みます。

この関数は、フィールドの属性によって、組み立てるコードを 3 通りに分けます。読み込まないでデフォルト値を使う場合、`deserialize_with` で読み方を指定した場合、そして通常の場合です。

## コード

```rust:line-numbers=177
fn deserialize_externally_tagged_newtype_variant(
    variant_ident: &syn::Ident,
    params: &Parameters,
    field: &Field,
    cattrs: &attr::Container,
) -> Fragment {
    let this_value = &params.this_value;

    if field.attrs.skip_deserializing() {
        let default = Expr(expr_is_missing(field, cattrs));
        return quote_block! {
            _serde::de::VariantAccess::unit_variant(__variant)?;
            _serde::#private::Ok(#this_value::#variant_ident(#default))
        };
    }

    match field.attrs.deserialize_with() {
        None => {
            let field_ty = field.ty;
            let span = field.original.span();
            let func =
                quote_spanned!(span=> _serde::de::VariantAccess::newtype_variant::<#field_ty>);
            quote_expr! {
                _serde::#private::Result::map(#func(__variant), #this_value::#variant_ident)
            }
        }
        Some(path) => {
            let (wrapper, wrapper_ty) = wrap_deserialize_field_with(params, field.ty, path);
            quote_block! {
                #wrapper
                _serde::#private::Result::map(
                    _serde::de::VariantAccess::newtype_variant::<#wrapper_ty>(__variant),
                    |__wrapper| #this_value::#variant_ident(__wrapper.value))
            }
        }
    }
}
```

## 前提知識

- **newtype バリアント**: 値を 1 つだけ持つ列挙型のバリアントです。`Text(String)` のような形です。
- **外部タグ付きの表現**: バリアントの名前を、データの中でキーとして書く表し方です。読み込み時には、まず名前を読み、次に中の値を読みます。
- **`VariantAccess`**: serde で、バリアントの中身を読むための仲介役です。`newtype_variant` は、値を 1 つ読みます。
- **`deserialize_with`**: serde の属性の 1 つです。フィールドを読むときに、指定した関数を使うことを表します。
- **`quote_block!` と `quote_expr!`**: 生成するコードをブロック（文の並び）と式として組み立てるマクロです。`#` で、変数の値を埋め込めます。

## 何をしているか

### 1. 読み込まないフィールドは、既定値で作る

```rust:line-numbers=185
    if field.attrs.skip_deserializing() {
        let default = Expr(expr_is_missing(field, cattrs));
        return quote_block! {
            _serde::de::VariantAccess::unit_variant(__variant)?;
            _serde::#private::Ok(#this_value::#variant_ident(#default))
        };
    }
```

`skip_deserializing` が付いたフィールドは、データから読みません。代わりに、バリアントの名前を読んだ後で値を読まずに終わらせ（`unit_variant`）、既定値（`expr_is_missing`）でバリアントを作ります。

### 2. 通常のフィールドは、型を指定して読む

```rust:line-numbers=193
    match field.attrs.deserialize_with() {
        None => {
            let field_ty = field.ty;
            let span = field.original.span();
            let func =
                quote_spanned!(span=> _serde::de::VariantAccess::newtype_variant::<#field_ty>);
            quote_expr! {
                _serde::#private::Result::map(#func(__variant), #this_value::#variant_ident)
            }
        }
```

`deserialize_with` がなければ、フィールドの型を指定して `newtype_variant` を呼びます。結果は `Result::map` で、バリアントの名前（`this_value::Variant`）を関数として包みます。

### 3. deserialize_with があるときは、ラッパーを通す

```rust:line-numbers=203
        Some(path) => {
            let (wrapper, wrapper_ty) = wrap_deserialize_field_with(params, field.ty, path);
            quote_block! {
                #wrapper
                _serde::#private::Result::map(
                    _serde::de::VariantAccess::newtype_variant::<#wrapper_ty>(__variant),
                    |__wrapper| #this_value::#variant_ident(__wrapper.value))
            }
        }
```

`deserialize_with` があれば、その関数を通すためのラッパーの型を作ります。読んだ値をラッパーから取り出し、バリアントに包みます。ラッパーの型は、`wrap_deserialize_field_with` が作ります。

## ここがすごい

- **属性の組み合わせを分岐で表す**: 「スキップ」と「読み方の指定」という 2 つの属性の組み合わせを、`if` と `match` で網羅しています。どの場合も、必ず 1 つのコードになります。
- **生成コードの型を明示する**: `newtype_variant::<#field_ty>` のように、型をコードに直接書くので、読み込む型が生成されるコードの中で決まります。
- **包む操作を関数で書く**: バリアントの名前を関数として `Result::map` に渡すので、値の取り出しと包みを 1 つの式で表せます。
- **生成されるコードの場所を揃える**: `quote_spanned!` により、エラーの位置が元のフィールドの位置を指すように揃えています。

## まとめ

- 属性の組み合わせによって生成する処理が変わるときは、場合分けを明示すると、抜けが分かりやすくなります。
- 値を包む処理は、関数を `map` に渡して書くと、一行で表せます。
- 生成するコードのエラー位置を元の定義に合わせると、利用者が問題を見つけやすくなります。
