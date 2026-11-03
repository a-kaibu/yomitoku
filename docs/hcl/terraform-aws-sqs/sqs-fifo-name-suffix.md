---
title: "FIFO キューの名前に、.fifo を自動で付ける"
description: "terraform-aws-sqs のキュー名。FIFO のときだけ末尾に .fifo を付け、名前のプレフィックス指定があるときは null にして使い分ける。"
language: hcl
project: "terraform-aws-sqs"
repo: https://github.com/terraform-aws-modules/terraform-aws-sqs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a68b4d515f9ccc729fb8bf84c6760c6b91302ce0"
file: main.tf
lines: [44, 45]
format: 2
function: "resource \"aws_sqs_queue\"（this・name と name_prefix）"
difficulty: 1
tags: ["API設計", "文字列処理"]
---

## ひとことで
SQS には、順番を守って 1 回だけ届ける「FIFO キュー」と、順番を気にしない「標準キュー」があります。FIFO キューの名前は、末尾が `.fifo` で終わる必要があります。このコードは、利用者が名前を 1 つ書くだけで、FIFO のときは `.fifo` を自動で付け、名前の接頭辞を使うときはそちらを優先します。

## コード
```hcl:line-numbers=44
  name                              = var.use_name_prefix ? null : (var.fifo_queue ? "${local.name}.fifo" : local.name)
  name_prefix                       = var.use_name_prefix ? "${local.name}-" : null
```

## 前提知識
- FIFO キュー: メッセージの順番を守り、重複なしで届けるキューです。名前の末尾に `.fifo` が必要です。
- 標準キュー: 順番は保証しませんが、より多くのメッセージを速く処理できます。
- `name_prefix`: 名前の前半だけを決めて、AWS に後半をランダムに付けてもらう指定です。
- 三項演算子: 条件に応じて、2 つの値のどちらかを選びます。
- 文字列の埋め込み `"${...}"`: 変数の値を文字列の中に入れます。

## 何をしているか
### 1. 名前の接頭辞を使うときは、name を null にする

```hcl:line-numbers=44
  name                              = var.use_name_prefix ? null : (var.fifo_queue ? "${local.name}.fifo" : local.name)
```

`use_name_prefix` が真なら、`name` は `null` にします。AWS は、`name_prefix` の方の値を使うためです。偽なら、括弧の中の式で名前を決めます。

### 2. FIFO のときだけ、末尾に .fifo を付ける

括弧の中は、`var.fifo_queue` が真なら `"${local.name}.fifo"`、偽なら `local.name` を使う、という二段の三項演算子です。利用者は FIFO かどうかを 1 つのフラグで決めるだけで、名前の決まりを覚える必要がありません。

### 3. プレフィックスの側も、同じ前提で作る

```hcl:line-numbers=45
  name_prefix                       = var.use_name_prefix ? "${local.name}-" : null
```

接頭辞を使うときは、名前の後ろに `-` を付けて、AWS がランダムな文字列を続けられるようにします。`.fifo` は付けません。接頭辞の形の場合は、AWS 側の規則に従うからです。

## ここがすごい
名前の決まりを、フラグの組み合わせで作っていて、利用者は「FIFO かどうか」「接頭辞を使うかどうか」だけを考えれば済みます。`.fifo` の付け忘れによる失敗は、この式がある限り起きません。

また、`name` と `name_prefix` の片方を必ず `null` にしています。両方を同時に指定すると AWS がエラーを返すので、その組み合わせを式の中で排除しています。

## まとめ
- 名前の決まりは、フラグと三項演算子でまとめると、利用者が覚えることが減ります。
- `null` で片方を消すと、同時指定によるエラーを防げます。
- 文字列の埋め込みで、末尾の `.fifo` や `-` のような決まった文字を付けられます。
