---
title: 数値の表し方を機能で切り替える
description: serde_json の Number を作る from。arbitrary_precision 機能の有無で、数値を f64 などの値で持つか文字列で持つかを cfg により切り替える。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/number.rs
lines: [707, 743]
function: from
difficulty: 2
format: 2
tags: [型システム, 移植性, 設計パターン]
---

## ひとことで

`serde_json::Number` は、JSON の数値を表す型です。この `from` は、JSON パーサが読み取った内部の数値 `ParserNumber` を、外に見せる `Number` に変換します。

ふつうのビルドでは、数値は `f64`・`u64`・`i64` のどれかとして保存されます。しかし `arbitrary_precision` という機能を有効にすると、数値を **文字列の形のまま** 保存するように切り替わります。この関数は、その切り替えを `#[cfg]` で書き分けています。呼び出す側は同じ `from` を使うだけで、内部の表し方の違いを意識しなくてすみます。

## コード

```rust:line-numbers=707
    fn from(value: ParserNumber) -> Self {
        let n = match value {
            ParserNumber::F64(f) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::Float(f)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    zmij::Buffer::new().format_finite(f).to_owned()
                }
            }
            ParserNumber::U64(u) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::PosInt(u)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    itoa::Buffer::new().format(u).to_owned()
                }
            }
            ParserNumber::I64(i) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::NegInt(i)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    itoa::Buffer::new().format(i).to_owned()
                }
            }
            #[cfg(feature = "arbitrary_precision")]
            ParserNumber::String(s) => s,
        };
        Number { n }
    }
```

## 前提知識

- **`enum`（列挙型）**: 「いくつかの形のうち、どれか 1 つ」を表す型です。`ParserNumber::F64(f)` のように、形の中に値を持たせることもできます。
- **`match`**: 列挙型の形ごとに処理を振り分ける文です。すべての形を書かないとコンパイルできるので、書き漏れがあればすぐにわかります。
- **`#[cfg(...)]`**: 条件付きコンパイルの属性です。指定した機能（feature）が有効なときだけ、その下のコードをビルドに含めます。
- **`N` 型**: この crate の内部で数値を表す列挙型です。`Float`、`PosInt`、`NegInt` の 3 つの形を持ちます。
- **`to_owned()`**: 借りている文字列から、自分で持つ `String` を作ります。

## 何をしているか

### 1. 浮動小数点数を変換する

```rust:line-numbers=708
        let n = match value {
            ParserNumber::F64(f) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::Float(f)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    zmij::Buffer::new().format_finite(f).to_owned()
                }
            }
```

`F64` の場合、通常のビルドでは `N::Float(f)` に包むだけです。`arbitrary_precision` が有効なときは、`zmij` という浮動小数点数の整形用 crate で、有限の値を文字列にします。ここで使う `format_finite` は、無限大や NaN を含まない有限の値を前提とする関数です。

### 2. 整数を変換する

```rust:line-numbers=719
            ParserNumber::U64(u) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::PosInt(u)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    itoa::Buffer::new().format(u).to_owned()
                }
            }
            ParserNumber::I64(i) => {
                #[cfg(not(feature = "arbitrary_precision"))]
                {
                    N::NegInt(i)
                }
                #[cfg(feature = "arbitrary_precision")]
                {
                    itoa::Buffer::new().format(i).to_owned()
                }
            }
```

整数は、通常は `PosInt`（0 以上）と `NegInt`（負）に分けて保存します。機能が有効なときは、`itoa` で桁の文字列にします。`itoa` は整数を速く文字列にする crate です。どちらのビルドでも、元の値の情報は失われません。

### 3. 文字列の形を受け取る

```rust:line-numbers=739
            #[cfg(feature = "arbitrary_precision")]
            ParserNumber::String(s) => s,
        };
        Number { n }
```

文字列の形は `arbitrary_precision` のときだけ存在します。機能が無効なら、この腕はビルドに含まれません。すでに文字列なので、そのまま `Number { n }` に入れて返します。`Number { n }` は、フィールド名と変数名が同じなので `n` と書くだけで済む省略記法です。

## ここがすごい

- **同じ入り口で保存方式を切り替える**: 利用者は `Number::from` を呼ぶだけで、中の保存方式が変わっても書き換える必要がありません。
- **精度を失わない選択肢**: `f64` に変換すると、大きな整数や長い小数の桁が失われることがあります。文字列のまま保存すると、読み込んだ桁をそのまま出力できます。
- **コンパイル時に切り替える**: `cfg` はビルド時に働くので、使わない機能のコードは実行時の分岐にもならず、バイナリにも残りません。
- **列挙型の網羅性チェック**: `match` の腕がすべての形を覆っているので、新しい形を `ParserNumber` に加えたときに、この関数の書き漏れがコンパイラで指摘されます。

## まとめ

- 数値の表し方は、速さと正確さのどちらを優先するかで決まります。
- 列挙型と `match` を使うと、形の書き漏れをコンパイラが見つけてくれます。
- `#[cfg]` で機能ごとに実装を分けると、必要な分だけをビルドできます。
