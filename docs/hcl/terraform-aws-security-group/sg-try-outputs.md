---
title: "作られていないリソースの出力を null で返す try"
description: "terraform-aws-security-group の outputs.tf。count が 0 のときに存在しないリソースを参照しても、try で null を返すことで、出力がエラーにならない書き方。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: outputs.tf
lines: [5, 8]
format: 2
function: "output（arn・id・vpc_id）"
difficulty: 1
tags: ["防御的プログラミング", "セキュリティ"]
---

## ひとことで
`output` の値は、`try(aws_security_group.this[0].arn, null)` のように `try` で包まれています。利用者がモジュールを作らない設定にしたとき、`this[0]` が存在しなくても、エラーで止まらずに `null` を返します。

## コード
```hcl:line-numbers=5
output "arn" {
  description = "The ARN of the security group"
  value       = try(aws_security_group.this[0].arn, null)
}
```

## 前提知識
- `output`: モジュールの結果として外へ返す値です。呼び出し側は `module.名前.arn` のように参照します。
- `count`: リソースを 0 個や 1 個にするための仕組みです。`count = 0` だと、`[0]` の要素は存在しません。
- `try(式, 既定値)`: 式がエラーになったときに既定値を返す関数です。
- `description`: 値の説明です。ドキュメントを作るツールが読みます。
- `aws_security_group.this[0].arn`: セキュリティグループの ARN（AWS の一意な名前）です。

## 何をしているか
### 1. 出力のひな形を決める
```hcl:line-numbers=5
output "arn" {
  description = "The ARN of the security group"
  value       = try(aws_security_group.this[0].arn, null)
}
```

`output "arn"` は、`description` で何の値かを説明し、`value` に `try` の式を置いています。`value` の中で `this[0]` を参照していますが、この参照は作成フラグによって存在しないこともあります。そこで `try` が、存在しなかった場合の受け皿になります。

### 2. ほかの出力も同じ形にそろえる
```hcl:line-numbers=15
output "vpc_id" {
  description = "The VPC ID"
  value       = try(aws_security_group.this[0].vpc_id, null)
}
```

`vpc_id` も同じ `try` の書き方です。出力がすべて同じ形になるため、利用者は「作られていないときは `null`」という 1 つの約束を覚えれば済みます。

## ここがすごい
`this[0]` を直接参照すると、リソースが作られていないときに出力の計算が失敗し、`plan` が止まってしまいます。`try` で包むだけで、「無いときは無い」という値を返せるようになるのが、この小さな工夫の効き目です。

また、`null` を返すという選択も読みどころです。空文字ではなく `null` にすると、呼び出し側は「値がない」ことを型の上で判断できます。

## まとめ
- `try` は、存在しないかもしれないリソースの参照を守る道具です。
- 出力の型を `null` でそろえると、呼び出し側が値の有無を判断しやすくなります。
- 同じ書き方を全部の出力に使うと、読み手の負担が減ります。

