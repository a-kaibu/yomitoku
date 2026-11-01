---
title: 修飾された経路を、トークンとして書き戻す
description: syn の print_qpath。<T as Trait>::name のような修飾された経路を、位置の情報をもとにかっこと区切りの位置を決めながら、トークン列へ書き出す。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/path.rs
lines: [906, 942]
function: print_qpath
difficulty: 3
format: 2
tags: [型システム, 入出力, 文字列処理]
---

## ひとことで

`print_qpath` は、`syn` が解析した経路を **トークンの列に書き戻す** 関数です。対象は、`<T as Trait>::name` のような **修飾された経路（qualified path）** です。解析した木構造を、ソースコードに近い形へ戻すために使われます。

修飾された経路には、型 `T` と、トレイト側の経路の境目があります。この関数は、その境目を示す `position` を使って、`<`、`as`、`>` をどこに置くかを決めます。

## コード

```rust:line-numbers=906
    pub(crate) fn print_qpath(
        tokens: &mut TokenStream,
        qself: &Option<QSelf>,
        path: &Path,
        style: PathStyle,
    ) {
        let qself = match qself {
            Some(qself) => qself,
            None => {
                print_path(tokens, path, style);
                return;
            }
        };
        qself.lt_token.to_tokens(tokens);
        qself.ty.to_tokens(tokens);

        let pos = cmp::min(qself.position, path.segments.len());
        let mut segments = path.segments.pairs();
        if pos > 0 {
            TokensOrDefault(&qself.as_token).to_tokens(tokens);
            path.leading_colon.to_tokens(tokens);
            for (i, segment) in segments.by_ref().take(pos).enumerate() {
                print_path_segment(tokens, segment.value(), PathStyle::AsWritten);
                if i + 1 == pos {
                    qself.gt_token.to_tokens(tokens);
                }
                segment.punct().to_tokens(tokens);
            }
        } else {
            qself.gt_token.to_tokens(tokens);
            path.leading_colon.to_tokens(tokens);
        }
        for segment in segments {
            print_path_segment(tokens, segment.value(), style);
            segment.punct().to_tokens(tokens);
        }
    }
```

## 前提知識

- **修飾された経路**: `<T as Trait>::Name` のように、型と、その型が実装するトレイトを明示した経路です。`Iterator::Item` などを、曖昧さなく書くときに使います。
- **`QSelf`**: 修飾された経路の先頭部分の情報です。`T`（型）、`position`（トレイト側のセグメント数）、`as` と `>` のトークンを持ちます。
- **`TokenStream`**: トークンを順番に入れていく列です。`to_tokens` で、各要素をこの列に書き出せます。
- **`Path` と `segments`**: 経路を、`::` で区切られた部分の列として持つ構造です。`pairs()` で、部分と区切りの組を順に見られます。
- **`cmp::min`**: 2 つの値の小さい方を返す関数です。位置が経路の長さを超えないように抑えるために使います。

## 何をしているか

### 1. 修飾がなければ、そのまま経路を書く

```rust:line-numbers=912
        let qself = match qself {
            Some(qself) => qself,
            None => {
                print_path(tokens, path, style);
                return;
            }
        };
```

`qself` がなければ、通常の経路として `print_path` に任せて終わります。

### 2. `<T` の部分を書く

```rust:line-numbers=919
        qself.lt_token.to_tokens(tokens);
        qself.ty.to_tokens(tokens);

        let pos = cmp::min(qself.position, path.segments.len());
        let mut segments = path.segments.pairs();
```

まず `<` と型 `T` を書きます。`position` は、トレイト側に含まれるセグメントの数です。ただし、経路の長さを超えないように `cmp::min` で抑えます。

### 3. トレイトがある場合の書き方

```rust:line-numbers=924
        if pos > 0 {
            TokensOrDefault(&qself.as_token).to_tokens(tokens);
            path.leading_colon.to_tokens(tokens);
            for (i, segment) in segments.by_ref().take(pos).enumerate() {
                print_path_segment(tokens, segment.value(), PathStyle::AsWritten);
                if i + 1 == pos {
                    qself.gt_token.to_tokens(tokens);
                }
                segment.punct().to_tokens(tokens);
            }
        } else {
            qself.gt_token.to_tokens(tokens);
            path.leading_colon.to_tokens(tokens);
        }
```

`position` が 1 以上なら、`as` を書き、先頭の `::` を書いて、トレイト側の各セグメントを書きます。最後のセグメントの後に `>` を置きます。`position` が 0 なら、トレイトがないので、`>` を先に書きます。

### 4. 残りの部分を書く

```rust:line-numbers=938
        for segment in segments {
            print_path_segment(tokens, segment.value(), style);
            segment.punct().to_tokens(tokens);
        }
```

`>` の後ろのセグメントは、`::` で区切りながら順に書きます。ここで、`<T as Trait>::Name` の `::Name` の部分が出力されます。

## ここがすごい

- **位置の情報だけで書き分ける**: 経路の形を文字列で判定するのではなく、`position` の数だけを見ます。ソースの書き方に左右されずに、正しい形を出力できます。
- **`TokensOrDefault` による安全な出力**: `as` が元のソースになくても、既定のトークンを補って書けます。解析された木から、必ず有効なトークン列を作れます。
- **書き戻しの一貫性**: 解析の仕組みと、この出力の仕組みが同じ `position` の意味を共有しているので、読んだ内容をそのまま書き戻せます。
- **セグメントを 1 回だけ回す**: `by_ref().take(pos)` で、前半と後半を同じイテレータから続けて取り出しています。二重に走査しないので、効率的です。

## まとめ

- 木構造を文字列に戻すときは、位置の情報を持っておくと、書き方の分岐が単純になります。
- 区切りの記号は、値と分けて扱うと、抜けや余分な記号を防げます。
- 解析と出力で同じ意味の値を共有すると、読んだ内容を正しく書き戻せます。
