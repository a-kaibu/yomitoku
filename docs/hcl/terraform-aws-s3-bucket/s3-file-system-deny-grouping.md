---
title: "同じ相手のアクセスポイントを「...」でまとめて for_each のキーにする"
description: "terraform-aws-s3-bucket の file-system モジュール。主体ごとに、拒否すべきアクセスポイントの一覧を作る for 式。値に ... を付けて同じキーの値を集める書き方。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: modules/file-system/main.tf
lines: [563, 569]
format: 2
function: "locals（dynamic \"statement\" の for_each）"
difficulty: 3
tags: ["データ構造", "セキュリティ"]
---

## ひとことで
この部分は、ファイルシステムのポリシーに、「ある主体を、ほかのアクセスポイントで拒否する」文を作るための準備です。主体の名前をキーにし、その主体が使える（許可された）アクセスポイントの一覧を値にしたマップを作ります。

## コード
```hcl:line-numbers=563
    for_each = {
      for pair in flatten([
        for g in local.access_point_grants : [
          for principal in g.principals : { principal = principal, access_point = g.access_point }
        ]
      ]) : pair.principal => pair.access_point...
    }
```

## 前提知識
- マップの `for` 式: `{ for 要素 : キー => 値 }` で、キーと値を持つマップを作ります。
- 値の後ろの `...`（グルーピング記号）: 同じキーになった値を、リストにまとめる書き方です。`=> 値...` と書きます。
- `flatten([ ... ])`: 入れ子のリストを 1 段にほどきます。ここでは、アクセスポイントごとの主体の一覧を、主体ごとの組に変えるために使います。
- `pair.principal` と `pair.access_point`: `{ principal = ..., access_point = ... }` の形の組の、それぞれの項目です。
- `dynamic "statement"`: `for_each` の要素ごとに、拒否の文を作ります。

## 何をしているか
### 1. 主体ごとの組を平らに並べる
```hcl:line-numbers=564
      for pair in flatten([
        for g in local.access_point_grants : [
          for principal in g.principals : { principal = principal, access_point = g.access_point }
```

`flatten([for g in local.access_point_grants : [for principal in g.principals : {...}]])` は、前の記事で作った許可の一覧を、主体ごとに 1 件ずつの組にします。二重の `for` と `flatten` を組み合わせて、「1 つのアクセスポイントに 3 人いれば、3 件の組」を作ります。

### 2. 同じ主体の組をまとめる
```hcl:line-numbers=567
        ]
      ]) : pair.principal => pair.access_point...
```

`pair.principal => pair.access_point...` は、同じ主体のキーに入ったアクセスポイントの名前を、リストとして集めます。`...` を書くことで、同じキーの値が上書きされずに一覧になります。

### 3. 主体ごとに 1 つの拒否の文にする
```hcl:line-numbers=562
  dynamic "statement" {
```

`dynamic "statement"` は、主体の数だけ `statement` を作ります。`for_each` のキーは主体の名前なので、`statement.key` で主体を取り出し、`principals` の `identifiers` に入れます。

## ここがすごい
通常のマップの `for` 式では、同じキーが来ると後のものが残ってしまいます。`...` を使うと、その性質を逆手に取って、キーごとに値をまとめられます。コメントにあるように、「許可は足し算で効く」ため、拒否を別の文で書く必要がある、という背景を踏まえた設計です。

また、主体ごとに 1 つの文にまとめることで、ポリシーの文の数が主体の数で決まります。アクセスポイントを増やしても、文の数は増えません。

## まとめ
- 値の後ろの `...` を付けると、同じキーの値をリストにまとめられます。
- `flatten` と組み合わせると、入れ子の一覧を主体ごとの組に変えられます。
- 拒否の文は、キーを主体にした `dynamic` で作ると、主体の数だけ簡潔に表せます。
