---
title: "属性の一覧を、重複と空の値を除いて整える"
description: "terraform-null-label の normalized_attributes。各属性の文字を置き換えてから、distinct で重複を消し、compact で空を除く。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [80, 80]
format: 2
function: "locals（normalized_attributes の compact と distinct）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
null-label には、名前の後ろに付ける属性の一覧があります。利用者が同じ属性を二回書いたり、空の値を入れたりしても、名前が崩れないように整えてから使います。このコードは、一行で三つの処理をつないでいます。

## コード
```hcl:line-numbers=80
  normalized_attributes = compact(distinct([for v in local.input.attributes : replace(v, local.regex_replace_chars, local.replacement)]))
```

## 前提知識
- `distinct(リスト)`: 重複する要素を取り除き、最初の出現順に残します。
- `compact(リスト)`: リストから、`null` と空文字を取り除きます。
- `for v in 一覧 : 式`: 一覧の要素を一つずつ取り出して、式の結果からリストを作ります。

## 何をしているか
### 1. 属性ごとに文字を置き換える

```hcl:line-numbers=80
  normalized_attributes = compact(distinct([for v in local.input.attributes : replace(v, local.regex_replace_chars, local.replacement)]))
```

`for` 式が、属性の一覧を一つずつ取り出し、`replace` で使えない文字を置き換えます。ここまでで、各属性の表記がそろいます。

### 2. 重複と空を取り除く

`distinct` で同じ属性を一つにまとめ、`compact` で空の値を除きます。`compact(distinct(...))` の内側の `distinct` が先に働き、その結果に外側の `compact` がかかります。

## ここがすごい
属性の整形を、一行の関数のつながりで書いています。実行は内側から外側へ進みますが、どの段階でどの問題を解決しているかが、関数の名前からそのまま分かります。

## まとめ
- 関数を入れ子にすると、整形の手順を一行で表せます。
- `distinct` で重複を、`compact` で空を取り除くと、名前が安定します。
- 入力の不備を、名前を作る前に取り除くのが安全です。
