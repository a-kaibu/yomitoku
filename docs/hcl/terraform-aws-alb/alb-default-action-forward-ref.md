---
title: "転送先を、ターゲットグループのキーか ARN で選ぶ try"
description: "terraform-aws-alb のリスナー。forward の転送先に、このモジュールが作ったターゲットグループのキーか、利用者が直接渡した ARN のどちらかを try で選ぶ書き方。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [214, 222]
format: 2
function: "resource \"aws_lb_listener\"（dynamic \"default_action\"・forward）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
リスナーの既定の動作を、「指定したターゲットグループへ転送する」にするための `dynamic` ブロックです。転送先は、このモジュールが作ったターゲットグループのキーで指定することも、既存のターゲットグループの ARN を直接渡すこともできます。その切り替えを `try` で行っています。

## コード
```hcl:line-numbers=214
  dynamic "default_action" {
    for_each = each.value.forward != null ? [each.value.forward] : []

    content {
      order            = each.value.order
      target_group_arn = try(aws_lb_target_group.this[default_action.value.target_group_key].arn, default_action.value.target_group_arn)
      type             = "forward"
    }
  }
```

## 前提知識
- `default_action`: リスナーがリクエストを受けたときの動作です。`forward` は転送、`redirect` は別の URL への転送、`fixed-response` は固定の応答です。
- ターゲットグループ: ロードバランサーが転送先として使う、サーバーの集まりです。
- `aws_lb_target_group.this[キー]`: `for_each` で作ったターゲットグループを、キーで引く書き方です。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。キーが存在しないときは、既存の ARN を使うことになります。
- `order`: 複数のアクションがあるときの順番です。

## 何をしているか
### 1. forward があるときだけ作る
```hcl:line-numbers=214
  dynamic "default_action" {
    for_each = each.value.forward != null ? [each.value.forward] : []
```

`dynamic "default_action"` は、`each.value.forward` が `null` でないときだけ、1 件作ります。他の種類の動作を選んだ場合は、このブロックは作られません。

### 2. 転送先を選ぶ
```hcl:line-numbers=219
      target_group_arn = try(aws_lb_target_group.this[default_action.value.target_group_key].arn, default_action.value.target_group_arn)
```

`try(aws_lb_target_group.this[default_action.value.target_group_key].arn, default_action.value.target_group_arn)` は、まず、キーで引いた自分のターゲットグループの ARN を試します。そのキーが無ければ（もしくは作られていなければ）、利用者が渡した `target_group_arn` を使います。

### 3. 種類を書く
```hcl:line-numbers=218
      order            = each.value.order
      target_group_arn = try(aws_lb_target_group.this[default_action.value.target_group_key].arn, default_action.value.target_group_arn)
      type             = "forward"
```

`order` と `type = "forward"` は、どの種類の動作かを表します。転送先の ARN だけが、キーと直接の ARN のどちらから来たかで変わります。

## ここがすごい
同じ項目に、2 つの供給元を `try` で並べているので、利用者は「モジュールで作ったもの」と「既存のもの」を、同じ設定の書き方で選べます。どちらを使うかの判定を、リソースの定義の中に閉じ込めています。

また、`try` の引数の順番が優先順位になっています。作られたターゲットグループが優先され、そうでなければ既存の ARN が使われる、という読み方が、式の形からそのまま分かります。

## まとめ
- `try` の引数の順番で、供給元の優先順位を表せます。
- `dynamic` で、動作の種類ごとにブロックを作り分けられます。
- キーと ARN の両方を受け入れると、利用者は既存の構成にも組み込めます。

