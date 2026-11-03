---
title: "ログの ARN から、末尾の :* を取り除く"
description: "terraform-aws-step-functions の log_group_arn。データソースと資源で ARN の末尾の表記が違うため、trimsuffix で \":*\" を取り除いてそろえる。"
language: hcl
project: "terraform-aws-step-functions"
repo: https://github.com/terraform-aws-modules/terraform-aws-step-functions
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "16c7a1ffaa72643d714a7b3924216edce9413482"
file: main.tf
lines: [10, 10]
format: 2
function: "locals（log_group_arn と trimsuffix）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
CloudWatch Logs のロググループの ARN には、末尾に `:*` が付くことがあります。このモジュールは、データソースから読んだ ARN と、作成した資源の ARN で、その表記が違うことに気づいて、末尾を揃えています。`trimsuffix` は、末尾の決まった文字列だけを取り除く関数です。

## コード
```hcl:line-numbers=10
  log_group_arn = trimsuffix(try(data.aws_cloudwatch_log_group.sfn[0].arn, aws_cloudwatch_log_group.sfn[0].arn, ""), ":*")
```

## 前提知識
- ARN の `:*`: ロググループの ARN の末尾に付くことがある、ワイルドカードの表記です。
- `trimsuffix(文字列, 接尾辞)`: 文字列の末尾が接尾辞と一致すれば、それを取り除きます。一致しなければ、そのまま返します。
- `try(式1, 式2, 既定値)`: 式を順に試し、最初に成功した値を返します。

## 何をしているか
### 1. 既存のロググループか、作成したものかを選ぶ

```hcl:line-numbers=10
  log_group_arn = trimsuffix(try(data.aws_cloudwatch_log_group.sfn[0].arn, aws_cloudwatch_log_group.sfn[0].arn, ""), ":*")
```

`try` は、まずデータソースの ARN を試し、それが無ければ作成した資源の ARN を使い、どちらも無ければ空文字を返します。

### 2. 末尾の :* を取り除く

`trimsuffix` は、その ARN の末尾に `:*` があれば取り除きます。無ければ、そのまま返します。どちらの表記が来ても、同じ形の ARN になります。

## ここがすごい
「表記が揃っていなければ、揃える」を、末尾の一文字列だけを対象にする関数で書いています。`replace` で全体を置き換えるより、影響する範囲が明確です。

## まとめ
- データソースと資源で表記が違うときは、比較や利用の前に揃えます。
- `trimsuffix` は、末尾だけを対象にするので安全です。
- 候補の順番を `try` で並べると、既存と新規の両方に対応できます。
