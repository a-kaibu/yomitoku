---
title: "KMS 鍵を指定したら、SQS 独自の暗号化は外す"
description: "terraform-aws-sqs の暗号化設定。kms_master_key_id が指定されたら sqs_managed_sse_enabled を null にし、2 つの暗号化方式が重ならないようにする。"
language: hcl
project: "terraform-aws-sqs"
repo: https://github.com/terraform-aws-modules/terraform-aws-sqs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a68b4d515f9ccc729fb8bf84c6760c6b91302ce0"
file: main.tf
lines: [46, 48]
format: 2
function: "resource \"aws_sqs_queue\"（this・sqs_managed_sse_enabled）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
SQS のメッセージは、暗号化して保存できます。方式は 2 つあります。AWS が管理する鍵で暗号化する「SQS 管理の暗号化」と、利用者が作った KMS 鍵で暗号化する方式です。両方を同時に指定すると、どちらが使われるか分かりにくくなります。このコードは、KMS 鍵が指定されたら、SQS 管理の暗号化を `null` にして、重ならないようにしています。

## コード
```hcl:line-numbers=46
  receive_wait_time_seconds         = var.receive_wait_time_seconds
  sqs_managed_sse_enabled           = var.kms_master_key_id != null ? null : var.sqs_managed_sse_enabled
  visibility_timeout_seconds        = var.visibility_timeout_seconds
```

## 前提知識
- SSE（サーバー側の暗号化）: AWS がディスクに保存するデータを暗号化する仕組みです。
- SQS 管理の暗号化（sqs_managed_sse_enabled）: AWS が管理する鍵で、キューのメッセージを暗号化します。利用者は鍵を作る必要がありません。
- KMS 鍵: 利用者が作って管理する暗号鍵です。鍵の利用者や権限を細かく決められます。
- `null`: 属性を送らないことを表します。
- `receive_wait_time_seconds`: メッセージの受け取りの待ち時間（ロングポーリング）の秒数です。

## 何をしているか
### 1. 受け取りの待ち時間は、そのまま渡す

```hcl:line-numbers=46
  receive_wait_time_seconds         = var.receive_wait_time_seconds
```

この行は暗号化とは関係ありません。同じブロックの中にある、利用者の値をそのまま渡す行です。周りの行も同じ形で並んでいるので、読みやすさを保っています。

### 2. KMS 鍵が指定されたら、SQS 管理の暗号化を送らない

```hcl:line-numbers=47
  sqs_managed_sse_enabled           = var.kms_master_key_id != null ? null : var.sqs_managed_sse_enabled
```

`kms_master_key_id` に値があるとき、この式は `null` を選びます。`null` は、AWS に `sqs_managed_sse_enabled` を送らないという意味です。KMS 鍵の方が使われ、SQS 管理の暗号化は働きません。`kms_master_key_id` が無いときは、利用者の `sqs_managed_sse_enabled` の値をそのまま使います。

### 3. 可視性のタイムアウトは独立している

```hcl:line-numbers=48
  visibility_timeout_seconds        = var.visibility_timeout_seconds
```

メッセージを受け取った後、他の人から見えなくなっている時間です。暗号化の設定とは別に、そのまま渡しています。

## ここがすごい
暗号化の方式が 2 つあるとき、「片方を選んだら、もう片方は送らない」という排他の関係を、1 行の三項演算子で作っています。利用者は、KMS 鍵を指定するだけで、SQS 管理の暗号化が無効になることを心配しなくて済みます。

さらに、`null` を使うことで、AWS 側にフラグを 2 つ送らずに済んでいます。送らないという選択が、そのまま「この方式は使わない」という意味になっています。

## まとめ
- 似た設定が 2 つあるときは、片方を `null` にして排他にすると、混乱を防げます。
- `null` は「送らない」という意味で、AWS の既定値に任せる書き方です。
- 暗号化の方式は、鍵を利用者が管理するか、AWS に任せるかで選べます。
