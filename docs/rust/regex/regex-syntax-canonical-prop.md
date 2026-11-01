---
title: Unicode のプロパティ名を正規の名前に直す
description: regex-syntax の canonical_prop。\p{...} に書かれた名前を、表にある正規の名前へ二分探索で変換する。対応する機能が無効なら、常に見つからないと返す。
language: rust
project: regex
repo: https://github.com/rust-lang/regex
license: MIT OR Apache-2.0
copyright: Copyright (c) 2014 The Rust Project Developers
commit: "94ac45b2a6e7b1c30927feb5b66c5ded5b7ad447"
file: regex-syntax/src/unicode.rs
lines: [530, 563]
function: canonical_prop
difficulty: 2
format: 2
tags: [正規表現, Unicode, 移植性]
---

## ひとことで

`canonical_prop` は、正規表現の `\p{...}`（Unicode の文字の性質を指定する書き方）で書かれた名前を、**内部で使う正規の名前** に変換する関数です。たとえば `\p{Letter}` のように書かれた名前を、表に載っている正式な名前へ対応させます。

名前が表になければ `None` を返します。また、Unicode の表を使う機能がビルドで無効になっているときは、表そのものが使えないので、常に「見つからない」というエラーを返します。

## コード

```rust:line-numbers=530
fn canonical_prop(
    normalized_name: &str,
) -> Result<Option<&'static str>, Error> {
    #[cfg(not(any(
        feature = "unicode-age",
        feature = "unicode-bool",
        feature = "unicode-gencat",
        feature = "unicode-perl",
        feature = "unicode-script",
        feature = "unicode-segment",
    )))]
    fn imp(_: &str) -> Result<Option<&'static str>, Error> {
        Err(Error::PropertyNotFound)
    }

    #[cfg(any(
        feature = "unicode-age",
        feature = "unicode-bool",
        feature = "unicode-gencat",
        feature = "unicode-perl",
        feature = "unicode-script",
        feature = "unicode-segment",
    ))]
    fn imp(name: &str) -> Result<Option<&'static str>, Error> {
        use crate::unicode_tables::property_names::PROPERTY_NAMES;

        Ok(PROPERTY_NAMES
            .binary_search_by_key(&name, |&(n, _)| n)
            .ok()
            .map(|i| PROPERTY_NAMES[i].1))
    }

    imp(normalized_name)
}
```

## 前提知識

- **Unicode のプロパティ**: 文字が「文字の種類」「文字の体系（スクリプト）」などの性質を持つことを表す情報です。正規表現では `\p{Greek}` のように指定します。
- **正規表現の feature**: `regex-syntax` は、Unicode の表の種類ごとに機能を分けています。使わない表を含めないことで、ビルドを小さくできます。
- **`binary_search_by_key`**: 並べ替えられた配列から、キーで二分探索をする関数です。見つかれば `Ok(位置)`、なければ `Err(挿入位置)` を返します。
- **`Option` と `Result`**: 見つからないことを `None`、エラーを `Err` で表します。ここでは、名前が見つからないことと、機能がないことを区別しています。
- **`#[cfg(...)]` による関数の切り替え**: 同じ名前の内側の関数を、機能の有無によって 2 種類用意しています。

## 何をしているか

### 1. 機能が無効なときの関数

```rust:line-numbers=533
    #[cfg(not(any(
        feature = "unicode-age",
        feature = "unicode-bool",
        feature = "unicode-gencat",
        feature = "unicode-perl",
        feature = "unicode-script",
        feature = "unicode-segment",
    )))]
    fn imp(_: &str) -> Result<Option<&'static str>, Error> {
        Err(Error::PropertyNotFound)
    }
```

すべての Unicode の機能が無効なら、どんな名前でも `PropertyNotFound` のエラーを返す `imp` を使います。表がないので、検索そのものを行いません。

### 2. 機能が有効なときの関数

```rust:line-numbers=545
    #[cfg(any(
        feature = "unicode-age",
        feature = "unicode-bool",
        feature = "unicode-gencat",
        feature = "unicode-perl",
        feature = "unicode-script",
        feature = "unicode-segment",
    ))]
```

Unicode の機能のどれかが有効なら、`imp` は別の定義になります。こちらは、表 `PROPERTY_NAMES` を使います。

### 3. 表を二分探索する

```rust:line-numbers=553
    fn imp(name: &str) -> Result<Option<&'static str>, Error> {
        use crate::unicode_tables::property_names::PROPERTY_NAMES;

        Ok(PROPERTY_NAMES
            .binary_search_by_key(&name, |&(n, _)| n)
            .ok()
            .map(|i| PROPERTY_NAMES[i].1))
    }
```

`PROPERTY_NAMES` は、名前で並べ替えられた組の配列です。`binary_search_by_key` で名前を探し、見つかれば対応する正規の名前（組の 2 番目）を `Some` で返します。見つからなければ `None` です。

### 4. 外側から呼ぶ

```rust:line-numbers=562
    imp(normalized_name)
```

どちらの版も、`normalized_name` を `imp` に渡すだけです。呼び出し側は、機能の有無を意識しません。

## ここがすごい

- **機能の有無を型に隠す**: 呼び出し側は同じ `canonical_prop` を呼ぶだけで、表が使えるかどうかの違いは、中の `cfg` が決めます。
- **二分探索で速く引く**: 表は並べ替えられているので、名前を何千個と比べることなく、対数の回数で見つけられます。
- **見つからない場合を分けて伝える**: 「存在しない名前」と「この機能は使えない」を、それぞれ違う結果で返すので、利用者は原因を区別できます。
- **表を使わない版も用意する**: 機能が無効な場合でも、同じ関数の形を保っているので、外側のコードを変えずにビルドできます。

## まとめ

- 並べ替えた表があるときは、二分探索で素早く名前を引けます。
- 機能の有無は `cfg` で関数ごとに分け、呼び出し側の形を変えないようにすると、保守しやすくなります。
- 失敗の理由が複数あるときは、戻り値で区別して伝えると、利用者が原因を取り違えません。
