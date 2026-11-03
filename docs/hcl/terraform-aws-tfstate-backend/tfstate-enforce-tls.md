---
title: "HTTP での通信を、ポリシーで Deny する"
description: "terraform-aws-tfstate-backend のバケットポリシー。aws:SecureTransport が false のリクエストをすべて拒否する statement。暗号化されていない通信を、バケットの側で止める書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [135, 157]
format: 2
function: "data \"aws_iam_policy_document\"（EnforceTlsRequestsOnly）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
この `statement` は、TLS（暗号化された通信）を使わないリクエストを、バケットの側で拒否します。`aws:SecureTransport` という条件は、リクエストが HTTPS で届いたかを表します。HTTP で届いたリクエストは、どの主体からでも止められます。

## コード
```hcl:line-numbers=135
  statement {
    sid = "EnforceTlsRequestsOnly"

    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      "${var.arn_format}:s3:::${local.bucket_name}",
      "${var.arn_format}:s3:::${local.bucket_name}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
```

## 前提知識
- TLS（HTTPS）: 通信の内容を暗号化する仕組みです。HTTP は暗号化されていません。
- `aws:SecureTransport`: リクエストが TLS で届いたときは `true`、そうでなければ `false` になる、AWS の条件キーです。
- `Bool` の条件: 真偽値を比べる条件です。`values = ["false"]` は、`false` の場合に一致します。
- `Deny`（拒否）: 条件に合うリクエストを、ほかの許可に関係なく止めます。
- `actions = ["s3:*"]`: バケットに対するすべての操作を表します。
- `resources`: バケット自体と、その中のすべてのオブジェクトの ARN です。

## 何をしているか
### 1. 文を名前付きで書く
```hcl:line-numbers=135
  statement {
    sid = "EnforceTlsRequestsOnly"

```

`sid` は、この文の名前です。ポリシーの中で文を識別するために使われ、後から読んだときにも、何を目的にした文かが分かります。

### 2. すべての主体とすべての操作を対象にする
```hcl:line-numbers=138
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
```

`effect = "Deny"` で拒否にして、`principals` の `"*"` によって、すべての主体を対象にします。`actions` は `s3:*` なので、読み取りも書き込みも、すべての操作が対象です。

### 3. 暗号化されていない通信だけを拒否する
```hcl:line-numbers=147
    resources = [
      "${var.arn_format}:s3:::${local.bucket_name}",
      "${var.arn_format}:s3:::${local.bucket_name}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
```

`resources` にはバケットと、その中のオブジェクトの両方を入れています。`condition` は、`aws:SecureTransport` が `false` のときに一致するので、HTTP で届いたリクエストだけが拒否されます。HTTPS のリクエストは、この文の対象になりません。

## ここがすごい
この拒否は、利用者がクライアントの設定を間違えても、バケットの側で止めてくれます。状態ファイルには認証情報や構成の秘密が含まれることがあるため、平文の通信を許さないという、防御的な設計です。

また、ほかの文で許可をどれだけ広く書いても、`Deny` は優先されます。つまり、この 1 文は「どの許可でも HTTP は通さない」という約束を、ポリシーの中で守り続けます。

## まとめ
- `aws:SecureTransport` で、HTTPS かどうかを条件にできます。
- `Deny` の文は、ほかの許可より優先されます。
- バケットとその中のオブジェクトの両方を `resources` に入れると、対象を取りこぼしません。

