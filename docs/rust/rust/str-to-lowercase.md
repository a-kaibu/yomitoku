---
title: 小文字化は ASCII を先に一気に片付け、Σ だけは特別扱い
description: 文字列を小文字に変換する関数。先頭の ASCII 部分を高速にまとめて変換し、残りは 1 文字ずつ Unicode の規則で変換する。ギリシャ文字の Σ は語末かどうかで変える。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/alloc/src/str.rs
lines: [457, 489]
function: str::to_lowercase
difficulty: 2
tags: [Unicode, 文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`to_lowercase` は、文字列を **すべて小文字にした新しい `String`** を返す関数です。`"Hello"` は `"hello"`、ギリシャ語の `"ΟΔΥΣΣΕΥΣ"` は `"οδυσσευς"` になります。

英語なら A〜Z を a〜z に変えるだけですが、Unicode には「1 文字が複数の文字になる」ものや「位置によって変わる」ものがあります。この関数は、**よくある ASCII の部分を高速に処理し、難しい部分だけを丁寧に処理する** 2 段構えになっています。

## コード

```rust:line-numbers=457
    pub fn to_lowercase(&self) -> String {
        // SAFETY: `to_ascii_lowercase` preserves ASCII bytes, so the converted
        // prefix remains valid UTF-8.
        let (mut s, rest) = unsafe { convert_while_ascii(self, u8::to_ascii_lowercase) };

        let prefix_len = s.len();

        for (i, c) in rest.char_indices() {
            if c == 'Σ' {
                // Σ maps to σ, except at the end of a word where it maps to ς.
                // This is the only conditional (contextual) but language-independent mapping
                // in `SpecialCasing.txt`,
                // so hard-code it rather than have a generic "condition" mechanism.
                // See https://github.com/rust-lang/rust/issues/26035
                let sigma_lowercase = map_uppercase_sigma(self, prefix_len + i);
                s.push(sigma_lowercase);
            } else {
                match conversions::to_lower(c) {
                    [a, '\0', _] => s.push(a),
                    [a, b, '\0'] => {
                        s.push(a);
                        s.push(b);
                    }
                    [a, b, c] => {
                        s.push(a);
                        s.push(b);
                        s.push(c);
                    }
                }
            }
        }
        s
    }
```

## 前提知識

- **`&self` と `-> String`**: 文字列 `&str` を借りて読み、新しく作った `String`（所有権を持つ文字列）を返します。元の文字列は変わりません。
- **`char_indices()`**: 文字列を 1 文字ずつ、そのバイト位置とともに取り出すイテレータです。`for (i, c) in ...` で位置 `i` と文字 `c` を受け取ります。
- **`'Σ'`**: Rust の `char` 型はシングルクォートで書く 1 文字（Unicode のコードポイント）です。
- **`match` とパターン**: `match x { パターン => 処理, ... }` は、値の形に応じて処理を分けます。`[a, '\0', _]` は「3 要素の配列で、2 番目が `'\0'`」という形にマッチし、1 番目を `a` に取り出します。`_` は何でもよいという意味です。
- **`unsafe` な補助関数**: `convert_while_ascii` は、先頭から ASCII が続く限りまとめて変換し、変換済みの `String` と残りの文字列を返します。変換関数が ASCII を ASCII に変えることが前提なので `unsafe` です。

## 何をしているか

### 1. ASCII の部分をまとめて変換（460〜462 行目）

`"Hello, ΣΟΦΙΑ"` なら、`"Hello, "` までが ASCII です。この部分は `u8::to_ascii_lowercase` で 1 バイトずつ（実際には 16 バイトずつまとめて）変換され、`s = "hello, "`、`rest = "ΣΟΦΙΑ"` になります。

### 2. 残りを 1 文字ずつ変換（464〜487 行目）

`conversions::to_lower(c)` は、小文字を最大 3 文字の配列で返します。使わない部分は `'\0'` で埋められています。

- `[a, '\0', _]`: 1 文字になる場合（ほとんどの文字）
- `[a, b, '\0']`: 2 文字になる場合（たとえば `'İ'` は `'i'` と結合用の点 `'̇'` になります）
- `[a, b, c]`: 3 文字になる場合

`match` で配列の形を見て、必要な数だけ `push` します。

### 3. Σ だけは特別（465〜472 行目）

ギリシャ文字の大文字 Σ は、単語の途中なら σ、単語の最後なら ς という別の小文字になります。前後の文字を見ないと決められないので、`map_uppercase_sigma` に元の文字列全体と位置を渡して判定させます。

## ここがすごい

- **よくあるケースを最速に**: 多くの文字列は ASCII だけ、または ASCII で始まります。その部分は Unicode の表を引かずに、SIMD 命令が使える形でまとめて変換されます。
- **配列とパターンマッチで「可変長の結果」を表す**: 小文字化の結果は 1〜3 文字ですが、`Vec` を作るとメモリ確保が必要になります。固定長 3 の配列を `'\0'` で埋めて返し、パターンマッチで長さを判定することで、メモリ確保なしに扱っています。
- **例外は 1 つだけハードコード**: 466〜470 行目のコメントのとおり、Unicode の特殊な大文字・小文字規則のうち、言語に依存せず文脈で変わるのは Σ だけです。汎用的な「条件」の仕組みを作る代わりに、この 1 つだけを直接書いています。仕様を調べたうえで、最もシンプルな実装を選んだ例です。
- **ロケール非依存**: トルコ語の i/İ のような言語ごとの規則は扱わない、と割り切っています。どの環境でも同じ結果になります。

## まとめ

- 文字列処理は「速い ASCII の道」と「丁寧な Unicode の道」に分けると、速さと正しさを両立できる。
- 結果の長さが小さく上限があるなら、固定長配列 + 番兵（`'\0'`）で表すとメモリ確保がいらない。
- 仕様の例外が 1 つしかないなら、汎用の仕組みを作らずに直接書くのも立派な設計。
