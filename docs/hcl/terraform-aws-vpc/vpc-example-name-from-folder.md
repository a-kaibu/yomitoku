---
title: "作業フォルダの名前から、例のリソース名を決める"
description: "terraform-aws-vpc の complete 例。basename(path.cwd) でフォルダ名を取り出し、slice で AZ を 3 つに絞る、例のための locals の書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: examples/complete/main.tf
lines: [7, 12]
format: 2
function: "locals（name・region・vpc_cidr・azs）"
difficulty: 1
tags: ["文字列処理", "イディオム"]
---

## ひとことで
この例の `locals` は、リソースの名前を作業フォルダ（作業しているディレクトリ）の名前から決めています。また、利用できる AZ（アベイラビリティゾーン）の一覧から、先頭の 3 つだけを取り出しています。例を実行するたびに、名前が衝突しないようにするための工夫です。

## コード
```hcl:line-numbers=7
locals {
  name   = "ex-${basename(path.cwd)}"
  region = "eu-west-1"

  vpc_cidr = "10.0.0.0/16"
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
```

## 前提知識
- `locals`: 同じファイルの中で何度も使う値に名前を付けるブロックです。
- `path.cwd`: Terraform を実行しているフォルダのパスです。`path.module` はモジュール自身のフォルダを表します。
- `basename(パス)`: パスの最後の部分（フォルダ名）を返す関数です。
- `"ex-${...}"`: 文字列の中に式の値を埋め込みます。
- `data "aws_availability_zones" "available" {}`: 利用できる AZ の一覧を読み込むデータソースです。`names` 属性に名前の一覧が入ります。
- `slice(リスト, 開始, 終了)`: リストの一部を取り出す関数です。終了の番号は含まれません。

## 何をしているか
### 1. フォルダ名から名前を作る
```hcl:line-numbers=8
  name   = "ex-${basename(path.cwd)}"
```

`basename(path.cwd)` は、実行しているフォルダの名前を取り出します。例えば `complete` というフォルダで実行すると、`ex-complete` という名前になります。同じリポジトリの別の例と、名前が重ならないようにする目的があります。

### 2. リージョンと CIDR を決める
```hcl:line-numbers=9
  region = "eu-west-1"

  vpc_cidr = "10.0.0.0/16"
```

リージョンは `eu-west-1` に固定し、VPC の CIDR は `10.0.0.0/16` です。例では固定値を使うことで、読み手が結果を予想しやすくしています。

### 3. AZ の先頭 3 つを使う
```hcl:line-numbers=12
  azs      = slice(data.aws_availability_zones.available.names, 0, 3)
```

`slice(data.aws_availability_zones.available.names, 0, 3)` は、利用できる AZ の一覧から、先頭の 3 つを取り出します。AZ の数はリージョンによって違うため、`slice` で数を固定しておくと、例がどのリージョンでも同じ形になります。

## ここがすごい
名前をフォルダから作るのは、例を複数同時に試すときに役立ちます。手で名前を書き換える必要がなく、フォルダを変えるだけで衝突を避けられます。

また、AZ の一覧を読み込んでから `slice` で絞るため、AZ の数が変わっても、例は 3 つのサブネットを作り続けます。外部の情報に依存する部分を、1 つの式に閉じ込めています。

## まとめ
- `basename(path.cwd)` で、実行フォルダの名前を取り出せます。
- `slice` で一覧の一部を取り出すと、数を固定できます。
- 例のための値を `locals` にまとめると、読み手が設定を一目で把握できます。

