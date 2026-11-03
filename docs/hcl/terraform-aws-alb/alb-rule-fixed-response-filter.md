---
title: "固定応答の動作を、フィルタした action の中から作る"
description: "terraform-aws-alb のリスナールール。fixed_response を持つ action だけを for 式で選び、dynamic で固定の応答を返す設定を作る。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [419, 436]
format: 2
function: "resource \"aws_lb_listener_rule\"（dynamic \"action\"・fixed_response）"
difficulty: 3
tags: ["API設計", "データ構造"]
---

## ひとことで
ALB のリスナールールには、条件に合うリクエストに対して、転送の代わりに固定の応答（例: 503 のメッセージ）を返す action を置けます。利用者は、action の一覧に複数の種類の action を混ぜて書きます。このコードは、その中から固定応答の action だけを選び、ブロックを作ります。

## コード
```hcl:line-numbers=419
  dynamic "action" {
    for_each = [for action in each.value.actions : action if action.fixed_response != null]

    content {
      dynamic "fixed_response" {
        for_each = [action.value.fixed_response]

        content {
          content_type = fixed_response.value.content_type
          message_body = fixed_response.value.message_body
          status_code  = fixed_response.value.status_code
        }
      }

      order = action.value.order
      type  = "fixed-response"
    }
  }
```

## 前提知識
- リスナールール: リスナーに対して、条件（パスやホスト名など）と action の組を足す仕組みです。
- action: 条件に合ったリクエストに対して、何をするかを決めた処理です。転送、認証、固定応答などがあります。
- 固定応答（fixed-response）: 転送せずに、ALB が直接応答を返す action です。メンテナンス中のページなどに使います。
- `for` 式の `if`: リストの要素のうち、条件に合うものだけを残します。
- `order`: 複数の action を実行する順番を表す値です。

## 何をしているか
### 1. 固定応答の action だけを選ぶ

```hcl:line-numbers=420
  for_each = [for action in each.value.actions : action if action.fixed_response != null]
```

`each.value.actions` の中から、`fixed_response` が `null` でない action だけを残します。転送などの他の action は、この `dynamic` では作られません。

### 2. 固定応答の中身を作る

```hcl:line-numbers=424
        for_each = [action.value.fixed_response]
```

選ばれた action の `fixed_response` を、1 要素のリストにして、内側の `dynamic` で回します。1 つの action に 1 つの応答があるので、要素は 1 つだけです。

### 3. 順番と種類を決める

```hcl:line-numbers=433
      order = action.value.order
      type  = "fixed-response"
```

`order` は、利用者が書いた順番をそのまま使います。`type` は、この `dynamic` が作るものは必ず固定応答なので、`"fixed-response"` と決め打ちしています。

## ここがすごい
action の一覧を、for 式で種類ごとに絞ってから `dynamic` に渡す、という 2 段の組み立てになっています。1 つのリストに色々な種類を混ぜても、どの種類がどのブロックになるかが、式の中で明確です。

さらに、固定応答の中身を「1 要素のリスト」として包むことで、ネストした `dynamic` の形をそろえています。前の記事で見た書き方と同じ型なので、読み手の理解が続きやすくなっています。

## まとめ
- `for` 式の `if` で、リストの要素を種類ごとに絞れます。
- 種類を決め打ちする属性（ここでは `type`）は、`dynamic` の中で固定するとミスが減ります。
- 1 要素のリストで包む書き方は、入れ子の `dynamic` で繰り返し使えます。
