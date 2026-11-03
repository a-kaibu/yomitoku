---
title: "変数の値を plan の前に検査する validation"
description: "Cloud Posse の null-label の variable \"context\" に書かれた validation。許可された値以外が来たら、Terraform の実行前にエラーにする仕組み。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: variables.tf
lines: [37, 40]
format: 2
function: "variable（context の validation）"
difficulty: 1
tags: ["防御的プログラミング"]
---

## ひとことで
`validation` ブロックは、変数に入った値をチェックし、条件を満たさなければ Terraform を止めて、利用者に理由を伝えます。このモジュールでは、`label_key_case` に `lower`、`title`、`upper` 以外の値が入ると、エラーとして止まります。

## コード
```hcl:line-numbers=37
  validation {
    condition     = lookup(var.context, "label_key_case", null) == null ? true : contains(["lower", "title", "upper"], var.context["label_key_case"])
    error_message = "Allowed values: `lower`, `title`, `upper`."
  }
```

## 前提知識
- `variable` ブロック: モジュールの入力を定義します。`type` や `default` を書きます。
- `validation` ブロック: 変数の値をチェックする条件を書きます。`condition` が真なら通り、偽ならエラーになります。
- `error_message`: 条件が偽のときに表示される文章です。
- `contains(リスト, 値)`: リストに値があるかを真偽値で返します。
- `lookup(マップ, キー, 既定値)`: マップからキーの値を取り出します。キーが無いときは既定値を返します。

## 何をしているか
### 1. 変数の型と既定値を確認する
```hcl:line-numbers=1
variable "context" {
  type = any
  default = {
```

`variable "context"` は、`type = any` の変数です。つまり、どんな型の値も受け取れます。`default` には、すべての設定を持つオブジェクトの既定値を書いています。このため、`validation` の中で `lookup` を使い、キーがあるかどうかを確かめています。

### 2. 条件式で値をチェックする
```hcl:line-numbers=37
  validation {
    condition     = lookup(var.context, "label_key_case", null) == null ? true : contains(["lower", "title", "upper"], var.context["label_key_case"])
    error_message = "Allowed values: `lower`, `title`, `upper`."
  }
```

`condition` では、まず `lookup(var.context, "label_key_case", null) == null` で、キーが無いか値が `null` かを調べます。その場合は `true` を返して、チェックを通します。値があれば、`contains` で許可された 3 つの値のどれかかを確かめます。最後に `error_message` で、許可される値を利用者に示します。

## ここがすごい
`lookup` の既定値を `null` にして、値がないときにはチェックを通す書き方が、古い設定との互換性を保っています。新しいキーを足しても、既存の利用者の設定は壊れません。

また、`error_message` に許可される値を書いているので、エラーを見た利用者がすぐに直せます。`plan` の段階で止まるため、AWS などに誤った値が送られる前に気づけるのも、防御的な設計の良さです。

## まとめ
- `validation` を使うと、入力の誤りを実行の前に止められます。
- `lookup` と `null` の判定を組み合わせると、キーが無い古い設定も受け入れられます。
- エラーメッセージに許可される値を書くと、利用者がすぐに修正できます。
