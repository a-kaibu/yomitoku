---
title: "IAM ロールの名前を、指定か既定の名前から決める"
description: "terraform-aws-ec2-instance の iam_role_name。利用者が名前を指定すればそれを使い、無ければインスタンスの名前を使う。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [711, 711]
format: 2
function: "locals（iam_role_name の coalesce）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
IAM ロールには名前を付けますが、利用者が毎回名前を書くのは面倒です。このモジュールは、名前の指定が無ければ、インスタンスの名前をそのまま使います。`coalesce` で、既定の名前を一行で補っています。

## コード
```hcl:line-numbers=711
  iam_role_name = try(coalesce(var.iam_role_name, var.name), "")
```

## 前提知識
- `coalesce(値1, 値2)`: 最初に `null` でも空文字でもない値を返します。
- `try(式, 既定値)`: 式がエラーなら既定値を返します。
- ローカル値（`locals`）: モジュールの中で、名前を付けて使う値です。

## 何をしているか
### 1. 指定があれば、それを使う

```hcl:line-numbers=711
  iam_role_name = try(coalesce(var.iam_role_name, var.name), "")
```

`var.iam_role_name` に値があれば、`coalesce` はその値を返します。利用者が、いつも通りの名前を選べます。この行は、指定の有無にかかわらず一つの式で決まるので、別の場所で名前を組み立てる必要がありません。

### 2. 無ければ、インスタンスの名前を使う

指定が空なら、`var.name` の値がそのまま使われます。`try` は、ここまで来てもエラーになった場合に空文字を返します。`name` の既定値は空文字なので、名前を指定しなければ、ロールの名前も空文字になります。

## ここがすごい
「指定が優先、無ければ既定」という規則を、分岐を書かずに表しています。名前の補い方を一か所で決めるので、ほかの資源の名前も同じ考え方でそろえられます。

## まとめ
- `coalesce` は、既定値を補う書き方として短く書けます。
- 名前の既定値を用意すると、利用者の入力が少なくて済みます。
- 補う順番を一か所にまとめると、資源どうしの名前が一貫します。
