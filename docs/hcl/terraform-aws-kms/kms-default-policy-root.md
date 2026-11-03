---
title: "鍵ポリシーに、アカウントの管理者を最初に入れる"
description: "terraform-aws-kms の既定の鍵ポリシー。アカウントのルートに kms:* を許可する文を、enable_default_policy が真のときだけ作る。"
language: hcl
project: "terraform-aws-kms"
repo: https://github.com/terraform-aws-modules/terraform-aws-kms
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d25e459bd43d8d0bdff7c250ba6b237a12be7381"
file: main.tf
lines: [112, 125]
format: 2
function: "data \"aws_iam_policy_document\"（this・dynamic \"statement\" の Default）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
KMS（鍵管理サービス）の鍵は、それを読むことができる人を「鍵ポリシー」で決めます。鍵ポリシーに誰も許可を書かないと、作った本人でさえ鍵を操作できなくなることがあります。このコードは、既定のポリシーとして「アカウントの管理者（ルート）に、すべての鍵操作を許可する」文を入れます。

## コード
```hcl:line-numbers=112
  dynamic "statement" {
    for_each = var.enable_default_policy ? [1] : []

    content {
      sid       = "Default"
      actions   = ["kms:*"]
      resources = ["*"]

      principals {
        type        = "AWS"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
      }
    }
  }
```

## 前提知識
- KMS: AWS の暗号鍵を作って管理するサービスです。暗号化に使う鍵を、アプリから直接見せずに使えます。
- 鍵ポリシー: KMS の鍵ごとに付ける許可の書類です。IAM のポリシーとは別に、鍵へのアクセスを決めます。
- アカウントのルート: AWS アカウントそのものを指す ARN（`arn:aws:iam::123456789012:root` の形）です。ここに許可を書くと、そのアカウントの IAM で、許可を子に委譲できます。
- `kms:*`: 鍵に対するすべての操作を表す記号です。
- `dynamic` と `[1] : []`: 条件が真のときだけブロックを 1 回作り、偽のときは作らない書き方です。

## 何をしているか
### 1. 有効なときだけ、文を 1 つ作る

```hcl:line-numbers=112
  dynamic "statement" {
    for_each = var.enable_default_policy ? [1] : []
```

`enable_default_policy` が真なら、`[1]` という 1 つの要素を回すので、文が 1 つ作られます。偽なら空のリストなので、何も作られません。`[1]` は値に意味はなく、「1 回だけ作る」ためだけに使われています。

### 2. アカウントのルートに、すべての操作を許す

```hcl:line-numbers=116
      sid       = "Default"
      actions   = ["kms:*"]
      resources = ["*"]
```

`actions = ["kms:*"]` が、すべての鍵操作を許可します。`resources = ["*"]` は、このポリシーが付いている鍵そのものを指します。鍵ポリシーでは、`resources` は通常これで十分です。

### 3. 許可する相手を、アカウントのルートにする

```hcl:line-numbers=120
      principals {
        type        = "AWS"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
      }
```

`identifiers` のルート ARN は、`partition` と `account_id` を埋め込んだ文字列です。`partition` は `aws` や `aws-cn` などの区分で、`locals` で計算されています。こうすると、中国リージョンなどでも同じコードで正しい ARN になります。

## ここがすごい
鍵ポリシーにルートを入れておくと、IAM のポリシーで鍵の操作を許可できるようになります。逆に、鍵ポリシーで誰にも許可せず、IAM の許可だけに任せると、IAM の設定を誤ったときに鍵を操作できなくなります。KMS の公式の説明でも、鍵ポリシーにルートを含めて、この問題を避けることが勧められています。

また、`partition` と `account_id` を `locals` にまとめ、ARN を組み立てている点も見どころです。ハードコードした ARN だと、別のアカウントや別の区分で使えなくなりますが、この書き方なら、どこで使っても正しい ARN ができます。

## まとめ
- 鍵ポリシーの `Default` 文は、アカウントのルートに鍵の全操作を許す、安全弁のような役割を持ちます。
- `for_each = 条件 ? [1] : []` で、ブロックの作成を 1 行の条件で切り替えられます。
- ARN は `partition` や `account_id` を組み立てて作ると、どの区分や口座でも使えます。
