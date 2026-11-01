---
title: デシリアライズの型パラメータに条件を付け足す
description: serde_derive の build_generics。元の型パラメータから出発し、フィールドの条件、属性による上書き、既定値の条件、Deserialize の条件を順に加えて、生成するimpl のジェネリクスを決める。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde_derive/src/de.rs
lines: [192, 228]
function: build_generics
difficulty: 2
format: 2
tags: [ジェネリクス, 型システム, メタプログラミング]
---

## ひとことで

`build_generics` は、serde の派生マクロが `Deserialize` の実装を生成するときに、**ジェネリクス（型パラメータ）の条件** を決める関数です。たとえば `struct Wrapper<T> { value: T }` を読むには、`T` が `Deserialize` を実装していなければなりません。その条件を `where` 句に加えるのが、この関数の仕事です。

条件は一度に決めるのではなく、順番に加えていきます。フィールドやバリアントから来る条件、利用者が書いた `de_bound` による上書き、既定値を使うための条件などを、段階的に重ねます。

## コード

```rust:line-numbers=192
fn build_generics(cont: &Container, borrowed: &BorrowedLifetimes) -> syn::Generics {
    let generics = bound::without_defaults(cont.generics);

    let generics = bound::with_where_predicates_from_fields(cont, &generics, attr::Field::de_bound);

    let generics =
        bound::with_where_predicates_from_variants(cont, &generics, attr::Variant::de_bound);

    match cont.attrs.de_bound() {
        Some(predicates) => bound::with_where_predicates(&generics, predicates),
        None => {
            let generics = match *cont.attrs.default() {
                attr::Default::Default => bound::with_self_bound(
                    cont,
                    &generics,
                    &parse_quote!(_serde::#private::Default),
                ),
                attr::Default::None | attr::Default::Path(_) => generics,
            };

            let delife = borrowed.de_lifetime();
            let generics = bound::with_bound(
                cont,
                &generics,
                needs_deserialize_bound,
                &parse_quote!(_serde::Deserialize<#delife>),
            );

            bound::with_bound(
                cont,
                &generics,
                requires_default,
                &parse_quote!(_serde::#private::Default),
            )
        }
    }
}
```

## 前提知識

- **ジェネリクス（型パラメータ）**: 型を `<T>` のように、後から決める型の変数として書く仕組みです。
- **`where` 句**: 型パラメータに条件（トレイトの実装など）を付けるための書き方です。`where T: Deserialize<'de>` のように書きます。
- **`Deserialize<'de>`**: データから値を読み込むための serde のトレイトです。`'de` は、読み込むデータを借りる寿命を表します。
- **`bound` モジュール**: serde_derive の中で、型パラメータに条件を付ける処理をまとめた場所です。
- **`Generics`**: `syn` の、ジェネリクスの情報（型パラメータ、ライフタイム、`where` 句）を表す型です。

## 何をしているか

### 1. 元のジェネリクスを整える

```rust:line-numbers=193
    let generics = bound::without_defaults(cont.generics);

    let generics = bound::with_where_predicates_from_fields(cont, &generics, attr::Field::de_bound);

    let generics =
        bound::with_where_predicates_from_variants(cont, &generics, attr::Variant::de_bound);
```

まず、利用者が書いた既定値（`= 型` の形）を取り除きます。次に、フィールドとバリアントの型から来る `where` 条件を加えます。これは、フィールドやバリアントに付いた `bound` の属性によって、必要な条件が変わるからです。

### 2. 利用者の指定を優先する

```rust:line-numbers=200
    match cont.attrs.de_bound() {
        Some(predicates) => bound::with_where_predicates(&generics, predicates),
        None => {
```

`de_bound` 属性で、利用者が条件を明示していれば、その条件を加えて終わります。次に述べる 2 つの自動の条件は、このとき加えません。

### 3. 既定値のための条件を加える

```rust:line-numbers=203
            let generics = match *cont.attrs.default() {
                attr::Default::Default => bound::with_self_bound(
                    cont,
                    &generics,
                    &parse_quote!(_serde::#private::Default),
                ),
                attr::Default::None | attr::Default::Path(_) => generics,
            };
```

`#[serde(default)]` が付いていれば、型パラメータに `Default` の条件を加えます。既定値を作れる必要があるからです。`None` や `Path` の場合は、何も加えません。

### 4. Deserialize と Default の条件を加える

```rust:line-numbers=212
            let delife = borrowed.de_lifetime();
            let generics = bound::with_bound(
                cont,
                &generics,
                needs_deserialize_bound,
                &parse_quote!(_serde::Deserialize<#delife>),
            );

            bound::with_bound(
                cont,
                &generics,
                requires_default,
                &parse_quote!(_serde::#private::Default),
            )
```

データの寿命を表す `'de` を取り出し、読み込みに必要な `Deserialize<'de>` の条件を、必要な型パラメータに加えます。その後、既定値が必要な型パラメータに `Default` の条件を加えて、結果を返します。

## ここがすごい

- **段階的に条件を重ねる**: 条件を 1 つの式にまとめて作るのではなく、加えていくように書いています。各段階の意味が分かれていて、後から条件を足しやすい形です。
- **利用者の指定が最優先**: `de_bound` があれば、自動の既定値と Deserialize の条件は使われません。利用者は、必要なときに生成される条件を自分で上書きできます。
- **必要な条件だけを付ける**: 既定値の条件は、`default` 属性があるときだけ付きます。不要な条件を付けないので、利用できる型の範囲が狭まりません。
- **寿命と型を同時に扱う**: `'de` の寿命を取り出して `Deserialize<'de>` に入れることで、借用を使う読み込みにも同じ仕組みで対応できます。

## まとめ

- 生成するコードの条件は、段階ごとに重ねると、それぞれの理由が分かりやすくなります。
- 利用者が明示した指定を最優先にすると、自動の判断を上書きできます。
- 条件は必要なものだけに絞ると、使える型の範囲を狭めずに済みます。
