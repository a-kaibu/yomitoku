---
title: "アクセスポイントごとの許可を、flatten で 1 本のリストにする"
description: "terraform-aws-s3-bucket の file-system モジュール。アクセスポイントと読み書きの区分ごとに、主体が空でない許可だけを for 式で並べ、flatten で 1 段にまとめる。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: modules/file-system/main.tf
lines: [466, 474]
format: 2
function: "locals（access_point_grants）"
difficulty: 3
tags: ["データ構造", "イディオム"]
---

## ひとことで
この部分は、ファイルシステムのアクセスポイントごとの許可を 1 本のリストにまとめます。アクセスポイントの数だけ、さらに読み取りと読み書きの 2 つの区分があるため、`for` 式の中に `for` 式が入り、その結果を `flatten` で 1 段にしています。

## コード
```hcl:line-numbers=466
  access_point_grants = flatten([
    for ap_key, ap in var.access_points : [
      for level, principals in { read = ap.read_access_arns, read_write = ap.read_write_access_arns } : {
        access_point                  = ap_key
        actions                       = local.access_point_actions[level]
        principals                    = principals
      } if try(length(principals), 0) > 0
    ]
  ])
```

## 前提知識
- `for` 式の入れ子: 外側の `for` の各要素の中で、内側の `for` を回せます。外側が `[ ... ]` で囲まれていると、結果はリストのリストになります。
- `flatten(リストのリスト)`: 入れ子のリストを 1 段にほどく関数です。
- `{ read = 値1, read_write = 値2 }`: マップのリテラルです。`for level, principals in マップ` で、キーと値を同時に取り出せます。
- `if 条件`: `for` 式の末尾で、要素を絞り込みます。
- `try(length(principals), 0)`: 主体の数を数えます。`null` などでエラーになったら 0 として扱います。
- `local.access_point_actions[level]`: 区分（read など）に応じた操作の一覧を取り出します。

## 何をしているか
### 1. アクセスポイントごとに、区分の組を作る
```hcl:line-numbers=467
    for ap_key, ap in var.access_points : [
      for level, principals in { read = ap.read_access_arns, read_write = ap.read_write_access_arns } : {
```

外側の `for ap_key, ap in var.access_points` は、アクセスポイントの名前（`ap_key`）と中身（`ap`）を取り出します。内側では、読み取りの主体の一覧（`read_access_arns`）と、読み書きの主体の一覧（`read_write_access_arns`）の 2 つを、`level` と `principals` の組として回します。

### 2. 主体が 1 人以上いるものだけ残す
```hcl:line-numbers=469
        access_point                  = ap_key
        actions                       = local.access_point_actions[level]
        principals                    = principals
      } if try(length(principals), 0) > 0
```

各要素には、アクセスポイントの名前、その区分に対応する操作、そして主体の一覧を入れます。`if try(length(principals), 0) > 0` で、主体が 0 人の区分は残しません。`try` で守っているので、値が `null` でも数えられます。

### 3. 入れ子をほどいて 1 本にする
```hcl:line-numbers=466
  access_point_grants = flatten([
```

外側の `[ ... ]` の結果はリストのリストなので、`flatten` でほどきます。アクセスポイントの数が変わっても、後で使うときは 1 本のリストとして扱えます。

## ここがすごい
「アクセスポイント」と「区分」という 2 段階の組み合わせを、1 つの式にまとめています。途中に中間の変数を作らず、主体が無い区分を `if` で除いているので、後続の処理が空の要素を気にせず済みます。

また、`try` によって、主体の指定が無いアクセスポイントでも、エラーにならずに 0 人として扱えます。利用者の設定の省略を、すべて空として安全に受け止めています。

## まとめ
- 入れ子の `for` 式とマップの組み合わせで、2 段階の繰り返しを表せます。
- 結果がリストのリストになったら、`flatten` で 1 段にほどけます。
- 空の要素は `if` で除くと、後の処理が簡単になります。

