---
title: "タグに出すラベルを context と変数のどちらで決めるか"
description: "Cloud Posse の null-label が、labels_as_tags の既定値と上書きの規則を決める locals。「unset」や「default」の特別な値を使い、一度決めたら変えられない設定を実現している。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [105, 113]
format: 2
function: "locals（labels_as_tags・tags）"
difficulty: 3
tags: ["イディオム", "設計パターン"]
---

## ひとことで
`labels_as_tags` は、どのラベルをタグとして付けるかを決めるリストです。このブロックでは、変数の値と context の値のどちらを使うかを決め、既定値の `default` が指定されたときにだけ、すべてのラベルをタグにします。タグのマップは、この決定をもとに作られます。

## コード
::: code-group

```hcl:line-numbers=105 [日本語訳]
  # labels_as_tags だけは「変数の値が context の値を上書きする」という原則の例外（上を参照）
  labels_as_tags = contains(local.input.labels_as_tags, "default") ? local.default_labels_as_tags : local.input.labels_as_tags

  # 形式をそろえるためだけの代入（ほかの値には影響しない）
  descriptor_formats = local.input.descriptor_formats

  additional_tag_map = merge(var.context.additional_tag_map, var.additional_tag_map)

  tags = merge(local.generated_tags, local.input.tags)
```

```hcl:line-numbers=105 [原文]
  # labels_as_tags is an exception to the rule that input vars override context values (see above)
  labels_as_tags = contains(local.input.labels_as_tags, "default") ? local.default_labels_as_tags : local.input.labels_as_tags

  # Just for standardization and completeness
  descriptor_formats = local.input.descriptor_formats

  additional_tag_map = merge(var.context.additional_tag_map, var.additional_tag_map)

  tags = merge(local.generated_tags, local.input.tags)
```

:::

## 前提知識
- `contains(リスト, 値)`: リストに値が含まれるかを真偽値で返します。
- `merge(マップA, マップB)`: 2 つのマップを 1 つにまとめます。同じキーは後のマップが優先されます。
- `keys(マップ)`: キーの一覧を返します。
- 特別な値（センチネル）: 「未設定」を表すために使う、普通の値とは別の目印の値です。ここでは `"unset"` や `"default"` がそれにあたります。
- `local.input`: 変数と context を比べて決めた、最終的な入力値をまとめたマップです。

## 何をしているか
### 1. 既定値を決める
```hcl:line-numbers=105
  # labels_as_tags だけは「変数の値が context の値を上書きする」という原則の例外（上を参照）
  labels_as_tags = contains(local.input.labels_as_tags, "default") ? local.default_labels_as_tags : local.input.labels_as_tags
```

`default_labels_as_tags = keys(local.tags_context)` は、すべてのラベルを既定のタグ対象にします。ただしこの値は、利用者が `default` と書いたときだけ使われます。コメントにあるとおり、Terraform では `null` と空リストの扱いが一貫しないため、未設定を表す別の目印を使っています。

### 2. 利用者の指定をどこまで受け入れるか
```hcl:line-numbers=107

  # 形式をそろえるためだけの代入（ほかの値には影響しない）
  descriptor_formats = local.input.descriptor_formats

  additional_tag_map = merge(var.context.additional_tag_map, var.additional_tag_map)

  tags = merge(local.generated_tags, local.input.tags)
```

`labels_as_tags` は、変数と context の値を比べて決めます。`contains(local.input.labels_as_tags, "default")` が真なら既定の一覧を、偽なら指定された一覧をそのまま使います。`tags` は `merge(local.generated_tags, local.input.tags)` によって、自動で作ったタグと利用者のタグを合わせます。

## ここがすごい
一度決めた設定をあとから変えられないようにする仕組みが、モジュールの連鎖（モジュールから別のモジュールに context を渡す形）でも動くように作られているのが工夫点です。`"unset"` の目印が残っていれば変更できるが、`"default"` が入ったら固定される、という 2 段階の規則になっています。

単純に `null` を既定値にすると、Terraform が値を `null` と空リストのどちらとして扱うかによって、予期しない結果になることがあります。目印の文字列を使うことで、そうした曖昧さを避けています。

## まとめ
- 特別な目印の値を使うと、「未設定」と「空のリスト」を区別できます。
- 変数と context の優先順位をコードで明示すると、読み手が挙動を推測せずに済みます。
- `merge` で自動のタグと利用者のタグを合わせると、同じ形で扱えます。

