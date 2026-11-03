---
title: "optional() でオブジェクトの一部だけを省略可能にする"
description: "terraform-aws-security-group の timeouts 変数。object 型と optional() を組み合わせ、create と delete のどちらか一方だけの指定を許す型の定義を読む。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: variables.tf
lines: [53, 60]
format: 2
function: "variable \"timeouts\""
difficulty: 2
tags: ["型システム", "API設計"]
---

## ひとことで
`variable "timeouts"` は、作成と削除のタイムアウトを表す変数です。型に `object` と `optional()` を使うことで、利用者は `create` と `delete` のどちらか一方だけを書いても、エラーにならずに使えます。

## コード
```hcl:line-numbers=53
variable "timeouts" {
  description = "Create and delete timeout configurations for the security group"
  type = object({
    create = optional(string)
    delete = optional(string)
  })
  default = null
}
```

## 前提知識
- `variable`: モジュールの入力を定義するブロックです。`type` で型を、`default` で既定値を決めます。
- `object({ 名前 = 型 })`: 名前と型の組み合わせを持つ、構造化された型です。
- `optional(型)`: `object` の中の項目を省略可能にします。省略されると `null` が入ります。
- `default = null`: 変数全体を指定しなければ `null` になるという既定値です。
- `timeouts` は、後の `dynamic` ブロックで `null` かどうかを判定します（この項目の扱いは sg-dynamic-timeouts で見たとおりです）。

## 何をしているか
### 1. 型の中に項目を書く
```hcl:line-numbers=55
  type = object({
    create = optional(string)
    delete = optional(string)
  })
```

`type = object({ create = optional(string), delete = optional(string) })` は、`create` と `delete` という 2 つの項目を持つオブジェクトの型です。2 つとも `optional` なので、利用者はどちらか一方だけを書けます。省略された項目は `null` として扱われます。

### 2. 変数全体の既定値を null にする
```hcl:line-numbers=59
  default = null
```

`default = null` は、変数そのものを省略できることを表します。このため、利用者がタイムアウトの指定をまったく書かなかった場合は、`dynamic` ブロックの判定で「ブロックを作らない」に進みます。変数の省略と、項目の省略が、別々の段階で扱われています。

## ここがすごい
タイムアウトの型を `string` の 2 つの変数にするより、1 つの `object` にまとめるほうが、利用者が受け取る形が一目で分かります。さらに、`optional()` によって、古い設定を書いた利用者にも影響を出さずに項目を追加できます。

素朴な書き方では、「項目が無いときは `null` を入れる」を、利用者が毎回書く必要があります。`optional()` は、その既定値の扱いを型の定義に書き込んでいるので、モジュールの中の処理が簡単になります。

## まとめ
- `object` と `optional()` を使うと、項目ごとに省略を許せます。
- 変数全体の `default = null` と、項目の省略は別の仕組みです。
- 型の定義で既定の扱いを表すと、利用者もモジュールの中も分かりやすくなります。

