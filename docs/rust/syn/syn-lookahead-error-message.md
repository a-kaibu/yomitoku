---
title: 試したトークンの候補からエラーの文を作る
description: syn の Lookahead1::error。パーサが試した候補を並べ、候補の数に応じて「想定外の文字」「1 つだけ期待」などの文を組み立てる。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/lookahead.rs
lines: [115, 149]
function: error
difficulty: 2
format: 2
tags: [エラー処理, パース, 文字列処理]
---

## ひとことで

`Lookahead1::error` は、構文解析（パース）が失敗したときに、利用者へ見せるエラーを作る関数です。`syn` では、「次に来てもよいトークン」を先読みで試し、どれも合わなかったときに、その候補の一覧をここで文章にまとめます。

候補が 0 個なら「想定外のトークン」、1 個なら「〜 が必要です」、2 個なら「〜 か 〜」、それ以上なら「次のいずれか」というように、候補の数で文の形を変えます。利用者が「何を書けばよかったのか」を読み取りやすくするための関数です。

## コード

```rust:line-numbers=115
    pub fn error(self) -> Error {
        let mut comparisons = self.comparisons.into_inner();
        comparisons.retain_mut(|display| {
            if *display == "`)`" {
                *display = match self.cursor.scope_delimiter() {
                    Delimiter::Parenthesis => "`)`",
                    Delimiter::Brace => "`}`",
                    Delimiter::Bracket => "`]`",
                    Delimiter::None => return false,
                }
            }
            true
        });
        match comparisons.len() {
            0 => {
                if self.cursor.eof() {
                    Error::new(self.scope, "unexpected end of input")
                } else {
                    Error::new(self.cursor.span(), "unexpected token")
                }
            }
            1 => {
                let message = format!("expected {}", comparisons[0]);
                error::new_at(self.scope, self.cursor, message)
            }
            2 => {
                let message = format!("expected {} or {}", comparisons[0], comparisons[1]);
                error::new_at(self.scope, self.cursor, message)
            }
            _ => {
                let message = format!("expected one of: {}", CommaSeparated(&comparisons));
                error::new_at(self.scope, self.cursor, message)
            }
        }
    }
```

## 前提知識

- **先読み（lookahead）**: 次に来るトークンが何かを確かめてから、どの構文を読むかを決める仕組みです。確かめるだけで、入力は進めません。
- **`RefCell<Vec<&'static str>>`**: 試したトークンの説明文を溜めるリストです。`RefCell` は、借用のルールを実行時に確かめながら、中身を書き換えられるようにする型です。
- **`retain_mut`**: リストの要素を順に見て、条件を満たすものだけを残す操作です。要素を書き換えながら、不要なものを取り除けます。
- **`Delimiter`**: 括弧の種類（丸、波、角）を表す型です。`Delimiter::None` は、目に見える括弧がない場合を表します。
- **`match` の要素数による分岐**: 配列やリストの長さで処理を分けると、文の形を正確に決められます。

## 何をしているか

### 1. 閉じ括弧の表示を、囲んでいる括弧に合わせる

```rust:line-numbers=116
        let mut comparisons = self.comparisons.into_inner();
        comparisons.retain_mut(|display| {
            if *display == "`)`" {
                *display = match self.cursor.scope_delimiter() {
                    Delimiter::Parenthesis => "`)`",
                    Delimiter::Brace => "`}`",
                    Delimiter::Bracket => "`]`",
                    Delimiter::None => return false,
                }
            }
            true
        });
```

試したトークンの中に `)` という表示があれば、今いる囲みの種類に合わせて表示を書き換えます。丸かっこの中なら `)`、波かっこの中なら `}` です。囲みの種類がない場合は、その候補を一覧から外します。`retain_mut` は、`return false` で要素を外せるので、ここではその仕組みを使っています。

### 2. 候補が 0 個のとき

```rust:line-numbers=128
        match comparisons.len() {
            0 => {
                if self.cursor.eof() {
                    Error::new(self.scope, "unexpected end of input")
                } else {
                    Error::new(self.cursor.span(), "unexpected token")
                }
            }
```

どの候補も試されていなかったときは、入力の終わりなら「想定外の入力の終わり」、そうでなければ「想定外のトークン」を、そのトークンの位置に付けて返します。

### 3. 候補が 1 個か 2 個のとき

```rust:line-numbers=136
            1 => {
                let message = format!("expected {}", comparisons[0]);
                error::new_at(self.scope, self.cursor, message)
            }
            2 => {
                let message = format!("expected {} or {}", comparisons[0], comparisons[1]);
                error::new_at(self.scope, self.cursor, message)
            }
```

候補が 1 個なら「〜 が必要です」、2 個なら「〜 または 〜」と並べます。どちらも、今いる位置（`self.cursor`）をエラーの場所として使います。

### 4. 候補が 3 個以上のとき

```rust:line-numbers=144
            _ => {
                let message = format!("expected one of: {}", CommaSeparated(&comparisons));
                error::new_at(self.scope, self.cursor, message)
            }
        }
```

候補が多い場合は、`CommaSeparated` で「次のいずれか: 〜, 〜, 〜」のように並べます。`CommaSeparated` は、要素をカンマで区切る表示のための型です。

## ここがすごい

- **候補の数で文を変える**: 「1 つだけ」「2 つ」「それ以上」の 3 通りの文を用意して、利用者が読みやすい文章になるようにしています。
- **見えない括弧にも気を配る**: 閉じ括弧の表示を囲みに合わせて変えることで、「`)` が必要」と言われたのに実際は `}` の中だった、という混乱を防いでいます。
- **場所と内容を分けて扱う**: 文章を作るのは `comparisons` の内容、位置を決めるのは `cursor` と `scope`、という分担になっています。
- **元の状態を変えない**: 先読みの結果は、エラーを作るときに一度だけ使われます。そのため、パーサの入力位置は、この関数によって進みません。

## まとめ

- エラーメッセージは、集めた情報の数に応じて文の形を変えると、読みやすくなります。
- 表示の細かな違い（括弧の種類など）も、囲みの情報を使えば正確に合わせられます。
- 集めた候補を一覧にしておけば、後からまとめてエラーを作れます。
