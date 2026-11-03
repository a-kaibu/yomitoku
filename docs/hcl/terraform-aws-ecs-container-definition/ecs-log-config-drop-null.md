---
title: "設定の中の null の項目だけを、for 式で取り除く"
description: "terraform-aws-ecs-container-definition のログ設定。値が null の項目を for 式の if で落としてから JSON にし、コンテナ定義に null を混ぜない。"
language: hcl
project: "terraform-aws-ecs-container-definition"
repo: https://github.com/cloudposse/terraform-aws-ecs-container-definition
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "b7bd87e935ead58c7012a5f5d6cbd0db7c170f16"
file: main.tf
lines: [22, 26]
format: 2
function: "locals（log_configuration_without_null）"
difficulty: 2
tags: ["データ構造", "防御的プログラミング"]
---

## ひとことで
ECS のコンテナ定義は、JSON として AWS に渡されます。JSON の中に `null` が入ると、AWS が意味を取り違えたり、エラーを返したりすることがあります。このコードは、ログ設定のマップから `null` の項目を `for` 式で取り除いてから使います。利用者は、使わない項目を `null` のまま渡しても安全です。

## コード
```hcl:line-numbers=22
  log_configuration_without_null = var.log_configuration == null ? null : {
    for k, v in var.log_configuration :
    k => v
    if v != null
  }
```

## 前提知識
- コンテナ定義（container definition）: コンテナの画像、環境変数、ログの送り先などを、JSON でまとめた設定です。
- ログ設定（log_configuration）: コンテナのログを、CloudWatch Logs などへ送るための設定です。
- `null`: 値が無いことを表します。JSON にすると、そのキーが `null` として出てきます。
- `for` 式の `if`: 条件に合う要素だけを残して、新しいマップを作ります。
- `var.log_configuration == null ? null : {...}`: 元の値が無いときは、結果も `null` にします。

## 何をしているか
### 1. 元の値が無ければ、そのまま null

```hcl:line-numbers=22
  log_configuration_without_null = var.log_configuration == null ? null : {
```

利用者がログ設定を書いていなければ、結果も `null` です。ログ設定そのものが、コンテナ定義から消えます。

### 2. 値が null でない項目だけを残す

```hcl:line-numbers=23
    for k, v in var.log_configuration :
    k => v
    if v != null
```

`var.log_configuration` の各項目を `k`（キー）と `v`（値）で回し、`if v != null` で値が `null` でないものだけを残します。結果は、キーはそのままで、値が入っているものだけのマップです。

### 3. restart_policy も同じ方法で

`restart_policy_without_null` の行（同じファイルの少し下）は、同じ形で `null` の項目を落とします。ログ設定と再起動の設定は、どちらも「書いたものだけを JSON にする」という同じ方針で扱われています。

## ここがすごい
利用者は、設定のマップの中に `null` を書いても、そのまま使えます。例えば、`options` の 1 つだけ値を変えたいときに、他の項目を `null` にしておけば、自動的に消えます。Terraform の `null` の扱いと、JSON の扱いのずれを、この 1 行の `for` 式で埋めています。

また、元の値が `null` のときに、マップの作成そのものを飛ばしている点もよいです。ログ設定が無いことが、結果の `null` ひとつで分かります。

## まとめ
- `for` 式の `if v != null` で、JSON に送りたくない項目を取り除けます。
- 元の値が `null` のときは、結果も `null` にすると、項目ごと消せます。
- JSON に変換する前に、`null` を整理しておくと、AWS のエラーを防げます。
