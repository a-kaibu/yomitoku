---
title: 文字列を読みながら、エスケープと不正な制御文字を調べる
description: serde_json が JSON の文字列を読むときの本体。普通の文字は 1 バイトずつ書き溜め、\ で始まる部分はエスケープとして処理し、制御文字は検証で拒否する。
language: rust
project: serde_json
repo: https://github.com/serde-rs/json
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "8c535a260ce561eaab4111aafc29038eb9f77ff3"
file: src/read.rs
lines: [222, 253]
function: parse_str_bytes
difficulty: 2
format: 2
tags: [文字列処理, パース, 防御的プログラミング]
---

## ひとことで

`parse_str_bytes` は、JSON の **文字列（ダブルクォートで囲まれた部分）を 1 文字ずつ読み、中身を組み立てる** 関数です。普通の文字は、そのままバッファに書き溜めます。`\` で始まる部分は、エスケープ（例えば `\n` や `é`）として処理します。

読む途中で、JSON の規則に反する制御文字が現れたら、検証が有効な場合にエラーを返します。最後の `"` まで読んだら、書き溜めた内容を、呼び出し側が指定した方法で渡します。

## コード

```rust:line-numbers=222
    fn parse_str_bytes<'s, T, F>(
        &'s mut self,
        scratch: &'s mut Vec<u8>,
        validate: bool,
        result: F,
    ) -> Result<T>
    where
        T: 's,
        F: FnOnce(&'s Self, &'s [u8]) -> Result<T>,
    {
        loop {
            let ch = tri!(next_or_eof(self));
            if !is_escape(ch, true) {
                scratch.push(ch);
                continue;
            }
            match ch {
                b'"' => {
                    return result(self, scratch);
                }
                b'\\' => {
                    tri!(parse_escape(self, validate, scratch));
                }
                _ => {
                    if validate {
                        return error(self, ErrorCode::ControlCharacterWhileParsingString);
                    }
                    scratch.push(ch);
                }
            }
        }
    }
```

この関数は、`scratch` という作業用のバッファを使います。結果の文字列は、このバッファの中に作られます。関数 `result` は、読み終わった内容をどう扱うかを、呼び出し側が決めるための引数です。

## 前提知識

- **エスケープ**: JSON の文字列の中で、特殊な文字を `\` と別の文字の組で表す書き方です。`\"` や `\\` や `\n` などがあります。
- **制御文字**: 改行や復帰など、表示されない文字のうち、JSON の文字列に直接書けないものです。0 から 31 のバイトが該当します。
- **`scratch`**: 作業用のバッファです。呼び出しのたびに、同じ領域を使い回せます。
- **`is_escape`**: そのバイトが、特別な処理を要するかを判定する関数です。`"` `\` や制御文字が対象になります。
- **クロージャ（`FnOnce`）**: 読み終わったあとに一度だけ呼ばれる関数です。結果を文字列として扱うか、バイト列として扱うかを切り替えます。

## 何をしているか

### 1. 普通の文字は書き溜める

```rust:line-numbers=233
            let ch = tri!(next_or_eof(self));
            if !is_escape(ch, true) {
                scratch.push(ch);
                continue;
            }
```

次のバイトを読み、特別な文字でなければ、そのまま `scratch` に追加して次へ進みます。ほとんどの文字は、この経路で処理されます。

### 2. 終わりの引用符で結果を渡す

```rust:line-numbers=238
            match ch {
                b'"' => {
                    return result(self, scratch);
                }
```

`"` が現れたら、文字列の終わりです。`result` に、読み終わった内容を渡して、結果を返します。

### 3. バックスラッシュはエスケープとして処理する

```rust:line-numbers=242
                b'\\' => {
                    tri!(parse_escape(self, validate, scratch));
                }
```

`\` が現れたら、後ろの文字を見てエスケープとして処理します。その結果は、`scratch` に書き込まれます。

### 4. 制御文字は検証で拒否する

```rust:line-numbers=245
                _ => {
                    if validate {
                        return error(self, ErrorCode::ControlCharacterWhileParsingString);
                    }
                    scratch.push(ch);
                }
```

それ以外の特殊な文字は、制御文字です。検証が有効なら、エラーにします。検証が無効なら、そのまま書き溜めて、読み取りを続けます。

## ここがすごい

- **1 文字ずつの単純な形**: 文字の種類で分岐し、それぞれの処理を 1 か所にまとめています。読み方が一本道で、理解しやすいです。
- **作業用の領域を使い回す**: `scratch` を外から渡すので、文字列を読むたびに新しい領域を確保しなくて済みます。
- **検証の有無を選べる**: 信頼できる入力では検証を省いて速くでき、外部の入力では検証で不正を拒否できます。

## まとめ

- 普通の文字は作業バッファに書き溜め、`"` で終わりを判断する。
- `\` のエスケープと、制御文字の検証を、それぞれ別の経路で扱う。
- 作業バッファを外から渡して使い回し、検証の有無も呼び出し側が決める。
