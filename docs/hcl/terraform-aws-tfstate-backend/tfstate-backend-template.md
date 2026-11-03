---
title: "テンプレートの if で、バックエンド設定の行を出し分ける"
description: "terraform-aws-tfstate-backend の terraform.tf.tpl。%{ if } の指示子と ~ の空白除去を使って、role_arn や dynamodb_table がある場合だけ行を出す、テンプレートの書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: templates/terraform.tf.tpl
lines: [1, 26]
format: 2
function: "テンプレート（terraform.tf.tpl）"
difficulty: 2
tags: ["文字列処理", "メタプログラミング"]
---

## ひとことで
このファイルは、`templatefile` で値を埋め込まれる、バックエンド設定のひな形です。`${...}` の部分に値が入り、`%{ if ... }` の指示子で、条件に合うときだけ行を出します。出来上がったファイルは、別の Terraform の構成が読み込むバックエンドの設定になります。

## コード
```hcl:line-numbers=1
terraform {
  required_version = ">= ${terraform_version}"

  backend "s3" {
    region  = "${region}"
    bucket  = "${bucket}"
    key     = "${terraform_state_file}"
    profile = "${profile}"
    encrypt = "${encrypt}"
    %{~ if role_arn != "" ~}

    assume_role {
      role_arn = "${role_arn}"
    }
    %{~ endif ~}
    %{~ if use_lockfile ~}

    use_lockfile = true
    %{~ else ~}
    %{~ if dynamodb_table != "" ~}

    dynamodb_table = "${dynamodb_table}"
    %{~ endif ~}
    %{~ endif ~}
  }
}
```

## 前提知識
- テンプレート: `${変数}` を値に置き換え、`%{ }` の中に制御文を書けるファイルです。Terraform の `templatefile` 関数で読み込みます。
- `${変数名}`: 渡された値で置き換えられます。
- `%{ if 条件 }` ... `%{ else }` ... `%{ endif }`: 条件によって、テキストを出す・出さないを決めます。
- `~`（チルダ）: 指示子の前後の改行と空白を取り除く記号です。`%{~ if ...}` のように、指示子の側に付けます。
- `backend "s3"`: Terraform の状態を S3 に保存する設定です。
- `role_arn` や `dynamodb_table` は、`tfstate-templatefile-config` の記事で見た `templatefile` の引数として渡されます。

## 何をしているか
### 1. 必須の項目を埋め込む
```hcl:line-numbers=2
  required_version = ">= ${terraform_version}"

  backend "s3" {
    region  = "${region}"
    bucket  = "${bucket}"
    key     = "${terraform_state_file}"
    profile = "${profile}"
    encrypt = "${encrypt}"
```

`required_version`、`region`、`bucket`、`key`、`profile`、`encrypt` は、`${...}` で値を埋め込みます。どの項目も、前の記事 `tfstate-templatefile-config` で作った値を受け取ります。

### 2. 役割の指定があるときだけ、ブロックを出す
```hcl:line-numbers=10
    %{~ if role_arn != "" ~}

    assume_role {
      role_arn = "${role_arn}"
    }
    %{~ endif ~}
```

`%{~ if role_arn != "" ~}` は、`role_arn` が空でないときだけ、`assume_role` のブロックを出します。`~` があるので、指示子の行の改行や空白が取り除かれ、出来上がるファイルの見た目が整います。

### 3. ロックの方法を選ぶ
```hcl:line-numbers=16
    %{~ if use_lockfile ~}

    use_lockfile = true
    %{~ else ~}
    %{~ if dynamodb_table != "" ~}

    dynamodb_table = "${dynamodb_table}"
    %{~ endif ~}
    %{~ endif ~}
```

`use_lockfile` が真なら、S3 のロックファイルを使う設定を書きます。偽なら、`dynamodb_table` があるときだけ、その名前を書きます。`if` の中に `if` を入れて、2 つのロック方法を切り替えています。

## ここがすごい
テンプレートの中で条件を書けるので、Terraform の `dynamic` ブロックを使わずに、ファイルの形そのものを条件で変えられます。出力されるのは、普通の HCL のファイルなので、利用者はそれをそのまま読めます。

また、`~` によって、条件のための行が余白として残りません。ファイルを人が読むことを考えて、出力の見た目まで設計されている点が、読みどころです。

## まとめ
- `${}` は値の埋め込み、`%{ if }` は条件付きの出力に使います。
- `~` を付けると、指示子の前後の空白を取り除けます。
- 出来上がるファイルが普通の設定になるので、利用者がそのまま使えます。

