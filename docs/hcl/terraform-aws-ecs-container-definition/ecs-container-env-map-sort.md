---
title: "環境変数のリストを、名前順が安定したマップに変える"
description: "terraform-aws-ecs-container-definition の環境変数。name と value の一覧を for 式で名前をキーにしたマップに変え、差分が出ないようにする。"
language: hcl
project: "terraform-aws-ecs-container-definition"
repo: https://github.com/cloudposse/terraform-aws-ecs-container-definition
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "b7bd87e935ead58c7012a5f5d6cbd0db7c170f16"
file: main.tf
lines: [3, 4]
format: 2
function: "locals（env_as_map・secrets_as_map）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
ECS のコンテナ定義には、環境変数を `name` と `value` の組の一覧として書きます。このモジュールは、利用者がリストで書いた環境変数を、名前をキーにしたマップに変えてから使います。マップは順番に依存しないので、同じ内容なら毎回同じ結果になります。

## コード
```hcl:line-numbers=3
  env_as_map     = var.map_environment != null ? var.map_environment : var.environment != null ? { for m in var.environment : m.name => m.value } : null
  secrets_as_map = var.map_secrets != null ? var.map_secrets : var.secrets != null ? { for m in var.secrets : m.name => m.valueFrom } : null
```

## 前提知識
- ECS（Elastic Container Service）: コンテナを AWS で動かすサービスです。コンテナの設定はタスク定義にまとめます。
- 環境変数: プログラムが起動時に読む、名前と値の組です。
- 三項演算子を重ねた書き方: `A ? B : C ? D : E` のように書くと、上から順に条件を見て値を選びます。
- `for` 式: `{ for m in 一覧 : m.name => m.value }` の形で、リストをマップに変えます。
- `null`: 値が無いことを表します。`!= null` で、指定があるかを確かめます。

## 何をしているか
### 1. map_environment があれば、それを使う

```hcl:line-numbers=3
  env_as_map     = var.map_environment != null ? var.map_environment : var.environment != null ? { for m in var.environment : m.name => m.value } : null
```

利用者が `map_environment` で、マップを直接渡していればそれを使います。無ければ、`environment` のリストを変換します。どちらも無ければ `null` です。マップを直接渡す方法を用意しているので、利用者は好きな方の書き方を選べます。

### 2. リストを、名前をキーにしたマップに変える

上の式の `{ for m in var.environment : m.name => m.value }` の部分が変換です。`m.name` がキーになり、`m.value` が値になります。結果として、`{ DB_HOST = "...", LOG_LEVEL = "info" }` のような形になります。

### 3. 秘密情報も同じ形で扱う

```hcl:line-numbers=4
  secrets_as_map = var.map_secrets != null ? var.map_secrets : var.secrets != null ? { for m in var.secrets : m.name => m.valueFrom } : null
```

秘密情報は、値そのものではなく、SSM パラメータなどの参照先（`valueFrom`）を渡します。ここでも、名前をキーにしたマップに揃えています。

## ここがすごい
リストは順番があるため、利用者が環境変数の順番を入れ替えるだけで、差分が出てしまいます。Terraform は、そのたびにタスク定義を作り直す可能性があります。キーでマップにすると、順番が変わっても、同じ内容なら同じ結果になります。コメントに書かれているとおり、これは「plan や apply のたびに作り直されない」ための工夫です。

また、マップを直接渡せる経路を残しているのも、よい設計です。リストの書き方が面倒な場合や、他のモジュールの出力をそのまま渡したい場合に、変換を飛ばせます。

## まとめ
- `for` 式でリストをマップに変えると、順番に依らない安定した値になります。
- 三項演算子を重ねると、優先順位のある既定値を 1 行で書けます。
- 秘密情報も、同じ形のマップに揃えると、扱いが統一されます。
