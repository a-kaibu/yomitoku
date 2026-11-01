---
title: enum のバリアントを読み、untagged の位置を検査する
description: serde_derive の enum_from_ast。各バリアントを中間表現に変え、#[serde(untagged)] の付いたバリアントが末尾にないものを、コンパイル時のエラーとして報告する。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde_derive/src/internals/ast.rs
lines: [133, 172]
function: enum_from_ast
difficulty: 2
format: 2
tags: [防御的プログラミング, エラー処理, 型システム]
---

## ひとことで

`enum_from_ast` は、serde の派生マクロ（`#[derive(Serialize, Deserialize)]`）が、`enum` の定義を読むときに使う関数です。`enum` の各バリアントを、マクロ内部で扱いやすい形（`Variant`）に変換します。

さらに、`#[serde(untagged)]` という属性を検査します。この属性が付いたバリアントは、ほかのバリアントより後ろに置かなければなりません。違反があれば、コードを書いた人に、コンパイル時のエラーとして知らせます。

## コード

```rust:line-numbers=133
fn enum_from_ast<'a>(
    cx: &Ctxt,
    variants: &'a Punctuated<syn::Variant, Token![,]>,
    container_default: &attr::Default,
    private: &Ident,
) -> Vec<Variant<'a>> {
    let variants: Vec<Variant> = variants
        .iter()
        .map(|variant| {
            let attrs = attr::Variant::from_ast(cx, variant);
            let (style, fields) = struct_from_ast(
                cx,
                &variant.fields,
                Some(&attrs),
                container_default,
                private,
            );
            Variant {
                ident: variant.ident.clone(),
                attrs,
                style,
                fields,
                original: variant,
            }
        })
        .collect();

    let index_of_last_tagged_variant = variants
        .iter()
        .rposition(|variant| !variant.attrs.untagged());
    if let Some(index_of_last_tagged_variant) = index_of_last_tagged_variant {
        for variant in &variants[..index_of_last_tagged_variant] {
            if variant.attrs.untagged() {
                cx.error_spanned_by(&variant.ident, "all variants with the #[serde(untagged)] attribute must be placed at the end of the enum");
            }
        }
    }

    variants
}
```

## 前提知識

- **派生マクロ（derive）**: `#[derive(...)]` と書くと、コンパイラが型の定義から、トレイトの実装を自動で生成する仕組みです。serde はこの仕組みで、データの読み書きの処理を作ります。
- **`untagged`**: serde の属性の 1 つで、列挙型の区別用のタグを付けずに、値の形だけで型を判断することを表します。
- **`Punctuated`**: `syn` の、区切り記号（ここではカンマ）付きのリストです。`enum` のバリアントの並びを表すために使われます。
- **`rposition`**: 条件を満たす要素の、最後の位置を探すイテレータの操作です。
- **`Ctxt`（コンテキスト）**: エラーを集めておく場所です。`error_spanned_by` でエラーを記録すると、マクロ全体の処理の最後にまとめて報告されます。

## 何をしているか

### 1. 各バリアントを中間表現に変える

```rust:line-numbers=139
    let variants: Vec<Variant> = variants
        .iter()
        .map(|variant| {
            let attrs = attr::Variant::from_ast(cx, variant);
            let (style, fields) = struct_from_ast(
                cx,
                &variant.fields,
                Some(&attrs),
                container_default,
                private,
            );
            Variant {
                ident: variant.ident.clone(),
                attrs,
                style,
                fields,
                original: variant,
            }
        })
        .collect();
```

`variants` の各要素について、属性（`attr::Variant::from_ast`）を読み、フィールドの形を `struct_from_ast` で求めます。その結果を、名前、属性、形、フィールド、元の定義と一緒に `Variant` にまとめます。`collect` で、全部のバリアントの `Vec` を作ります。

### 2. 最後にタグ付きのバリアントを探す

```rust:line-numbers=160
    let index_of_last_tagged_variant = variants
        .iter()
        .rposition(|variant| !variant.attrs.untagged());
```

`rposition` で、`untagged` でないバリアントのうち、最後のものの位置を探します。タグ付きのバリアントが 1 つもなければ、この値は `None` になります。

### 3. その前にある untagged を報告する

```rust:line-numbers=163
    if let Some(index_of_last_tagged_variant) = index_of_last_tagged_variant {
        for variant in &variants[..index_of_last_tagged_variant] {
            if variant.attrs.untagged() {
                cx.error_spanned_by(&variant.ident, "all variants with the #[serde(untagged)] attribute must be placed at the end of the enum");
            }
        }
    }
```

最後のタグ付きバリアントより前の部分を見て、`untagged` の付いたものがあれば、エラーを記録します。エラーは、そのバリアントの名前の位置に付けられます。

### 4. バリアントの一覧を返す

```rust:line-numbers=171
    variants
```

検査が終わったら、変換済みのバリアントの一覧をそのまま返します。エラーがあっても、マクロの処理は続き、最後にまとめてエラーが報告されます。

## ここがすごい

- **中間表現で後の処理を単純にする**: 元の `syn` の木構造ではなく、名前や属性を整理した `Variant` にしてから検査します。以降の処理は、この整理された形だけを見ればよくなります。
- **順序の規則を位置で判定する**: 「`untagged` は末尾に」という規則を、`rposition` 1 回の探索と、前半の確認だけで表しています。
- **エラーを記録して進む**: 違反があっても、すぐに処理を止めずに、エラーを `Ctxt` に記録します。利用者は一度のビルドで複数の問題を見られます。
- **エラーの位置を正確に示す**: `error_spanned_by` に、バリアントの名前を渡すので、エラーの表示が問題の場所を指します。

## まとめ

- 規則が順序に関わるときは、「最後の印」を探してから、その前を確かめる形が簡潔です。
- マクロの内部でも、エラーを記録して処理を続けると、利用者にとって親切です。
- 元の木構造を、目的に合った形に変えてから検査すると、後の処理が読みやすくなります。
