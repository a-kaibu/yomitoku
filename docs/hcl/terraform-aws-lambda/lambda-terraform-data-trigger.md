---
title: "terraform_data の triggers_replace で、ファイル名の変化を検知する"
description: "terraform-aws-lambda の terraform_data。パッケージのファイル名を triggers_replace に渡し、名前が変わったときだけリソースを作り直す、ハッシュ計算のための仕組み。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [29, 39]
format: 2
function: "resource \"terraform_data\"（package_filename_for_hash）"
difficulty: 2
tags: ["設計パターン", "API設計"]
---

## ひとことで
`terraform_data` は、何もしないが、値の変化で作り直しを起こせる Terraform の組み込みのリソースです。このブロックは、Lambda のパッケージのファイル名を入れておき、ファイル名が変わったときに、ハッシュの計算をやり直すきっかけにします。

## コード
```hcl:line-numbers=29
resource "terraform_data" "package_filename_for_hash" {
  count = var.ignore_source_code_hash ? 0 : 1

  input = {
    filename = local.filename
  }

  triggers_replace = [local.filename]

  depends_on = [null_resource.archive]
}
```

## 前提知識
- `terraform_data`: 外部のサービスを作らず、入力の値を Terraform の状態として持つリソースです。値の変化を、ほかのリソースの作り直しの合図として使えます。
- `triggers_replace`: この値が変わったときに、リソースを作り直します。一覧を渡すと、どれかが変わったときに作り直されます。
- `input`: リソースに保存しておきたい値です。ここでは `filename` を入れています。
- `count = 条件 ? 0 : 1`: 条件が真のときは作らず、偽のときだけ 1 個作る、という書き方です。
- `depends_on`: 他のリソースの作成後に作るための順番指定です。

## 何をしているか
### 1. 作るかどうかを決める
```hcl:line-numbers=30
  count = var.ignore_source_code_hash ? 0 : 1
```

`var.ignore_source_code_hash` が真なら、ハッシュの計算を使わないので 0 個にします。偽のときだけ、1 個作ります。条件の向きが反対になっている点が、読みどころです。

### 2. 値を保存する
```hcl:line-numbers=32
  input = {
    filename = local.filename
  }
```

`input` に、ファイル名を入れています。この値は、Terraform の状態に残ります。どのファイルをもとにしたかを、後から確かめられます。

### 3. 変化で作り直す
```hcl:line-numbers=36
  triggers_replace = [local.filename]

  depends_on = [null_resource.archive]
```

`triggers_replace = [local.filename]` は、ファイル名が変わったときに、このリソースを作り直す合図になります。ファイル名が同じなら、作り直しは起きません。`depends_on` によって、アーカイブを作る処理の後に、この値を計算します。

## ここがすごい
ファイルの中身を毎回読むと、大きなパッケージでは時間がかかります。`terraform_data` の作り直しを、ファイル名の変化に限ると、必要なときだけ計算し直せます。何を合図にするかを、1 行の一覧で明示できる点が、この書き方の良さです。

また、`count` の条件を「ハッシュを使わないなら作らない」と書いているので、利用者が設定を切り替えても、このリソースの有無だけで済みます。

## まとめ
- `terraform_data` は、値の変化を合図にしたい場面で便利です。
- `triggers_replace` の一覧で、作り直しの条件を明示できます。
- `count` の条件は、設定の向きが反対になることがあるので、読むときに注意します。

