---
title: 負の数のリテラルを、符号ごと読み直す
description: syn の parse_negative_lit。マイナス記号と数値リテラルの文字列を連結して、符号を含めた形で整数か小数かを解釈し直す。
language: rust
project: syn
repo: https://github.com/dtolnay/syn
license: MIT OR Apache-2.0
copyright: Copyright (c) David Tolnay (LICENSE に著作権表示がないため Cargo.toml の authors)
commit: "38318bf9ee5f9e0e26b347256ff2cd77958c8bba"
file: src/lit.rs
lines: [865, 902]
function: parse_negative_lit
difficulty: 2
format: 2
tags: [パース, 数値計算, 文字列処理]
---

## ひとことで

`parse_negative_lit` は、`syn` で `-1` や `-2.5` のような **負の数のリテラル** を読む関数です。Rust の文法では、マイナス記号と数値は別々のトークンとして現れますが、この関数はそれらをまとめて 1 つのリテラルとして扱います。

やり方は単純です。数値リテラルを文字列にして、先頭に `-` を付け、それを整数として解釈し直します。整数として解釈できなければ、小数として解釈します。

## コード

```rust:line-numbers=865
    fn parse_negative_lit(neg: Punct, cursor: Cursor) -> Option<(Lit, Cursor)> {
        let (lit, rest) = cursor.literal()?;

        let mut span = neg.span();
        span = span.join(lit.span()).unwrap_or(span);

        let mut repr = lit.to_string();
        repr.insert(0, '-');

        if let Some((digits, suffix)) = value::parse_lit_int(&repr) {
            let mut token: Literal = repr.parse().unwrap();
            token.set_span(span);
            return Some((
                Lit::Int(LitInt {
                    repr: Box::new(LitIntRepr {
                        token,
                        digits,
                        suffix,
                    }),
                }),
                rest,
            ));
        }

        let (digits, suffix) = value::parse_lit_float(&repr)?;
        let mut token: Literal = repr.parse().unwrap();
        token.set_span(span);
        Some((
            Lit::Float(LitFloat {
                repr: Box::new(LitFloatRepr {
                    token,
                    digits,
                    suffix,
                }),
            }),
            rest,
        ))
    }
```

## 前提知識

- **リテラル**: ソースコードに直接書かれた値です。`42`、`2.5`、`"abc"` などが該当します。
- **トークン**: 字句解析で分けられた、プログラムの最小の単位です。`-` と `1` は、別々のトークンとして現れることがあります。
- **`Cursor`**: 入力のトークン列を先頭から読むための型です。`literal()` は、次がリテラルなら、それと残りの入力を返します。
- **`Punct`**: 記号（`-` や `,` など）を表すトークンです。`span()` で、その位置の情報を取り出せます。
- **`Span`**: ソースコード上の位置の範囲です。`join` で、2 つの範囲をつなげられます。

## 何をしているか

### 1. マイナス記号の直後にあるリテラルを読む

```rust:line-numbers=866
        let (lit, rest) = cursor.literal()?;

        let mut span = neg.span();
        span = span.join(lit.span()).unwrap_or(span);
```

`cursor.literal()` で、マイナス記号の後ろにあるリテラルを読みます。リテラルがなければ、`?` によって `None` を返します。`span` は、マイナス記号とリテラルの両方を含む範囲にします。

### 2. 文字列の先頭に符号を付ける

```rust:line-numbers=871
        let mut repr = lit.to_string();
        repr.insert(0, '-');
```

リテラルを文字列にして、先頭に `-` を入れます。こうすると、`-128` のように、符号がなければ範囲を超える値も、符号を含んだ形で解釈できます。

### 3. 整数として解釈できるかを試す

```rust:line-numbers=874
        if let Some((digits, suffix)) = value::parse_lit_int(&repr) {
            let mut token: Literal = repr.parse().unwrap();
            token.set_span(span);
            return Some((
                Lit::Int(LitInt {
                    repr: Box::new(LitIntRepr {
                        token,
                        digits,
                        suffix,
                    }),
                }),
                rest,
            ));
        }
```

`parse_lit_int` で整数として解釈できれば、トークンを作り直して、位置の情報を付け直します。その結果を `Lit::Int` として返します。

### 4. 小数として解釈する

```rust:line-numbers=889
        let (digits, suffix) = value::parse_lit_float(&repr)?;
        let mut token: Literal = repr.parse().unwrap();
        token.set_span(span);
        Some((
            Lit::Float(LitFloat {
                repr: Box::new(LitFloatRepr {
                    token,
                    digits,
                    suffix,
                }),
            }),
            rest,
        ))
```

整数として解釈できなければ、`parse_lit_float` で小数として解釈します。どちらにも当たらなければ、`?` で `None` を返します。解釈できたら、`Lit::Float` として返します。

## ここがすごい

- **符号を含めて解釈する**: 符号を後から付けるのではなく、最初から負の数として読み直すので、範囲の端の値（最小値など）も正しく扱えます。
- **文字列の再解釈を活用する**: 新しい解析器を作らずに、既にある整数と小数の解釈関数を再利用しています。
- **位置の情報を引き継ぐ**: マイナス記号を含む範囲を `span` として付けるので、エラーの表示が正しい位置を指せます。
- **整数と小数を順に試す**: 整数で読めなければ小数、という順番で、どちらの形式でも同じ関数で扱えます。

## まとめ

- 記号と数値が別々に来る文法では、後でまとめて読み直すと、端の値も扱えます。
- 既存の解釈関数を再利用すると、新しい解析器を書かずに済みます。
- 位置の情報を正しく付けると、エラーの場所が正確になります。
