---
title: "サービスの一覧が無いときは、空のマップを回す"
description: "terraform-aws-ecs のモジュール呼び出し。services が null のときは空のマップにして、for_each が失敗しないようにする。"
language: hcl
project: "terraform-aws-ecs"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "135c225c75c7f0044966329c55ad8d647b358a57"
file: main.tf
lines: [99, 99]
format: 2
function: "module \"service\"（for_each の三項演算子）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
ECS クラスターには、複数のサービスを一度に作るための一覧を渡せます。一覧を使わない利用者は、その値を `null` のままにします。このコードは、`null` のときは空のマップを渡して、`for_each` がエラーにならないようにしています。

## コード
```hcl:line-numbers=99
  for_each = var.create && var.services != null ? var.services : {}
```

## 前提知識
- `for_each`: マップの要素ごとに、モジュールや資源を一つずつ作ります。
- `null`: 値が無いことを表します。`for_each` に `null` を渡すと、エラーになります。
- 空のマップ `{}`: 要素が一つもないマップです。`for_each` に渡すと、何も作られません。

## 何をしているか
### 1. 作成するかと、一覧の有無を両方見る

```hcl:line-numbers=99
  for_each = var.create && var.services != null ? var.services : {}
```

`var.create` が偽なら、一覧の中身にかかわらず空のマップになります。また、`var.services` が `null` でも、空のマップになります。

### 2. 空のマップなら、何も作られない

空のマップを `for_each` に渡すと、モジュールは一つも作られません。そのため、サービスを使わない場合も、同じ書き方のまま動きます。

## ここがすごい
「使わないなら、何も作らない」を、`for_each` に渡す値だけで表しています。モジュールの呼び出しを条件で囲まずに済むので、呼び出し側の書き方が一定に保たれます。

## まとめ
- `for_each` に `null` を渡すとエラーになるので、空のマップで置き換えると安全です。
- 作成の有無と一覧の有無を、同じ式で一緒に判定できます。
- 空の `for_each` は、何も作らないことを表す自然な書き方です。
