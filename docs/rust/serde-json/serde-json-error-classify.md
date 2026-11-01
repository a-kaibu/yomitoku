---
title: 細かいエラーの種類を、4 つの大分類に振り分ける
description: serde_json の Error::classify。内部の 20 種類以上のエラーコードを、データ、構文、入力の終わり、入出力の 4 つに分類する。全部の種類を網羅する match で、分類の漏れを防ぐ。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/error.rs
lines: [54, 82]
function: Error::classify
difficulty: 2
format: 2
tags: [エラー処理, 型システム, 防御的プログラミング]
---

## ひとことで

`classify` は、serde_json が返すエラーを、利用者が扱いやすい **4 つの大分類（`Category`）** に振り分ける関数です。エラーの内部には、細かい種類（`ErrorCode`）が 20 以上あります。その中から、利用者が判断に使う大きな区分を返します。

大分類は、データの型が合わない `Data`、JSON の書き方が間違っている `Syntax`、途中で入力が終わった `Eof`、入出力の失敗 `Io` の 4 つです。

## コード

```rust:line-numbers=54
    pub fn classify(&self) -> Category {
        match self.err.code {
            ErrorCode::Message(_) => Category::Data,
            ErrorCode::Io(_) => Category::Io,
            ErrorCode::EofWhileParsingList
            | ErrorCode::EofWhileParsingObject
            | ErrorCode::EofWhileParsingString
            | ErrorCode::EofWhileParsingValue => Category::Eof,
            ErrorCode::ExpectedColon
            | ErrorCode::ExpectedListCommaOrEnd
            | ErrorCode::ExpectedObjectCommaOrEnd
            | ErrorCode::ExpectedSomeIdent
            | ErrorCode::ExpectedSomeValue
            | ErrorCode::ExpectedDoubleQuote
            | ErrorCode::InvalidEscape
            | ErrorCode::InvalidNumber
            | ErrorCode::NumberOutOfRange
            | ErrorCode::InvalidUnicodeCodePoint
            | ErrorCode::ControlCharacterWhileParsingString
            | ErrorCode::KeyMustBeAString
            | ErrorCode::ExpectedNumericKey
            | ErrorCode::FloatKeyMustBeFinite
            | ErrorCode::LoneLeadingSurrogateInHexEscape
            | ErrorCode::TrailingComma
            | ErrorCode::TrailingCharacters
            | ErrorCode::UnexpectedEndOfHexEscape
            | ErrorCode::RecursionLimitExceeded => Category::Syntax,
        }
    }
```

この関数は、`self.err.code` を `match` で調べます。すべての `ErrorCode` の値が、どこかの腕に現れるので、後から新しい種類を追加すると、コンパイルエラーになります。

## 前提知識

- **`ErrorCode`**: エラーの細かい種類を表す列挙型です。内部でだけ使われます。
- **`Category`**: 利用者に公開される大分類です。`is_data`、`is_syntax`、`is_eof`、`is_io` などの判定に使われます。
- **`match` の網羅性**: `match` は、すべての場合を書かないとコンパイルできません。新しい種類を増やすと、分類を決めるまで、コードが通りません。
- **`|` によるまとめ**: 複数のパターンを 1 つの腕にまとめます。同じ分類になる種類を、1 か所に書けます。
- **`Message` と `Io`**: 任意の文字列のエラーと、入出力のエラーは、それぞれ 1 つの分類に対応します。

## 何をしているか

### 1. 任意のメッセージと入出力は、そのまま分類する

```rust:line-numbers=55
        match self.err.code {
            ErrorCode::Message(_) => Category::Data,
            ErrorCode::Io(_) => Category::Io,
```

`Message` は、デシリアライズの処理が返した任意のエラーで、`Data` に入ります。`Io` は、読み書きの失敗なので `Io` です。

### 2. 途中で終わった入力は、Eof にする

```rust:line-numbers=58
            ErrorCode::EofWhileParsingList
            | ErrorCode::EofWhileParsingObject
            | ErrorCode::EofWhileParsingString
            | ErrorCode::EofWhileParsingValue => Category::Eof,
```

リストや、オブジェクトや、文字列や、値の途中で入力が終わったものは、`Eof` です。データが足りないことを、利用者が判断できます。

### 3. 書き方の誤りは、Syntax にまとめる

```rust:line-numbers=62
            ErrorCode::ExpectedColon
            | ErrorCode::ExpectedListCommaOrEnd
            | ErrorCode::ExpectedObjectCommaOrEnd
            | ErrorCode::ExpectedSomeIdent
            | ErrorCode::ExpectedSomeValue
            | ErrorCode::ExpectedDoubleQuote
            | ErrorCode::InvalidEscape
            | ErrorCode::InvalidNumber
            | ErrorCode::NumberOutOfRange
            | ErrorCode::InvalidUnicodeCodePoint
            | ErrorCode::ControlCharacterWhileParsingString
            | ErrorCode::KeyMustBeAString
            | ErrorCode::ExpectedNumericKey
            | ErrorCode::FloatKeyMustBeFinite
            | ErrorCode::LoneLeadingSurrogateInHexEscape
            | ErrorCode::TrailingComma
            | ErrorCode::TrailingCharacters
            | ErrorCode::UnexpectedEndOfHexEscape
            | ErrorCode::RecursionLimitExceeded => Category::Syntax,
```

コロンがない、カンマの書き方が違う、エスケープが不正、数字が不正、といった JSON の書き方の誤りは、すべて `Syntax` にまとめます。型の範囲を超えた数字（`NumberOutOfRange`）も、この中に含まれます。

## ここがすごい

- **利用者は 4 つだけ覚えればよい**: 細かい種類を知らなくても、大分類で処理を分けられます。たとえば、`Eof` なら続きのデータを待つ、といった判断です。
- **網羅性で漏れを防ぐ**: すべての種類が `match` に現れるので、新しい種類を足したときに、分類を決め忘れることがありません。
- **複数の種類を 1 つの腕に**: `|` でまとめているので、分類の対応が一覧で読めます。

## まとめ

- 細かいエラーの種類を、利用者向けの 4 つの大分類に振り分ける。
- `match` を網羅的に書くと、分類の漏れがコンパイル時に分かる。
- 同じ分類になる種類は、`|` で 1 つの腕にまとめる。
