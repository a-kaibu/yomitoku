---
title: "一時的に止めていた判定を、再開する"
description: "startSkipping で止めた assert と fail の判定を、元の状態に戻す関数。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [982, 982]
function: "endSkipping"
difficulty: 1
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`endSkipping` は、**`startSkipping` で止めていた判定を再開する** 関数です。この関数を呼んだ後の `assert` と `fail` は、再び結果に数えられます。

テストの一部を飛ばしたあと、続きのテストは通常どおり判定させたい場面で使います。開始と終了を組にして使うと、飛ばす範囲がはっきりします。

## コード

```bash:line-numbers=982
endSkipping() { __shunit_skip=${SHUNIT_FALSE}; }
```

## 前提知識

- **`startSkipping`**: 判定を止める状態にする関数です。この関数と対になっています。
- **状態の変数**: `__shunit_skip` の値で、判定を飛ばすかどうかを表します。
- **`SHUNIT_FALSE`**: 偽を表す定数です。shUnit2 の中で、真偽を共通の値で扱うための仕組みです。

## 何をしているか

### 1. 飛ばす状態を解除する

```bash:line-numbers=982
endSkipping() { __shunit_skip=${SHUNIT_FALSE}; }
```

`__shunit_skip` に偽の値を入れます。これで、以後の `assert` や `fail` は、通常どおりの判定に戻ります。

## ここがすごい

- **一行で済む**: 状態の変数を書き換えるだけなので、短く、迷う場所がありません。
- **真偽の値を定数で扱う**: `SHUNIT_FALSE` を使うので、真偽の表し方が全体で揃います。
- **対になる関数が明確**: 開始と終了が、同じ変数を使って組になっています。読んだときに、状態の流れが追いやすい設計です。

## まとめ

- 状態の切り替えは、開始と終了を同じ変数で組にすると分かりやすい。
- 真偽の値は、定数に統一すると読み間違いが減る。
- 短い関数でも、対になる相手を意識して書くと、全体が整う。
