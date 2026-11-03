---
title: "リスナーの下に書いたルールを、一つの一覧に平らにする"
description: "terraform-aws-alb の listener_rules。リスナーごとのルールの入れ子を flatten で一段にし、リスナーの名前とルールの名前を足して一覧にする。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [320, 328]
format: 2
function: "locals（listener_rules の flatten と二重の for 式）"
difficulty: 3
tags: ["データ構造", "API設計"]
---

## ひとことで
ALB のリスナーには、その下にルールを書けます。リスナーもルールも複数ある場合、入れ子の一覧になってしまいます。このコードは、それを一段の一覧に平らにして、後の `for_each` で一つずつ作れる形にしています。

## コード
```hcl:line-numbers=320
  listener_rules = flatten([
    for listener_key, listener_values in var.listeners : [
      for rule_key, rule_values in listener_values.rules :
      merge(rule_values, {
        listener_key = listener_key
        rule_key     = rule_key
      })
    ]
  ])
```

## 前提知識
- `flatten(リスト)`: 入れ子のリストを、一段のリストにします。
- 二重の `for` 式: 外側でリスナーを、内側でそのルールを回します。
- `merge(マップ, 追加)`: ルールのマップに、リスナーのキーとルールのキーを足します。

## 何をしているか
### 1. リスナーごとに、ルールの一覧を作る

```hcl:line-numbers=321
    for listener_key, listener_values in var.listeners : [
      for rule_key, rule_values in listener_values.rules :
```

外側の `for` がリスナーを、内側の `for` がそのリスナーのルールを回します。この時点では、リストの中にリストが入った形です。

### 2. ルールに、リスナーの情報を足す

```hcl:line-numbers=323
      merge(rule_values, {
        listener_key = listener_key
        rule_key     = rule_key
      })
```

`merge` で、各ルールに `listener_key` と `rule_key` を加えます。後で資源を作るとき、どのリスナーのルールかが分かるようになります。

### 3. 全体を一段にする

最後に `flatten` が、入れ子を一段にします。戻り値は、すべてのルールが並んだ一つのリストです。

## ここがすごい
利用者は、ルールをリスナーの中に書くだけで済みます。ルールを資源として作るときは、平らになった一覧をそのまま `for_each` に渡せます。キーを `リスナー/ルール` の形で組み立てる点も、後で一意に指すための工夫です。

## まとめ
- 入れ子の `for` は、`flatten` と組み合わせると一覧にできます。
- 親の情報を子に `merge` で足すと、平らにした後も親を特定できます。
- 利用者の書きやすさと、資源の作りやすさを、中間の一覧で分けられます。
