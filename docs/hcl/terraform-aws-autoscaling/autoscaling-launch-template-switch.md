---
title: "作った起動テンプレートか既存の ID かを、式で切り替える"
description: "terraform-aws-autoscaling の起動テンプレート参照。モジュールが作るか利用者が渡すかで ID とバージョンを選び、名前は coalesce で補う。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [6, 14]
format: 2
function: "locals（launch_template_name・launch_template_id・autoscaling_group_tags）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Auto Scaling グループは、インスタンスの起動方法を「起動テンプレート」で決めます。このモジュールは、テンプレートをモジュールの中で作ることも、利用者が既に持っているものを使うこともできます。このコードは、どちらの場合でも後ろのリソースが同じ名前で ID とバージョンを参照できるように、`locals` でまとめています。

## コード
```hcl:line-numbers=6
  launch_template_name    = coalesce(var.launch_template_name, var.name)
  launch_template_id      = var.create_launch_template ? aws_launch_template.this[0].id : var.launch_template_id
  launch_template_version = var.create_launch_template && var.launch_template_version == null ? aws_launch_template.this[0].latest_version : var.launch_template_version

  autoscaling_group_tags = merge(
    var.tags,
    { "Name" = coalesce(var.instance_name, var.name) },
    var.autoscaling_group_tags,
  )
```

## 前提知識
- Auto Scaling グループ: 同じ設定のインスタンスを、台数を増減させながら管理する仕組みです。
- 起動テンプレート（launch template）: インスタンスの種類、AMI、ネットワークなどの設定をまとめた、再利用できる型です。バージョン番号を持ち、更新するたびに新しいバージョンができます。
- `latest_version`: テンプレートの最新のバージョン番号です。
- 三項演算子 `条件 ? A : B`: 条件が真なら A、偽なら B を使います。
- `coalesce` と `merge`: 空でない最初の値を選ぶ関数と、マップを 1 つにまとめる関数です。

## 何をしているか
### 1. テンプレートの名前は、利用者の指定が無ければ変数の名前を使う

```hcl:line-numbers=6
  launch_template_name    = coalesce(var.launch_template_name, var.name)
```

利用者が `launch_template_name` を省略すると、Auto Scaling グループの名前（`var.name`）がテンプレートの名前になります。どちらも空でない値があれば、それを使います。

### 2. テンプレートの ID を、作ったものか既存のものかで選ぶ

```hcl:line-numbers=7
  launch_template_id      = var.create_launch_template ? aws_launch_template.this[0].id : var.launch_template_id
```

`create_launch_template` が真なら、モジュールが作ったテンプレートの ID を使います。偽なら、利用者が `launch_template_id` で渡した ID をそのまま使います。どちらのときも、後ろのリソースは `local.launch_template_id` を参照すればよいので、書き方が 1 通りになります。

### 3. バージョンは、利用者が指定しなければ最新を使う

```hcl:line-numbers=8
  launch_template_version = var.create_launch_template && var.launch_template_version == null ? aws_launch_template.this[0].latest_version : var.launch_template_version
```

テンプレートを作り、かつ利用者がバージョンを指定していないときだけ、作ったテンプレートの最新バージョンを使います。利用者が指定していれば、それを優先します。

### 4. タグを、後ろのものが勝つように重ねる

```hcl:line-numbers=10
  autoscaling_group_tags = merge(
    var.tags,
    { "Name" = coalesce(var.instance_name, var.name) },
    var.autoscaling_group_tags,
  )
```

`merge` は後ろのマップを優先します。そのため、`Name` タグは既定で名前から作られますが、利用者が `autoscaling_group_tags` に `Name` を書けば、その値で上書きされます。

## ここがすごい
「作る」と「既存を使う」の分岐を、3 つの `locals` の式にまとめて、後ろのリソースから見て 1 つの参照にしている点がよい設計です。分岐をリソースの中に散らすと、読み手は 3 か所を追う必要がありますが、ここでは `locals` を見れば十分です。

また、バージョンの扱いに注目すると、利用者の指定を最優先にしている点が大切です。テンプレートを作り直すと新しいバージョンが増えますが、利用者が固定のバージョンを指定していれば、その値で動き続けます。自動の最新と、手動の固定を、同じ式の中で両立させています。

## まとめ
- 「作る」か「既存を使う」かの分岐は、`locals` の三項演算子 1 つにまとめると読みやすくなります。
- `coalesce` は既定値の指定に向いていて、利用者が空のままにしたときの代わりになります。
- `merge` の順番で、既定の値と利用者の上書きを分けられます。
