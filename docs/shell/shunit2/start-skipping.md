---
title: "テストの途中から、判定を一時的に止める"
description: "以後の assert と fail の判定を飛ばす状態にし、必要なら理由を警告として表示する関数。"
language: shell
project: "shUnit2"
repo: https://github.com/kward/shunit2
license: "Apache-2.0"
copyright: "Copyright 2008-2021 Kate Ward. All Rights Reserved."
commit: "f39734a3dd56495c2fee1d4b0925bb31082e36d2"
file: "shunit2"
lines: [973, 976]
function: "startSkipping"
difficulty: 1
format: 2
tags: [設計パターン, イディオム, CLI]
---
## ひとことで

`startSkipping` は、**テストの判定を一時的に止める** 関数です。この関数を呼んだあとの `assert` や `fail` は、結果に数えられなくなります。

環境の都合で、一部のテストを飛ばしたい場面に使います。飛ばす理由があれば、警告として表示できます。

## コード

```bash:line-numbers=973
startSkipping() {
  if ${__SHUNIT_BUILTIN} [ $# -gt 0 ]; then _shunit_warn "[skipping] $*"; fi
  __shunit_skip=${SHUNIT_TRUE}
}
```

## 前提知識

- **assert と fail**: テストで期待する値を確かめる関数です。結果を、成功か失敗として記録します。
- **`$#`**: 引数の数です。0 より大きければ、理由が渡されたことになります。
- **`_shunit_warn`**: shUnit2 の内部で、警告を表示する関数です。
- **状態の変数**: `__shunit_skip` の値で、判定を飛ばすかどうかを覚えます。

## 何をしているか

### 1. 理由があれば警告を出す

```bash:line-numbers=974
  if ${__SHUNIT_BUILTIN} [ $# -gt 0 ]; then _shunit_warn "[skipping] $*"; fi
```

引数が 1 つ以上あれば、その内容を `[skipping]` の形で警告として表示します。理由を残すための処理です。

### 2. 飛ばす状態を立てる

```bash:line-numbers=975
  __shunit_skip=${SHUNIT_TRUE}
```

`__shunit_skip` に真の値を入れます。以後の `assert` や `fail` は、この値を見て判定を省きます。

## ここがすごい

- **判定の仕組みを変えずに止める**: 個々のテストを書き換えず、状態の変数 1 つで、まとめて飛ばせます。
- **理由を残せる**: 引数で理由を渡すと、テストの出力に残ります。なぜ飛ばしたかを後から確認できます。
- **対になる関数がある**: `endSkipping` で元に戻し、`isSkipping` で状態を調べられます。

## まとめ

- テストの一部を飛ばす仕組みは、状態の変数 1 つにまとめると扱いやすい。
- 飛ばす理由は、必ず記録に残すと後で役立つ。
- 開始と終了を対にすると、飛ばす範囲が明確になる。
