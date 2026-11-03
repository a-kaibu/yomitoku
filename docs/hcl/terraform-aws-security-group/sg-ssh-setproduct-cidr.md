---
title: "setproduct で許可元とポートの全組み合わせを作る"
description: "terraform-aws-security-group の ssh モジュール。プリセットのルールと IPv4 の許可元を setproduct で掛け合わせ、キーに「ルール/許可元」の名前を付けた map を作る。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: modules/ssh/main.tf
lines: [4, 10]
format: 2
function: "locals（ingress_with_cidr_ipv4）"
difficulty: 3
tags: ["データ構造", "イディオム"]
---

## ひとことで
`ssh` モジュールは、SSH 用の受信ルールを、利用者が指定した許可元（IPv4 の CIDR）の数だけ作ります。`setproduct` で「ルールの一覧」と「許可元の一覧」の全組み合わせを作り、それぞれを 1 つの map にまとめています。このファイルの先頭には、`generate/catalog.tf` から生成され、手で編集しないよう書かれています。

## コード
```hcl:line-numbers=4
  ingress_with_cidr_ipv4 = {
    for pair in setproduct(keys(var.preset_ingress_rules), keys(var.ingress_cidr_ipv4)) :
    "${pair[0]}/${pair[1]}" => merge(
      var.preset_ingress_rules[pair[0]],
      { cidr_ipv4 = var.ingress_cidr_ipv4[pair[1]] }
    )
  }
```

## 前提知識
- `setproduct(リストA, リストB)`: 2 つの一覧の全組み合わせを作る関数です。`A=[1,2]`、`B=[x,y]` なら `[1,x]`、`[1,y]`、`[2,x]`、`[2,y]` の 4 組になります。
- `keys(マップ)`: マップのキーの一覧を返します。
- `pair[0]`、`pair[1]`: 組み合わせの 1 番目と 2 番目の要素を、番号で取り出します。
- `"${pair[0]}/${pair[1]}"`: 文字列に値を埋め込んで、キーを作ります。
- `merge(マップA, { 項目 = 値 })`: マップを合わせて、1 つのマップを作ります。同じキーは後のものが優先されます。

## 何をしているか
### 1. 全組み合わせを作り、キーを付ける
```hcl:line-numbers=5
    for pair in setproduct(keys(var.preset_ingress_rules), keys(var.ingress_cidr_ipv4)) :
```

`setproduct(keys(var.preset_ingress_rules), keys(var.ingress_cidr_ipv4))` は、プリセットのルールの名前と、許可元の名前の全組み合わせを作ります。キーは `"ルール名/許可元名"` の形の文字列です。こうすると、どの組み合わせかが一目で分かり、後から取り出しやすくなります。

### 2. ルールに許可元の値を足す
```hcl:line-numbers=6
    "${pair[0]}/${pair[1]}" => merge(
      var.preset_ingress_rules[pair[0]],
      { cidr_ipv4 = var.ingress_cidr_ipv4[pair[1]] }
    )
```

`merge(var.preset_ingress_rules[pair[0]], { cidr_ipv4 = var.ingress_cidr_ipv4[pair[1]] })` は、プリセットのルールの項目に、許可元の CIDR を 1 つ加えます。ルールの名前から元のルールを、許可元の名前から CIDR を、それぞれ番号で引いています。

### 3. 4 種類の許可元をまとめる
```hcl:line-numbers=36
  preset_ingress_combined = merge(
    local.ingress_with_cidr_ipv4,
    local.ingress_with_cidr_ipv6,
    local.ingress_with_prefix_list_id,
    local.ingress_with_referenced_security_group_id,
```

IPv4、IPv6、プレフィックスリスト、セキュリティグループ参照の 4 つの map を、`merge` で 1 つにまとめます。同じキーを持つ要素は、後に書かれたもので上書きされるので、キーの形式がそろっていることが前提になります。

## ここがすごい
`setproduct` を使うと、ルールと許可元の掛け算を、2 重の `for` 文のように書かずに済みます。組み合わせの数が多くなっても、コードの形は変わりません。

また、ファイルの冒頭に「生成されたもので、手で編集しない」と書かれているため、読み手は、直すべき場所が `catalog.tf` だと気づけます。生成と手書きを分けて管理する、大規模なモジュールならではの工夫です。

## まとめ
- `setproduct` で、2 つの一覧の全組み合わせを作れます。
- キーに両方の名前を含めると、組み合わせの意味が読み取れます。
- 生成されたファイルには、元になる場所を書いておくと、保守がしやすくなります。

