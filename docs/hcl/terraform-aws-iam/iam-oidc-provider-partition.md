---
title: "partition の DNS サフィックスを try で安全に取り出す"
description: "terraform-aws-iam の iam-oidc-provider。aws_partition データソースから DNS サフィックスを取り出すとき、作らない場合でもエラーにならない try と count の書き方。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-oidc-provider/main.tf
lines: [1, 7]
format: 2
function: "data \"aws_partition\" / locals（dns_suffix）"
difficulty: 1
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
この部分は、AWS のパーティション（通常の AWS、中国リージョン、GovCloud などの区分）を読み込み、その DNS サフィックスを `local.dns_suffix` として取り出します。モジュールを作らないときは、その値が空文字になるように `try` で守っています。

## コード
```hcl:line-numbers=1
data "aws_partition" "current" {
  count = var.create ? 1 : 0
}

locals {
  dns_suffix = try(data.aws_partition.current[0].dns_suffix, "")
}
```

## 前提知識
- パーティション: AWS の世界を区分けしたものです。通常の AWS は `aws`、中国は `aws-cn`、GovCloud は `aws-us-gov` のような名前を持ちます。
- `data "aws_partition"`: 現在のパーティションの情報を読み込むデータソースです。`dns_suffix` 属性は、そのパーティションのドメイン名の接尾辞です（例: `amazonaws.com`）。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ、データソースを 1 つ読みます。
- `[0]`: `count` で作られた 1 つ目の要素を指します。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。

## 何をしているか
### 1. 作るときだけ読み込む
```hcl:line-numbers=1
data "aws_partition" "current" {
  count = var.create ? 1 : 0
}
```

`count = var.create ? 1 : 0` で、モジュールを作るときだけパーティションを読みます。作らないときは、読み込みそのものが行われません。

### 2. DNS サフィックスを取り出す
```hcl:line-numbers=6
  dns_suffix = try(data.aws_partition.current[0].dns_suffix, "")
```

`try(data.aws_partition.current[0].dns_suffix, "")` は、読み込みが無ければ空文字を返します。`[0]` の要素が存在しないときのエラーを、`try` が受け止める形です。

## ここがすごい
`count` で読み込みを止めても、その値を参照する式は残ります。その参照を `try` で包むことで、「作らない」設定でも `plan` が止まりません。読み込みと参照の両方の条件を、ひと組にして守っています。

また、空文字を既定値にしているので、後で `sts.${local.dns_suffix}` のような式を作っても、文字列としてそのまま扱えます。`null` ではなく空文字にすることで、後続の式が型のエラーで止まりにくくなっています。

さらに、パーティションを読む処理が 1 か所にまとまっているため、中国リージョンや GovCloud のような別のパーティションでも、同じ書き方で DNS サフィックスを扱えます。読み手は、サフィックスがどこから来たのかを、この数行で追えます。

## まとめ
- `count` で読み込みを条件付きにできます。
- 読み込み結果の参照は、`try` で守ると安全です。
- 既定の値を空文字にすると、後続の文字列の式が簡単になります。

