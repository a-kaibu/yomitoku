---
title: "templatefile でバックエンドの設定ファイルを作る"
description: "terraform-aws-tfstate-backend が、テンプレートにリージョンやバケット名を渡して、別の Terraform 構成で使うバックエンド設定を作る templatefile の書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [24, 34]
format: 2
function: "locals（terraform_backend_config_content）"
difficulty: 2
tags: ["文字列処理", "イディオム"]
---

## ひとことで
このブロックは、テンプレートファイルに値を埋め込んで、別の Terraform 構成で使うバックエンドの設定（`backend` の内容）を文字列として作ります。作ったものはファイルに書き出され、利用者は他のプロジェクトでそれを読み込んで使えます。

## コード
::: code-group

```hcl:line-numbers=24 [日本語訳]
  terraform_backend_config_content = templatefile(local.terraform_backend_config_template_file, {
    region = data.aws_region.current.region
    # テンプレートの入力に null は渡せないので、null のときは空文字を使う
    bucket = try(aws_s3_bucket.default[0].id, "")

    dynamodb_table = try(aws_dynamodb_table.with_server_side_encryption[0].name, "")
    use_lockfile   = local.s3_state_lock_enabled

    encrypt              = "true"
    role_arn             = var.role_arn == null ? "" : var.role_arn
    profile              = var.profile == null ? "" : var.profile
```

```hcl:line-numbers=24 [原文]
  terraform_backend_config_content = templatefile(local.terraform_backend_config_template_file, {
    region = data.aws_region.current.region
    # Template file inputs cannot be null, so we use empty string if the variable is null
    bucket = try(aws_s3_bucket.default[0].id, "")

    dynamodb_table = try(aws_dynamodb_table.with_server_side_encryption[0].name, "")
    use_lockfile   = local.s3_state_lock_enabled

    encrypt              = "true"
    role_arn             = var.role_arn == null ? "" : var.role_arn
    profile              = var.profile == null ? "" : var.profile
```

:::

## 前提知識
- バックエンド: Terraform の状態（state）を、どこに保存するかを決める設定です。S3 のバケットに保存する設定がよく使われます。
- `templatefile(パス, 変数のマップ)`: テンプレートファイルを読み込み、`${変数名}` の部分を値に置き換えた文字列を返す関数です。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。リソースが作られていないときの参照を守るためによく使われます。
- `aws_s3_bucket.default[0].id`: `count` で作られたバケットの最初の要素の ID です。
- `data.aws_region.current.region`: 現在の AWS のリージョンを読み込んだ値です。
- 三項演算子 `条件 ? 値 : 別の値`: 変数が `null` のとき、空文字に変換する目的で使われます。

## 何をしているか
### 1. テンプレートに渡す値を用意する
```hcl:line-numbers=24
  terraform_backend_config_content = templatefile(local.terraform_backend_config_template_file, {
    region = data.aws_region.current.region
```

`templatefile` の第 2 引数は、テンプレートの中で `${region}` などとして使える値のマップです。リージョンは AWS の現在の設定から読み込まれ、テンプレートにそのまま渡されます。

### 2. null を空文字に変えて渡す
```hcl:line-numbers=26
    # テンプレートの入力に null は渡せないので、null のときは空文字を使う
    bucket = try(aws_s3_bucket.default[0].id, "")
```

テンプレートの入力は `null` を受け取れないので、`try(aws_s3_bucket.default[0].id, "")` のように、無いときは空文字を渡します。コメントにある理由どおり、`null` の値はテンプレートの中の文字列の展開で扱えないため、この書き方が必要です。

### 3. 残りの設定を渡す
```hcl:line-numbers=29
    dynamodb_table = try(aws_dynamodb_table.with_server_side_encryption[0].name, "")
    use_lockfile   = local.s3_state_lock_enabled

    encrypt              = "true"
    role_arn             = var.role_arn == null ? "" : var.role_arn
    profile              = var.profile == null ? "" : var.profile
```

`dynamodb_table` も同じ `try` の書き方で、ロックを使わないときは空文字になります。`use_lockfile` は、S3 のロックファイルを使うかどうかの真偽値を渡します。`role_arn` と `profile` は、`null` のときに空文字に変えています。

## ここがすごい
テンプレートに渡す値をすべて空文字か文字列に揃えておくと、テンプレートの側は条件分岐をほとんど書かずに済みます。どの設定を書くかの判断を Terraform の側に寄せ、ファイルの形はテンプレートに任せる、という役割の分け方になっています。

また、コメントに書かれているように、この変換の理由を書き残しているのも読みどころです。`null` と空文字の違いを知らない読み手でも、なぜ `try` と `== null` の書き方があるのかを理解できます。

## まとめ
- `templatefile` は、テンプレートに値を埋め込んで文字列を作ります。
- テンプレートに渡す値は、`null` を避けて空文字に揃えると扱いやすくなります。
- 生成したファイルを別の構成で使うと、設定を 1 か所で管理できます。

