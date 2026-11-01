---
title: 以上で最小の 2 のべき乗を求め、溢れ方を決める
description: 整数以上で最小の 2 のべき乗を返す next_power_of_two。溢れたときはデバッグでパニック、リリースでは 0 に包む、という挙動の決め方を示す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/core/src/num/uint_macros.rs
lines: [3931, 3941]
function: next_power_of_two
difficulty: 2
format: 2
tags: [ビット演算, 数値計算, 防御的プログラミング]
---

## ひとことで

`next_power_of_two` は、与えた整数 **以上で最も小さい 2 のべき乗** を返す関数です。たとえば `3` なら `4`、`5` なら `8`、`16` なら `16` です。
ただし、答えが型の最大値を超えるときは表せません。この関数は、その場合の挙動をデバッグとリリースで変えて、作る側が決めた方針で扱っています。

## コード

::: code-group

```rust:line-numbers=3931 [日本語訳]
        pub const fn next_power_of_two(self) -> Self {
            if let Some(npot) = self.checked_next_power_of_two() {
                npot
            } else {
                #[expect(arithmetic_overflow)]
                {
                    // 0 を返すが、デバッグビルドではパニックする形で書く
                    Self::MAX + 1
                }
            }
        }
```

```rust:line-numbers=3931 [原文]
        pub const fn next_power_of_two(self) -> Self {
            if let Some(npot) = self.checked_next_power_of_two() {
                npot
            } else {
                #[expect(arithmetic_overflow)]
                {
                    // Zero but in a way that panics in debug
                    Self::MAX + 1
                }
            }
        }
```

:::

本体は、`checked_next_power_of_two` を呼ぶだけの短い関数です。その結果が `None`（表せない）のときだけ、わざと溢れる式を書いています。

## 前提知識

- **`Option`**: 値があるかないかを表す型です。`Some(値)` か `None` のどちらかになります。
- **`if let`**: `Option` などの中身を取り出すときの書き方です。`Some` のときだけ中身を使い、そうでなければ `else` の部分が動きます。
- **型の最大値**: `u32` なら 2^32 − 1 のように、型で表せる最も大きい値です。`Self::MAX + 1` は、そこから 1 を足すので溢れます。
- **デバッグとリリース**: デバッグビルドでは整数の溢れをパニックで知らせ、リリースビルドでは値を切り詰めて続けます。
- **`#[expect(...)]`**: この警告を、意図的に出していることを宣言する属性です。ここでは、わざと溢れる式に対して、コンパイラの警告を止めています。

## 何をしているか

### 1. 表せる場合は、その値を返す

```rust:line-numbers=3932
            if let Some(npot) = self.checked_next_power_of_two() {
                npot
            } else {
```

`checked_next_power_of_two` は、答えが型の中に収まるなら `Some` で値を返し、収まらないなら `None` を返します。`if let` で `Some` のときは、その値をそのまま返します。

### 2. 表せない場合は、わざと溢れさせる

```rust:line-numbers=3935
                #[expect(arithmetic_overflow)]
                {
                    // Zero but in a way that panics in debug
                    Self::MAX + 1
                }
            }
```

`None` のときは、`Self::MAX + 1` を返す式になります。これは型の範囲を超えるので、デバッグビルドではパニックします。リリースビルドでは 2^N を N ビットに切り詰めた結果、0 になります。
ここでは「0 を返す」ことが仕様として文書化されています。0 は本当の答えではありませんが、溢れを知らせる役目も持たせています。

## ここがすごい

- **溢れの扱いを 2 つに分けている**: 安全に値を求める `checked_` 版と、通常の版を分けることで、呼び出し側が溢れを検出するか、結果の 0 を受け入れるかを選べます。
- **デバッグでは確実に気づける**: テストやデバッグのときにだけ、パニックで問題を知らせます。本番の速さは、切り詰めの 0 で落ちません。
- **わざとの溢れを 1 か所に閉じ込めている**: 溢れる式は 1 行だけです。残りの処理は、`checked_` 版の結果だけを使います。
- **`#[expect]` で意図を残す**: 警告を単に消すのではなく、「ここは意図してやっている」と宣言しています。後から読む人にも分かります。
- **型による制限を素直に表す**: 2 のべき乗の上限は型のビット数で決まります。その限界を、`Option` と溢れの 2 つで表現しています。

## まとめ

- 次の 2 のべき乗は、型に収まるかを `Option` で確かめてから返す。
- 収まらない場合の挙動は、デバッグではパニック、リリースでは 0 と決まっている。
- 溢れを検出したい場合は、`checked_next_power_of_two` を使う。
