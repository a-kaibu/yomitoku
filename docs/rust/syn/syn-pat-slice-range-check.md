---
title: スライスのパターンで、範囲の書き方を検査する
description: syn の pat_slice。角かっこの中のパターンを、カンマで区切って読む。開始か終了のない範囲は、括弧で囲まれていない限りエラーとして報告する。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/pat.rs
lines: [788, 821]
function: pat_slice
difficulty: 2
format: 2
tags: [パース, エラー処理, 型システム]
---

## ひとことで

`pat_slice` は、`syn` が Rust の **スライスのパターン** `[a, b, rest @ ..]` を読む関数です。角かっこの中に、カンマで区切ったパターンを並べたものです。

この関数には、1 つの決まりがあります。角かっこの中では、開始か終了のない範囲（`1..` や `..=5` など）を、括弧で囲まずに書くことはできません。その場合は、どこでそのパターンを書いたかを示すエラーを返します。

## コード

```rust:line-numbers=788
    fn pat_slice(input: ParseStream) -> Result<PatSlice> {
        let content;
        let bracket_token = bracketed!(content in input);

        let mut elems = Punctuated::new();
        while !content.is_empty() {
            let value = Pat::parse_multi_with_leading_vert(&content)?;
            match value {
                Pat::Range(pat) if pat.start.is_none() || pat.end.is_none() => {
                    let (start, end) = match pat.limits {
                        RangeLimits::HalfOpen(dot_dot) => (dot_dot.spans[0], dot_dot.spans[1]),
                        RangeLimits::Closed(dot_dot_eq) => {
                            (dot_dot_eq.spans[0], dot_dot_eq.spans[2])
                        }
                    };
                    let msg = "range pattern is not allowed unparenthesized inside slice pattern";
                    return Err(error::new2(start, end, msg));
                }
                _ => {}
            }
            elems.push_value(value);
            if content.is_empty() {
                break;
            }
            let punct = content.parse()?;
            elems.push_punct(punct);
        }

        Ok(PatSlice {
            attrs: Vec::new(),
            bracket_token,
            elems,
        })
    }
```

## 前提知識

- **スライスのパターン**: 配列やスライスの要素を、順番に分けて取り出すためのパターンです。`[first, .., last]` のように書きます。
- **範囲のパターン（`Pat::Range`）**: `1..=5` のように、値の範囲を表すパターンです。開始や終了を省略した形（`1..`、`..=5`）もあります。
- **`RangeLimits`**: 範囲が「半分だけ開いている（`..`）」か「両端を含む（`..=`）」かを表す型です。どちらのトークンを使ったかの情報を持ちます。
- **`Punctuated`**: 値と区切りのカンマを交互に持つ列です。
- **`error::new2`**: 開始と終了の 2 つの位置を指定して、エラーを作る補助関数です。

## 何をしているか

### 1. 角かっこを開き、要素のリストを作る

```rust:line-numbers=789
        let content;
        let bracket_token = bracketed!(content in input);

        let mut elems = Punctuated::new();
        while !content.is_empty() {
            let value = Pat::parse_multi_with_leading_vert(&content)?;
```

`bracketed!` で、角かっこの中身を取り出します。中身が空になるまで、パターンを 1 つずつ読みます。読むときは、先頭に `|` が付いていてもよい形で読みます。

### 2. 範囲で、開始か終了がないものを検査する

```rust:line-numbers=795
            match value {
                Pat::Range(pat) if pat.start.is_none() || pat.end.is_none() => {
                    let (start, end) = match pat.limits {
                        RangeLimits::HalfOpen(dot_dot) => (dot_dot.spans[0], dot_dot.spans[1]),
                        RangeLimits::Closed(dot_dot_eq) => {
                            (dot_dot_eq.spans[0], dot_dot_eq.spans[2])
                        }
                    };
                    let msg = "range pattern is not allowed unparenthesized inside slice pattern";
                    return Err(error::new2(start, end, msg));
                }
                _ => {}
            }
```

読んだパターンが、開始か終了を欠く範囲であれば、エラーを作ります。エラーの位置は、範囲の記号（`..` または `..=`）の部分です。`RangeLimits` の種類に応じて、その 2 つの位置を取り出します。

### 3. 要素とカンマをリストに積む

```rust:line-numbers=808
            elems.push_value(value);
            if content.is_empty() {
                break;
            }
            let punct = content.parse()?;
            elems.push_punct(punct);
```

問題のないパターンは、そのまま `elems` に入れます。その後にカンマがあれば、カンマも `push_punct` で積みます。カンマの後で中身が空なら、末尾のカンマとして終わります。

### 4. スライスのパターンを返す

```rust:line-numbers=816
        Ok(PatSlice {
            attrs: Vec::new(),
            bracket_token,
            elems,
        })
```

角かっこの位置と、要素のリストを `PatSlice` にまとめて返します。

## ここがすごい

- **位置を指すエラー**: 範囲の記号の位置を指定しているので、利用者は、どの `..` が問題かを正確に知ることができます。
- **早く止めて、短く伝える**: 問題を見つけた時点で `return` し、ほかの要素を読み続けません。エラーの原因が 1 つに絞られます。
- **値の形で場合分け**: `match` の `Pat::Range(pat) if …` のように、種類と条件を同時に書くので、検査が 1 か所にまとまっています。
- **範囲の両方の書き方に対応**: `..` と `..=` のどちらでも、記号の位置を正しく取り出せるように、`RangeLimits` で分けて扱っています。

## まとめ

- 文法の決まりを守らせるときは、問題の位置を指すエラーを返すと、直しやすくなります。
- 値の種類と条件は、`match` のガードで書くと、検査の場所が分かりやすくなります。
- 区切りの記号は、値のリストと分けて扱うと、末尾の扱いも単純になります。
