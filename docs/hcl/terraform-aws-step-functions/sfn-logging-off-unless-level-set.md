---
title: "ログは、レベルが指定されたときだけ有効にする"
description: "terraform-aws-step-functions の enable_logging。logging_configuration の level が無ければ OFF とみなし、既定でログを無効にする。"
language: hcl
project: "terraform-aws-step-functions"
repo: https://github.com/terraform-aws-modules/terraform-aws-step-functions
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "16c7a1ffaa72643d714a7b3924216edce9413482"
file: main.tf
lines: [5, 5]
format: 2
function: "locals（enable_logging の try による既定値）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
Step Functions のログは、利用者が設定を書いたときだけ有効にします。何も書かなければ、ログは無効のままです。このコードは、`level` が無い場合に `"OFF"` とみなして、その結果をログの有効・無効の判定に使っています。

## コード
```hcl:line-numbers=5
  enable_logging = try(var.logging_configuration["level"], "OFF") != "OFF"
```

## 前提知識
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。ここでは、キーが無い場合の逃げ道です。
- `!=`: 等しくないかを判定します。結果は真偽値です。
- ログのレベル: `ALL` や `ERROR` などがあります。`OFF` はログを出さないことを表します。

## 何をしているか
### 1. レベルが無ければ、OFF とみなす

```hcl:line-numbers=5
  enable_logging = try(var.logging_configuration["level"], "OFF") != "OFF"
```

`var.logging_configuration["level"]` が無ければ、`try` は既定値の `"OFF"` を返します。その結果、`!=` の判定は偽になり、ログは無効です。

### 2. 指定があれば、有効になる

レベルに `OFF` 以外の値が入っていれば、判定は真になります。その後の動的ブロックは、この真偽値を見て作られます。

## ここがすごい
「設定が無いとき」を、キーの有無の判定ではなく、既定の値を一つ決めて表しています。利用者は、ログを有効にしたいときだけ `level` を書けばよく、無効化の書き方を覚える必要がありません。

## まとめ
- `try` の既定値に、無効を表す値を置くと、省略時の動作を一か所で決められます。
- 真偽値の判定を変数に入れると、後の分岐が読みやすくなります。
- 有効にする条件を明示すると、利用者の意図が伝わりやすくなります。
