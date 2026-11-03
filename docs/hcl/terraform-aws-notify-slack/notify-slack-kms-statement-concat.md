---
title: "条件付きの権限文を、concat で後ろに足す"
description: "terraform-aws-notify-slack の Lambda 用ポリシー。基本の文の後ろに、KMS 鍵を指定したときだけ作る文を concat で連結する。"
language: hcl
project: "terraform-aws-notify-slack"
repo: https://github.com/terraform-aws-modules/terraform-aws-notify-slack
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a7765ac0a547f95c8aa48459f84077be8562c0f7"
file: main.tf
lines: [43, 44]
format: 2
function: "data \"aws_iam_policy_document\"（lambda・dynamic \"statement\"）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
Slack に通知する Lambda には、読み書きするための IAM の権限が必要です。その権限の文は、基本のものと、KMS 鍵を使うときに必要なものに分かれます。このコードは、KMS 鍵の指定があるときだけ追加の文を、`concat` で基本の文の後ろに足します。

## コード
```hcl:line-numbers=43
    for_each = concat([local.lambda_policy_document,
    local.lambda_policy_document_securityhub], var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : [])
```

## 前提知識
- IAM ポリシーの文（statement）: 「どの操作を、どの資源に、誰が許可するか」を書いた 1 つの単位です。
- KMS 鍵: 暗号化に使う鍵です。Lambda が暗号化された環境変数を読むには、この鍵を復号する権限が要ります。
- `concat(A, B)`: 2 つのリストを前後につなげた、新しいリストを作ります。
- `var.kms_key_arn != ""`: 鍵の指定があるかを、空文字と比べて判定します。
- `dynamic "statement"`: リストの要素の数だけ、`statement` のブロックを作ります。

## 何をしているか
### 1. 基本の文を、リストの先頭に置く

```hcl:line-numbers=43
    for_each = concat([local.lambda_policy_document,
    local.lambda_policy_document_securityhub], var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : [])
```

`concat` の最初のリストには、常に使う 2 つの文が入ります。Lambda のログ出力と、Security Hub への通知の権限です。これらは、どの利用者でも必要です。

### 2. KMS の文は、指定があるときだけ後ろに足す

`var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : []` が、2 番目のリストです。鍵の ARN が空文字でなければ、KMS の文を 1 つ含むリストになります。空なら、空のリストです。`concat` はそれを後ろにつなげるので、鍵を使わない利用者は、余計な権限を持ちません。

### 3. 結果を、dynamic で 1 つずつ文にする

`for_each` の結果は、文の本体のリストです。`dynamic "statement"` が、その要素ごとに文を作ります。`statement.value.sid` のように、要素の値を使って文を組み立てます。

## ここがすごい
「常に必要な権限」と「条件付きの権限」を、リストの連結だけで分けています。条件の式は 1 か所で、どの文がいつ付くかが読み取れます。

また、鍵を使わないときに、余計な文を含めないという判断が、最小権限の原則に沿っています。権限を足すのは簡単ですが、使わない権限を消しておくことで、ポリシーの読みやすさも保てています。

## まとめ
- `concat` で、常に使うものと条件付きのものを分けて連結できます。
- 空のリストを条件の結果にすると、足さないという意味になります。
- 条件付きの権限は、使う時だけ付ける方が、安全で読みやすくなります。
