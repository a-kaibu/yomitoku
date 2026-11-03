---
title: "サブネットの名前を、指定が無ければ既定の形式で作る"
description: "terraform-aws-vpc の公開サブネットのタグ Name。names の指定があればそれを使い、無ければ format で「名前・接尾辞・AZ」の形式を作る。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [165, 168]
format: 2
function: "resource \"aws_subnet\"（try と format による Name タグ）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
サブネットには、`Name` というタグを付けます。利用者が名前の一覧を指定すれば、その名前を使い、指定が無ければこのモジュールが決めた形式で名前を作ります。`try` が、その二つの候補を順に試します。

## コード
```hcl:line-numbers=165
      Name = try(
        var.public_subnet_names[count.index],
        format("${var.name}-${var.public_subnet_suffix}-%s", element(var.azs, count.index))
      )
```

## 前提知識
- `try(候補1, 候補2)`: 候補1がエラーになったら候補2を返します。
- `format("...%s", 値)`: `%s` の位置に値を入れて、文字列を作ります。
- `${...}` の埋め込み: 文字列の中に変数の値を入れます。

## 何をしているか
### 1. 名前の一覧から、この番号の名前を取り出す

```hcl:line-numbers=166
        var.public_subnet_names[count.index],
```

`var.public_subnet_names[count.index]` は、利用者が指定した名前の一覧から、この資源の番号の名前を取り出します。一覧の長さが足りなければ、エラーになります。

### 2. 足りなければ、形式に従って名前を作る

```hcl:line-numbers=167
        format("${var.name}-${var.public_subnet_suffix}-%s", element(var.azs, count.index))
```

エラーになったら、`format` が名前を作ります。モジュールの名前、接尾辞、AZ を組み合わせた形です。

## ここがすごい
指定された名前と、自動の名前を、同じ `try` の中で切り替えています。利用者は、全部を指定しても、一部だけ指定しても、動きます。

## まとめ
- 候補を `try` に並べると、指定と既定の優先順位を表せます。
- `format` で、既定の名前の形式を一か所に決められます。
- 一覧で指定する値は、番号で取り出すときの長さに注意すると安全です。
