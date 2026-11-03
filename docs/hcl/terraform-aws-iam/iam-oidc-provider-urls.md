---
title: "OIDC の URL から https:// を外し、プロバイダー名にする"
description: "terraform-aws-iam の iam-role。利用者が渡す OIDC プロバイダーの URL のリストから、https:// を取り除き、IAM の条件で使う名前の一覧を作る for 式。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-role/main.tf
lines: [8, 14]
format: 2
function: "locals（oidc_providers・bitbucket_provider）"
difficulty: 2
tags: ["文字列処理", "イディオム"]
---

## ひとことで
`terraform-aws-iam` の IAM ロールモジュールは、OIDC（OpenID Connect）のプロバイダーを、URL で受け取ります。このブロックでは、その URL から先頭の `https://` を取り除いて、IAM の信頼ポリシーの条件に使える名前に変えます。

## コード
```hcl:line-numbers=8
locals {
  account_id = try(data.aws_caller_identity.current[0].account_id, "")
  partition  = try(data.aws_partition.current[0].partition, "")

  oidc_providers     = [for url in var.oidc_provider_urls : replace(url, "https://", "")]
  bitbucket_provider = try(element(local.oidc_providers, 0), null)
}
```

## 前提知識
- OIDC プロバイダー: GitHub Actions や Kubernetes など、外部の ID を認証に使うときの発行元です。IAM では URL の形ではなく、`プロバイダーのホスト名` で指定されることがあります。
- `for 式`: `[for url in リスト : 式]` で、リストの各要素を変換して新しいリストを作ります。
- `replace(文字列, 検索する文字, 置き換え後)`: 文字列の中の文字を置き換えます。ここでは `https://` を空にしています。
- `element(リスト, 番号)`: 番号で要素を取り出します。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。
- `data "aws_caller_identity"`: 現在の AWS アカウントの情報を読み込むデータソースです。

## 何をしているか
### 1. URL を名前に変える
```hcl:line-numbers=12
  oidc_providers     = [for url in var.oidc_provider_urls : replace(url, "https://", "")]
```

`[for url in var.oidc_provider_urls : replace(url, "https://", "")]` は、利用者が渡した URL の一覧を 1 件ずつ取り出し、`https://` を空に置き換えます。結果は、`token.actions.githubusercontent.com` のようなホスト名だけの一覧です。このホスト名は、IAM の条件で `プロバイダー:sub` のような形で使われます。

### 2. 先頭のプロバイダーを取り出す
```hcl:line-numbers=13
  bitbucket_provider = try(element(local.oidc_providers, 0), null)
```

`element(local.oidc_providers, 0)` は、先頭のプロバイダー名を取り出します。一覧が空のときは `element` がエラーになるので、`try` で包んで `null` を返しています。Bitbucket の設定では、先頭の 1 つだけを使う、という前提を表しています。

## ここがすごい
`replace` で文字列を整えておくと、利用者は `https://` を付けた URL をそのままコピーして書けます。モジュールの中で形を変えるので、利用者の入力の癖を吸収できます。

また、`bitbucket_provider` を `try` で守っているため、OIDC を使わない構成でも、このローカル値がエラーの原因になりません。使う時だけ値が入り、使わない時は `null` で済むという設計です。

## まとめ
- `for` 式と `replace` を組み合わせると、URL の形から名前の形へ、一度に変換できます。
- 空の一覧に対する `element` は `try` で守ると、使わない機能がエラーを出さなくなります。
- 利用者が書きやすい形と、内部で使いやすい形を分けると、設定の見通しが良くなります。

