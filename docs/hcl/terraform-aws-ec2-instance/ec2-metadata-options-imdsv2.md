---
title: "インスタンスのメタデータ取得を、トークン必須に切り替える"
description: "terraform-aws-ec2-instance の metadata_options。http_tokens を required にすると、IMDSv2 のセッショントークンが必須になり、SSRF などでの情報漏えいを防ぎやすくなる。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [156, 165]
format: 2
function: "resource \"aws_instance\"（dynamic \"metadata_options\"）"
difficulty: 2
tags: ["セキュリティ", "ネットワーク"]
---

## ひとことで
EC2 のインスタンスの中からは、`169.254.169.254` という特別な IP アドレスで、インスタンス自身の情報（IAM の一時的な認証情報など）を取得できます。これをメタデータサービスと呼びます。このコードは、その取得方法の設定を利用者が書けるようにし、指定があるときだけブロックを作ります。

## コード
```hcl:line-numbers=156
    for_each = var.metadata_options != null ? [var.metadata_options] : []

    content {
      http_endpoint               = metadata_options.value.http_endpoint
      http_protocol_ipv6          = metadata_options.value.http_protocol_ipv6
      http_put_response_hop_limit = metadata_options.value.http_put_response_hop_limit
      http_tokens                 = metadata_options.value.http_tokens
      instance_metadata_tags      = metadata_options.value.instance_metadata_tags
    }
  }
```

## 前提知識
- メタデータサービス: EC2 の中から、インスタンスの ID や、IAM ロールの一時的な認証情報を取る場所です。ローカルの特別な IP で公開されています。
- IMDSv1 と IMDSv2: v1 は単純な GET リクエストで情報を返します。v2 は、先に「セッショントークン」を PUT で取得し、それを付けたリクエストにだけ応じます。
- `http_tokens`: `required` なら v2 のトークンが必須、`optional` なら v1 の呼び出しも許します。
- SSRF（サーバーサイドリクエストフォージェリ）: 攻撃者が、サーバーに別の URL へのリクエストを出させる攻撃です。メタデータへの単純な GET が悪用されることがあります。
- `dynamic` と `null`: 指定があるときだけブロックを作る、前に見た書き方です。

## 何をしているか
### 1. 指定があるときだけ、オプションを作る

```hcl:line-numbers=156
    for_each = var.metadata_options != null ? [var.metadata_options] : []
```

`metadata_options` が無ければ、AWS の既定の設定が使われます。指定があれば、このブロックが 1 つ作られ、以下の値が AWS に渡されます。

### 2. トークンの要件を決める

```hcl:line-numbers=159
      http_endpoint               = metadata_options.value.http_endpoint
      http_protocol_ipv6          = metadata_options.value.http_protocol_ipv6
      http_put_response_hop_limit = metadata_options.value.http_put_response_hop_limit
      http_tokens                 = metadata_options.value.http_tokens
```

`http_tokens` を `required` にすると、メタデータへの要求にセッショントークンが必要になります。`http_put_response_hop_limit` は、トークンを返す応答が何段のネットワークを越えられるかを決めます。`1` にすると、コンテナなどの別のネットワーク越しからは取れなくなります。

### 3. メタデータのタグも渡す

`instance_metadata_tags` は、タグの値をメタデータから読めるようにするかの設定です。値は利用者のものをそのまま渡しています。

## ここがすごい
このブロックは、「安全な設定を、利用者が選べる形で書けるようにする」ための、薄い橋渡しです。モジュールが既定値を強制せず、利用者が `http_tokens = "required"` と書けば、強い保護が効きます。

SSRF の攻撃は、アプリの脆弱性を突いて、メタデータへの単純な GET を出させます。IMDSv2 を必須にすると、その単純な要求では認証情報を取れなくなります。つまり、攻撃の手順を 1 段増やせるのです。この設定が、利用者の判断で簡単に切り替えられることに意味があります。

## まとめ
- `http_tokens = "required"` で、メタデータの取得に IMDSv2 のトークンを必須にできます。
- `http_put_response_hop_limit` は、トークンが届く範囲を決める値です。
- 安全な設定を選べる形にしておくと、利用者が必要に応じて強化できます。
