---
title: "AZ の指定が名前か ID かで、属性を振り分ける"
description: "terraform-aws-vpc の公開サブネット。AZ の値が ap-northeast-1a のような名前なら availability_zone に、use1-az1 のような ID なら availability_zone_id に入れる。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [151, 152]
format: 2
function: "resource \"aws_subnet\"（regexall による AZ の振り分け）"
difficulty: 3
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
サブネットの AZ は、名前（`ap-northeast-1a` のような形）でも、ID（`apne1-az4` のような形）でも指定できます。AWS のリソースでは、名前用と ID 用で属性が別々です。このコードは、値の形を正規表現で調べて、どちらの属性に入れるかを決めています。

## コード
```hcl:line-numbers=151
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
```

## 前提知識
- AZ の名前と ID: 名前は `リージョン` に `a` などを付けた形、ID はアカウントごとに振り直されない固定の形です。
- `regexall(パターン, 文字列)`: パターンに一致した部分の一覧を返します。一致しなければ空のリストです。
- `length(...) > 0`: 一致があるかどうかの判定です。

## 何をしているか
### 1. 名前の形に一致するかを調べる

```hcl:line-numbers=151
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
```

`^[a-z]+-` は、先頭が英字の並びとハイフンで始まる形です。名前の形なら、`regexall` の結果が空でなくなるので、`availability_zone` に値が入ります。

### 2. 名前でなければ、ID として扱う

```hcl:line-numbers=152
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
```

一致しない（ID の形の）値は、`availability_zone_id` に入ります。どちらか一方だけに値が入り、もう一方は `null` になります。

## ここがすごい
同じ入力を二つの属性に振り分けるので、利用者は名前か ID かを気にせずに書けます。正規表現の判定を、二つの式で正反対にしているので、どちらにも必ず一つだけ値が入ります。

## まとめ
- `regexall` の結果が空かどうかで、形の判定ができます。
- 排他的な属性は、正反対の条件で一方ずつに値を入れると、取りこぼしがありません。
- 入力の形式が複数ある場合は、形を調べてから振り分けると、利用者の負担が減ります。
