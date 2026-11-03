---
title: "ラベルの値から、使えない文字を置き換える"
description: "terraform-null-label の normalized_labels。for 式で各ラベルを回し、null は空文字に、それ以外は正規表現で置き換えた値にする。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [77, 79]
format: 2
function: "locals（normalized_labels の for 式）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
リソースの名前やタグには、使える文字に決まりがあります。null-label は、利用者が書いたラベルの値から、使えない文字を置き換えてから名前を作ります。このコードは、その下ごしらえを、ラベルの一覧に対する `for` 式でまとめて行っています。

## コード
```hcl:line-numbers=77
  normalized_labels = { for k in local.string_label_names : k =>
    local.input[k] == null ? "" : replace(local.input[k], local.regex_replace_chars, local.replacement)
  }
```

## 前提知識
- `for` 式でマップを作る: `{ for k in 一覧 : k => 値 }` の形で、キーと値のペアからなるマップを作ります。
- `replace(文字列, 正規表現, 置き換え先)`: 正規表現に合う部分を置き換えます。
- `null`: 値が無いことを表します。`null` の比較は `==` で行います。

## 何をしているか
### 1. 五つのラベルを順番に回す

```hcl:line-numbers=77
  normalized_labels = { for k in local.string_label_names : k =>
```

`namespace`、`tenant`、`environment`、`stage`、`name` の五つのキーを一つずつ取り出して、新しいマップを作ります。

### 2. 無ければ空文字、あれば文字を置き換える

```hcl:line-numbers=78
    local.input[k] == null ? "" : replace(local.input[k], local.regex_replace_chars, local.replacement)
```

値が `null` なら空文字にします。値があれば、使えない文字を `replace` で置き換えます。どちらの場合も、後の処理は文字列として扱えます。

## ここがすごい
五つのラベルに同じ処理をかけるとき、個別に書かずに一つの `for` 式で済ませています。`null` の扱いを一か所に書くので、後から名前を組み立てる側は、ラベルが空かどうかを気にせずに済みます。

## まとめ
- `for` 式でキーの一覧を回すと、同じ処理を複数の値に一度にかけられます。
- `null` は、その場で空文字に変えておくと後の処理が簡単になります。
- 正規表現による置き換えは、入力のゆれを吸収する下ごしらえに向いています。
