---
title: "format 関数でラベルから説明文を組み立てる"
description: "Cloud Posse の null-label が、利用者の書いた format 文字列にラベルの値を差し込んで説明文を作る仕組み。...（スプレッド）で可変個の引数を渡す。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: descriptors.tf
lines: [20, 27]
format: 2
function: "locals（descriptor_labels・descriptors）"
difficulty: 2
tags: ["文字列処理", "メタプログラミング"]
---

## ひとことで
利用者が「どのラベルを、どの書式で並べるか」を指定すると、このモジュールはその書式にラベルの値を差し込んで説明文を作ります。`descriptor_labels` は書式に入れる値のリストを作り、`descriptors` は `format` 関数で文字列にします。

## コード
```hcl:line-numbers=20
locals {
  descriptor_labels = { for k, v in local.descriptor_formats : k => [
    for label in v.labels : local.id_context[label]
  ] }
  descriptors = { for k, v in local.descriptor_formats : k => (
    format(v.format, local.descriptor_labels[k]...)
    )
  }
```

## 前提知識
- `format(書式, 値1, 値2, ...)`: `%s` などの書式記号に値を順番に差し込む関数です。
- `...`（スプレッド）: リストの要素を、個別の引数として展開して渡す書き方です。
- `for k, v in マップ : キー => 値`: マップの 2 つの要素（キーと値）を同時に扱う `for` 式です。
- `local.id_context[label]`: 部品の名前から、その部品の値を取り出します。
- `local.descriptor_formats`: 利用者が書いた「説明文の名前と書式、使うラベル」を並べたマップです。

## 何をしているか
### 1. 書式で使うラベルの値を集める
```hcl:line-numbers=21
  descriptor_labels = { for k, v in local.descriptor_formats : k => [
    for label in v.labels : local.id_context[label]
  ] }
```

`for k, v in local.descriptor_formats` は、説明文の名前（`k`）と、その定義（`v`）を 1 件ずつ取り出します。内側の `for label in v.labels` で、その定義が使うラベルの名前を順に読み、`local.id_context[label]` で値を取り出します。結果は「説明文の名前からラベル値のリストへのマップ」です。

### 2. 値を書式に差し込んで文字列にする
```hcl:line-numbers=24
  descriptors = { for k, v in local.descriptor_formats : k => (
    format(v.format, local.descriptor_labels[k]...)
    )
  }
```

`format(v.format, local.descriptor_labels[k]...)` では、`...` によってラベル値のリストを、ひとつずつ `format` の引数として渡します。`format` は `%s` の数と引数の数が合う必要があるので、利用者は書式とラベルの並びを揃えて指定します。`descriptors` は、説明文の名前から完成した文字列へのマップになります。

## ここがすごい
`format` の引数は決まった数しか渡せないため、ラベルの数が変わると書き方も変わります。このモジュールは `...` で可変長の引数を展開し、ラベルの数に関係なく同じ式で書けるようにしています。

また、説明文の定義を利用者がマップで受け取り、内部では `for` 式だけで処理しているので、Terraform の中に新しい関数を書かずに済んでいます。冒頭のコメントでも書かれているように、書式の文字列だけで済ませたい理由と、その制約を正直に述べているのが読みどころです。

## まとめ
- `format` と `...` を組み合わせると、可変個の値を書式に差し込めます。
- `for k, v in マップ` で、名前と定義を同時に処理できます。
- 利用者が指定する書式と、内部で値を集める処理を分けると、新しい説明文の追加が簡単になります。

