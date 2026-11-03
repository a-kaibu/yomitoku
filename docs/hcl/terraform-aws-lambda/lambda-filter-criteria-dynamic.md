---
title: "単一の値を、dynamic の入れ子で一覧として扱う"
description: "terraform-aws-lambda の event_source_mapping。filter_criteria の filter を dynamic で作り、1 つの値でも flatten で一覧にして、同じ書き方で扱う工夫。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [456, 462]
format: 2
function: "resource \"aws_lambda_event_source_mapping\"（dynamic \"filter\"）"
difficulty: 3
tags: ["メタプログラミング", "API設計"]
---

## ひとことで
Lambda のイベントソースマッピングには、どのイベントを受け取るかを絞り込む `filter_criteria` があります。その中の `filter` は、複数書けるブロックです。このブロックは、`filter` の数だけブロックを作ります。利用者が 1 つだけ書いても、`flatten` によって一覧として扱えるようにしています。

## コード
```hcl:line-numbers=456
      dynamic "filter" {
        for_each = try(flatten([each.value.filter_criteria]), [])

        content {
          pattern = try(filter.value.pattern, null)
        }
      }
```

## 前提知識
- イベントソースマッピング: SQS や Kinesis などのイベントの流れを、Lambda 関数に結びつける設定です。
- `filter_criteria`: イベントを絞り込むフィルターの設定です。その中に、`filter` を複数書けます。
- `filter` の `pattern`: イベントの形を表す JSON のパターンです。
- `dynamic` の `for_each`: 一覧の数だけブロックを作ります。空のリストなら作られません。
- `flatten(リスト)`: 入れ子のリストを 1 段にします。ここでは、1 つの値もリストに包まれて扱われます。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。

## 何をしているか
### 1. 1 つの filter の中身を取り出す
```hcl:line-numbers=460
          pattern = try(filter.value.pattern, null)
```

`pattern = try(filter.value.pattern, null)` は、今の `filter` の `pattern` を取り出します。`pattern` が無ければ `null` を返します。`filter.value` は、`dynamic "filter"` の今の要素です。

### 2. 一覧にする
```hcl:line-numbers=457
        for_each = try(flatten([each.value.filter_criteria]), [])
```

`for_each = try(flatten([each.value.filter_criteria]), [])` は、`filter_criteria` を 1 件のリストに包み、`flatten` で 1 段にします。`filter_criteria` は、`flatten` を通るとリストの形になり、`try` は、値の形が想定と違うときの保険として働きます。

### 3. 外側の条件と合わせる
```hcl:line-numbers=452
  dynamic "filter_criteria" {
    for_each = try(each.value.filter_criteria, null) != null ? [true] : []
```

外側の `dynamic "filter_criteria"` は、`filter_criteria` が `null` でないときだけ 1 件作ります。外側が無ければ、内側の `for_each` も評価されません。

つまり、`filter_criteria` が `null` の設定では、この内側の `for_each` は評価されず、`filter` のブロックも作られません。

## ここがすごい
`flatten([値])` によって、「値が 1 つ」の場合と「一覧」の場合の両方を、同じ `for_each` の書き方で扱えます。利用者の書き方の違いに応じて、モジュールの側で分岐を書く必要がありません。

また、`try` を外側に付けているので、`filter_criteria` が無い設定でも、エラーにならずに空として扱えます。入れ子の `dynamic` のそれぞれで、「無いときは作らない」を保っています。

## まとめ
- `flatten([値])` で、1 つの値も一覧として扱えます。
- 入れ子の `dynamic` は、外側から順に条件を確かめる形で書けます。
- `try` と空のリストの組み合わせで、無い設定を安全に省けます。

