---
title: "AZ あたりの数を、新しい変数と古い変数から補う"
description: "terraform-aws-dynamic-subnets の public_subnets_per_az_count。新しい変数が指定されていなければ、古い共通の変数 subnets_per_az_count を使う。"
language: hcl
project: "terraform-aws-dynamic-subnets"
repo: https://github.com/cloudposse/terraform-aws-dynamic-subnets
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "ab53498a69d8a48b0c454482ffbbd112c29d450a"
file: main.tf
lines: [71, 72]
format: 2
function: "locals（coalesce による変数の互換の補完）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
このモジュールでは、公開と非公開のサブネットに、それぞれ AZ あたりの数を指定できます。以前からあった共通の変数は、今も使えるように残されています。このコードは、新しい変数が指定されていればそれを使い、無ければ古い変数を使います。

## コード
```hcl:line-numbers=71
  public_subnets_per_az_count  = coalesce(var.public_subnets_per_az_count, var.subnets_per_az_count)
  private_subnets_per_az_count = coalesce(var.private_subnets_per_az_count, var.subnets_per_az_count)
```

## 前提知識
- `coalesce(値1, 値2)`: 最初に `null` でも空でもない値を返します。
- 変数の互換: 古い変数を残しつつ、新しい変数を追加する設計です。利用者が少しずつ移行できます。
- `locals`: モジュールの中で使う、名前付きの値です。

## 何をしているか
### 1. 公開サブネットの数を決める

```hcl:line-numbers=71
  public_subnets_per_az_count  = coalesce(var.public_subnets_per_az_count, var.subnets_per_az_count)
```

`public_subnets_per_az_count` が指定されていれば、その値を使います。指定が無ければ、共通の `subnets_per_az_count` を使います。

### 2. 非公開サブネットも同じ規則で決める

```hcl:line-numbers=72
  private_subnets_per_az_count = coalesce(var.private_subnets_per_az_count, var.subnets_per_az_count)
```

非公開サブネットの数も、同じ規則です。公開と非公開を別々に指定しても、共通の値だけで指定しても、どちらも動きます。

## ここがすごい
新しい変数と古い変数の両方を、同じ `coalesce` の一行で扱っています。利用者は、どちらの書き方を選んでも、結果を同じように受け取れます。

## まとめ
- `coalesce` は、新旧の変数を移行させるときの定番の書き方です。
- 新しい変数を優先し、古い変数を既定にすると、既存の利用者を壊しません。
- 同じ規則を並べると、公開と非公開の挙動がそろいます。
