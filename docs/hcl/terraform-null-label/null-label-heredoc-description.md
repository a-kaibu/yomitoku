---
title: "heredoc で、変数の説明を複数行に書く"
description: "Cloud Posse の null-label の variables.tf。<<-EOT の heredoc で、labels_as_tags のような注意書きを、インデントを保ったまま複数行で書く書き方。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: variables.tf
lines: [108, 120]
format: 2
function: "variable \"labels_as_tags\"（description）"
difficulty: 1
tags: ["可読性", "文字列処理"]
---

## ひとことで
この部分は、変数 `labels_as_tags` の説明文を、`<<-EOT` という書き方で複数行にまとめています。説明文は、ドキュメントを作るツールや、利用者がエディタで読む部分として使われます。

## コード
```hcl:line-numbers=108
variable "labels_as_tags" {
  type        = set(string)
  default     = ["default"]
  description = <<-EOT
    Set of labels (ID elements) to include as tags in the `tags` output.
    Default is to include all labels.
    Tags with empty values will not be included in the `tags` output.
    Set to `[]` to suppress all generated tags.
    **Notes:**
      The value of the `name` tag, if included, will be the `id`, not the `name`.
      Unlike other `null-label` inputs, the initial setting of `labels_as_tags` cannot be
      changed in later chained modules. Attempts to change it will be silently ignored.
    EOT
```

## 前提知識
- ヒアドキュメント（heredoc）: 複数行の文字列を、`<<-EOT` から `EOT` までの間に書く方法です。`EOT` は区切りの目印で、別の文字でもかまいません。
- `<<-`: 行頭の共通のインデントを取り除く形です。ファイル内でどれだけ字下げをしても、文字列の中では字下げが揃います。
- `set(string)`: 文字列の集合です。順番や重複を持たない一覧です。
- `default = ["default"]`: 既定の値です。ここでは、すべてのラベルをタグにする意味の印を入れています。
- Markdown の記法（`**Notes:**` や `` `[]` `` など）: 説明文の中で、ドキュメントツールが読んで見出しやコードの書式にします。

## 何をしているか
### 1. 型と既定値を決める
```hcl:line-numbers=109
  type        = set(string)
  default     = ["default"]
```

`type = set(string)` は、文字列の集まりを表します。`default = ["default"]` は、利用者が何も書かなければ `default` という印の 1 つだけを持つ集合になります。labels_as_tags の型として使われています。

### 2. 説明文を複数行で書く
```hcl:line-numbers=111
  description = <<-EOT
    Set of labels (ID elements) to include as tags in the `tags` output.
    Default is to include all labels.
    Tags with empty values will not be included in the `tags` output.
    Set to `[]` to suppress all generated tags.
```

`<<-EOT` から `EOT` までが説明文です。`Set of labels` で始まる 最初の文と、そのあとの説明が、改行を保ったまま 1 つの文字列になります。`` `[]` `` のように、バッククォートで囲んだ部分は、Markdown のコードとして表示されます。

### 3. 注意書きを箇条書きに近い形で書く
```hcl:line-numbers=116
    **Notes:**
      The value of the `name` tag, if included, will be the `id`, not the `name`.
      Unlike other `null-label` inputs, the initial setting of `labels_as_tags` cannot be
      changed in later chained modules. Attempts to change it will be silently ignored.
```

`**Notes:**` の下には、2 つの注意が続きます。1 つ目は `name` タグの値が `id` になることで、2 つ目は `labels_as_tags` が後から変えられないことです。読み手は、この注意を読めば、よくある誤解を避けられます。

## ここがすごい
長い説明を複数行で書けるので、コードの中で読みやすく整えられます。`<<-` の字下げの除去によって、ファイルの中のインデントと、説明文の中の見た目が別々に管理できます。

また、説明文の中に、動作の注意（後から変えられない）を書いているため、コードを読まなくても、利用者は重要な制限を知ることができます。ドキュメントをコードと一緒に管理する、良い例です。

## まとめ
- `<<-EOT` の heredoc で、複数行の説明を読みやすく書けます。
- 説明文の中に制限や注意を書くと、利用者が誤解しにくくなります。
- 型と既定値を一緒に読むと、変数の使い方が分かりやすくなります。
