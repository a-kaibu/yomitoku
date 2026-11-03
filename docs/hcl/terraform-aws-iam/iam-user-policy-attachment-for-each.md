---
title: "利用者のポリシー一覧を for_each で 1 件ずつ付ける"
description: "terraform-aws-iam の iam-user。map を for 式で絞り込み、作成フラグが真のときだけ、ユーザーに管理ポリシーを 1 件ずつ付けるリソース。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-user/main.tf
lines: [16, 21]
format: 2
function: "resource \"aws_iam_user_policy_attachment\"（additional）"
difficulty: 1
tags: ["データ構造", "API設計"]
---

## ひとことで
IAM ユーザーに AWS の管理ポリシーを付けるリソースです。利用者が渡したポリシーの一覧を `for_each` で 1 件ずつ作るので、キーの名前で管理されます。ポリシーの追加や削除が、ほかのポリシーの作り直しに影響しません。

## コード
```hcl:line-numbers=16
resource "aws_iam_user_policy_attachment" "additional" {
  for_each = { for k, v in var.policies : k => v if var.create }

  user       = aws_iam_user.this[0].name
  policy_arn = each.value
}
```

## 前提知識
- IAM ユーザー: AWS のアカウントの中で、人やアプリが使う主体です。
- ポリシー: 何をしてよいかを決める文書（JSON）です。管理ポリシーは、AWS や利用者が作って、複数の主体に付けられます。
- `for_each = { for k, v in マップ : k => v if 条件 }`: マップを条件で絞り込み、その要素ごとにリソースを作ります。
- `each.value`: 今の要素の値です。ここではポリシーの ARN（AWS の一意な名前）です。
- `aws_iam_user.this[0].name`: `count` で作ったユーザーの名前です。

## 何をしているか
### 1. 作成フラグで絞り込む
```hcl:line-numbers=17
  for_each = { for k, v in var.policies : k => v if var.create }
```

`{ for k, v in var.policies : k => v if var.create }` は、利用者のポリシーのマップを読み、`var.create` が真のときだけ、そのまま残します。偽なら空のマップになり、ポリシーの付与は 1 つも作られません。

### 2. ユーザーとポリシーを結びつける
```hcl:line-numbers=19
  user       = aws_iam_user.this[0].name
  policy_arn = each.value
```

`user` には、このモジュールが作ったユーザーの名前を、`policy_arn` には `each.value` の ARN を入れます。キーは利用者が付けた名前なので、ポリシーを後から足すと、新しい付与だけが作られます。

## ここがすごい
`count` で並べると、途中のポリシーを消したときに番号がずれ、ほかのポリシーの付け直しが起きることがあります。`for_each` でキーを使うと、そのようなずれが起きません。

また、作成フラグを `for` 式の `if` に入れているため、リソースの `count` を使わずに、「作らないとき 0 件」を表せています。短い書き方ですが、無効化の仕組みを 1 か所にまとめる定番の形です。

利用者は、ポリシーの一覧に ARN を足すだけで、新しい付与を作れます。作成フラグを `if` で一度に判定するので、モジュール全体を作らない場合も、この 1 行の条件で 0 件になります。

## まとめ
- `for_each` にマップを渡すと、キーごとにリソースを作れます。
- 作成フラグを `for` 式の `if` に書くと、無効化の判定が 1 行で済みます。
- キーに意味のある名前を使うと、変更の影響を小さくできます。

