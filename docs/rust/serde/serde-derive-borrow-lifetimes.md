---
title: borrow 属性の寿命名を読み、重複を報告する
description: serde_derive の parse_lit_into_lifetimes。#[serde(borrow = "...")] の文字列を寿命名の集合として読み、重複や空の指定を、エラーとして記録しながら進める。
language: rust
project: Serde
repo: https://github.com/serde-rs/serde
license: MIT OR Apache-2.0
copyright: Copyright (c) Erick Tryzelaar, David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "0db9b3b504bcb0a7fa9cf001429869519afd3e9a"
file: serde_derive/src/internals/attr.rs
lines: [1541, 1577]
function: parse_lit_into_lifetimes
difficulty: 2
format: 2
tags: [パース, エラー処理, 文字列処理]
---

## ひとことで

`parse_lit_into_lifetimes` は、serde の属性 `#[serde(borrow = "'a + 'b")]` の文字列を読み、**借用する寿命（ライフタイム）の名前の集合** を作る関数です。`borrow` は、データを読むときにコピーせず、元の文字列を借りて使うことを表します。

読み取りに失敗しても、関数はすぐに止まりません。重複や空の指定をエラーとして記録し、読めた内容をできるだけ返します。利用者が一度に複数の問題を知れるようにするための作りです。

## コード

```rust:line-numbers=1541
fn parse_lit_into_lifetimes(
    cx: &Ctxt,
    meta: &ParseNestedMeta,
) -> syn::Result<BTreeSet<syn::Lifetime>> {
    let Some(string) = get_lit_str(cx, BORROW, meta)? else {
        return Ok(BTreeSet::new());
    };

    if let Ok(lifetimes) = string.parse_with(|input: ParseStream| {
        let mut set = BTreeSet::new();
        while !input.is_empty() {
            let lifetime: Lifetime = input.parse()?;
            if !set.insert(lifetime.clone()) {
                cx.error_spanned_by(
                    &string,
                    format!("duplicate borrowed lifetime `{}`", lifetime),
                );
            }
            if input.is_empty() {
                break;
            }
            input.parse::<Token![+]>()?;
        }
        Ok(set)
    }) {
        if lifetimes.is_empty() {
            cx.error_spanned_by(string, "at least one lifetime must be borrowed");
        }
        return Ok(lifetimes);
    }

    cx.error_spanned_by(
        &string,
        format!("failed to parse borrowed lifetimes: {:?}", string.value()),
    );
    Ok(BTreeSet::new())
}
```

## 前提知識

- **ライフタイム（寿命）**: 参照がどの期間有効かを表す名前です。`'a` のように書きます。
- **`#[serde(borrow)]`**: serde の属性の 1 つです。デシリアライズのときに、データを所有せず、元の入力を借りて値を作るよう指定します。
- **`BTreeSet`**: 重複しない要素を、順番を保って並べる集合です。同じ寿命名が 2 回来ても、1 つだけ残ります。
- **`let ... else`**: パターンに合わなければ、`else` の中で関数を抜ける書き方です。`Some` でなければ、早く空の集合を返します。
- **`cx.error_spanned_by`**: エラーを記録する関数です。記録しても、呼び出した関数はそこで止まりません。

## 何をしているか

### 1. 文字列がなければ、空の集合を返す

```rust:line-numbers=1545
    let Some(string) = get_lit_str(cx, BORROW, meta)? else {
        return Ok(BTreeSet::new());
    };
```

`borrow` の値として文字列リテラルが与えられていなければ、空の集合を返します。ここでは、エラーは記録されません。

### 2. 文字列を寿命名の列として読む

```rust:line-numbers=1549
    if let Ok(lifetimes) = string.parse_with(|input: ParseStream| {
        let mut set = BTreeSet::new();
        while !input.is_empty() {
            let lifetime: Lifetime = input.parse()?;
            if !set.insert(lifetime.clone()) {
                cx.error_spanned_by(
                    &string,
                    format!("duplicate borrowed lifetime `{}`", lifetime),
                );
            }
            if input.is_empty() {
                break;
            }
            input.parse::<Token![+]>()?;
        }
        Ok(set)
    }) {
```

文字列を `parse_with` で解析し、寿命名を 1 つ読んでは `+` で区切りながら、集合に入れます。同じ寿命名が 2 回目に来た場合は、重複のエラーを記録しますが、読み続けます。`input.is_empty()` になったら、読み終わりです。

### 3. 読めたのに空だったとき

```rust:line-numbers=1566
        if lifetimes.is_empty() {
            cx.error_spanned_by(string, "at least one lifetime must be borrowed");
        }
        return Ok(lifetimes);
```

解析は成功したのに、寿命名が 1 つもなければ、「少なくとも 1 つの寿命を借りる必要がある」というエラーを記録します。それでも、読めた集合をそのまま返します。

### 4. 解析に失敗したとき

```rust:line-numbers=1572
    cx.error_spanned_by(
        &string,
        format!("failed to parse borrowed lifetimes: {:?}", string.value()),
    );
    Ok(BTreeSet::new())
```

解析そのものが失敗したら、元の文字列を示して「寿命の並びとして読めない」というエラーを記録します。返す値は空の集合です。

## ここがすごい

- **止まらずに報告する**: 重複を見つけても読み続けるので、利用者は 1 回のビルドで複数の問題をまとめて知れます。
- **集合で重複を判定する**: `insert` の戻り値が `false` なら、すでに同じ寿命名があったと分かります。重複の数を数える仕組みは不要です。
- **エラーの位置を正確に指す**: `error_spanned_by` に文字列の位置を渡すので、属性のどこが問題かを、エラー表示で示せます。
- **`let ... else` で流れを平らにする**: 文字列がない場合の早い戻りを 1 行で書けるので、本体の読み取りが深くネストしません。

## まとめ

- 属性の値を解析するときは、問題を記録しつつ読み続けると、一度に多くの問題を伝えられます。
- 重複の判定は、集合の `insert` の結果で行うと簡潔に書けます。
- 早い戻りには `let ... else` を使うと、読みやすい形になります。
