---
title: "設定されたラベルだけをタグに自動で付ける for 式"
description: "Cloud Posse の null-label が、namespace や environment などのラベルを、空でないものだけ AWS のタグへ変換する for 式。キーの大文字小文字も設定どおりに変える。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [133, 138]
format: 2
function: "locals（generated_tags）"
difficulty: 2
tags: ["イディオム", "データ構造"]
---

## ひとことで
`generated_tags` は、ラベルの値を AWS などのタグ（キーと値の組）に自動で変換する部分です。利用者が「どのラベルをタグにするか」を選んだものだけを、空でない値に限って並べます。キーの大文字小文字も設定で切り替えられます。

## コード
```hcl:line-numbers=133
  generated_tags = {
    for l in setintersection(keys(local.tags_context), local.labels_as_tags) :
    local.label_key_case == "upper" ? upper(l) : (
      local.label_key_case == "lower" ? lower(l) : title(lower(l))
    ) => local.tags_context[l] if length(local.tags_context[l]) > 0
  }
```

## 前提知識
- マップ: `{ キー = 値 }` の形で書く値の集まりです。`keys(マップ)` でキーの一覧を取り出せます。
- `for` 式でマップを作る: `{ for l in 一覧 : 新しいキー => 値 }` と書きます。`=>` の左がキー、右が値になります。
- `if` で絞り込む: `for` 式の末尾に `if 条件` を書くと、条件に合う要素だけが残ります。
- `setintersection(A, B)`: 2 つの集合の共通部分を返す関数です。
- `length(文字列)`: 文字列の長さです。空文字かどうかの判定に使います。
- `local.tags_context` は、モジュールが持つラベルの値の表です（namespace など）。

## 何をしているか
### 1. 候補となるラベル名を絞る
```hcl:line-numbers=134
    for l in setintersection(keys(local.tags_context), local.labels_as_tags) :
```

`setintersection(keys(local.tags_context), local.labels_as_tags)` は、ラベルの候補（`tags_context` のキー）と、利用者が指定したタグ対象（`labels_as_tags`）の共通部分を求めます。ここで両方に入っている名前だけが残ります。たとえば候補に `environment` があっても、`labels_as_tags` に入っていなければタグにはなりません。

### 2. キーの大文字小文字を変えて、値が空でないものだけ残す
```hcl:line-numbers=135
    local.label_key_case == "upper" ? upper(l) : (
      local.label_key_case == "lower" ? lower(l) : title(lower(l))
    ) => local.tags_context[l] if length(local.tags_context[l]) > 0
```

`label_key_case` の値に応じて、キーを `upper`（大文字）、`lower`（小文字）、または `title(lower(...))`（先頭だけ大文字）に変換します。`=>` の右側にある `if length(local.tags_context[l]) > 0` が、値が空のラベルをタグから外しています。値が空のタグは意味を持たないので、この一行で取り除いています。

### 3. 変換結果を 1 つのマップにまとめる
```hcl:line-numbers=133
  generated_tags = {
    for l in setintersection(keys(local.tags_context), local.labels_as_tags) :
    local.label_key_case == "upper" ? upper(l) : (
      local.label_key_case == "lower" ? lower(l) : title(lower(l))
    ) => local.tags_context[l] if length(local.tags_context[l]) > 0
  }
```

`for` 式の結果は `local.generated_tags` という 1 つのマップになります。後の行で `merge` によって利用者が直接渡したタグ（`local.input.tags`）と合わせられるため、「自動で付くタグ」と「手で付けるタグ」を同じ形で扱えます。

## ここがすごい
タグをラベルから自動で作る処理を、`if` 文の連続ではなく、ひとつの `for` 式で書いているのが工夫点です。キーの大文字小文字の変換と、値が空かどうかの判定が、同じ式の中で完結しています。

もし `for` 式を使わずに書けば、タグの種類ごとに `if` を並べ、そのたびに値の空判定を書き直す必要があります。このモジュールは、対象の絞り込み（`setintersection`）、キーの変換、空の除外という 3 つの処理を、順番に読める形で組み合わせています。

## まとめ
- `for` 式は、`=>` でキーと値を決め、`if` で絞り込めます。
- 集合の共通部分（`setintersection`）を使うと、「候補」と「指定」を安全に突き合わせられます。
- 値の空判定は、タグを作る処理の中に入れておくと、出力の不備を防げます。

