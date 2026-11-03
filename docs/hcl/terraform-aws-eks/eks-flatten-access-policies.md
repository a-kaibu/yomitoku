---
title: "アクセスエントリの中のポリシーを、1 本の一覧に平らにする"
description: "terraform-aws-eks の access_entries。1 つのエントリに複数のポリシーを書けるようにし、for 式と flatten で、ポリシーごとの組に平らにする書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [339, 355]
format: 2
function: "locals（flattened_access_entries）"
difficulty: 3
tags: ["データ構造", "イディオム"]
---

## ひとことで
EKS のアクセスエントリは、クラスターの中で誰（どの IAM の主体）に何を許すかを表します。利用者は 1 つのエントリに、複数のポリシーを書けます。このブロックは、その入れ子の構造を、ポリシーごとに 1 件の組へ平らにします。リソースは、この平らな一覧を `for_each` で受け取ります。

## コード
```hcl:line-numbers=339
  flattened_access_entries = flatten([
    for entry_key, entry_val in local.merged_access_entries : [
      for pol_key, pol_val in entry_val.policy_associations :
      merge(
        {
          principal_arn = entry_val.principal_arn
          entry_key     = entry_key
          pol_key       = pol_key
        },
        { for k, v in {
          association_policy_arn              = pol_val.policy_arn
          association_access_scope_type       = pol_val.access_scope.type
          association_access_scope_namespaces = try(pol_val.access_scope.namespaces, null)
        } : k => v if !contains(["EC2_LINUX", "EC2_WINDOWS", "FARGATE_LINUX", "HYBRID_LINUX"], lookup(entry_val, "type", "STANDARD")) },
      )
    ]
  ])
```

## 前提知識
- アクセスエントリ: EKS の API で、IAM の主体にクラスターへのアクセス権を与える仕組みです。`principal_arn` で主体を指定します。
- ポリシーの関連付け（policy association）: アクセスエントリに、AWS が用意した EKS のアクセスポリシーを結びつけるものです。
- `flatten([ for ... : [ for ... : 値 ] ])`: 二重の `for` で作った入れ子のリストを、1 段のリストにほどきます。
- `merge({...}, { for k, v in {...} : k => v if 条件 })`: 2 つのマップを合わせ、後の方は条件で項目を絞ります。
- `lookup(マップ, キー, 既定値)`: キーが無いときは既定値を返します。
- `contains(リスト, 値)`: リストに値があるかを真偽値で返します。

## 何をしているか
### 1. 主体ごとに、ポリシーを 1 件ずつ取り出す
```hcl:line-numbers=339
  flattened_access_entries = flatten([
    for entry_key, entry_val in local.merged_access_entries : [
      for pol_key, pol_val in entry_val.policy_associations :
```

外側の `for` で主体のエントリを、内側の `for` でそのエントリの `policy_associations` を 1 件ずつ回します。結果は、主体とポリシーの組み合わせごとのリストになります。内側の `[ ... ]` が入れ子を作るので、`flatten` で 1 段にほどきます。

### 2. 組に必要な項目を作る
```hcl:line-numbers=342
      merge(
        {
          principal_arn = entry_val.principal_arn
          entry_key     = entry_key
          pol_key       = pol_key
        },
```

各要素は、主体の ARN、エントリのキー、ポリシーのキーを持ちます。これらを合わせて、後で `for_each` のキーを作れるようにしています。

### 3. 対象外のタイプの項目を除く
```hcl:line-numbers=348
        { for k, v in {
          association_policy_arn              = pol_val.policy_arn
          association_access_scope_type       = pol_val.access_scope.type
          association_access_scope_namespaces = try(pol_val.access_scope.namespaces, null)
        } : k => v if !contains(["EC2_LINUX", "EC2_WINDOWS", "FARGATE_LINUX", "HYBRID_LINUX"], lookup(entry_val, "type", "STANDARD")) },
```

ポリシーの項目を別の `for` 式でマップにしてから、`contains` で、一部のタイプ（EC2 や Fargate の既定のタイプ）ではポリシーを付けないように、条件で除いています。`lookup` の既定値 `STANDARD` によって、タイプが書かれていなければ除かれません。

## ここがすごい
利用者の書き方は、「主体の下にポリシーを並べる」という入れ子の形です。モジュールは、それを `for_each` が扱える平らな形へ変換します。利用者は読みやすい形で書き、リソースは扱いやすい形で作られる、という役割分担です。

また、`merge` と `{ for ... if ... }` の組み合わせで、タイプによって項目を消すという条件を、1 つの式に収めています。条件の数が増えても、この式の形を保てる書き方です。

## まとめ
- 入れ子の `for` 式と `flatten` で、階層のあるデータを平らにできます。
- `merge` と `for` 式の `if` を組み合わせると、項目ごとの条件を表せます。
- 利用者の書きやすさと、リソースの扱いやすさを、変換で分けられます。

