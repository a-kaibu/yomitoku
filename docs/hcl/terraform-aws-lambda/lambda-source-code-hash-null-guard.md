---
title: "ハッシュの計算を、無効化されているときは飛ばす"
description: "terraform-aws-lambda の source_code_hash。ignore_source_code_hash が真なら null にし、ファイルを読まずに済ませる。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [15, 15]
format: 2
function: "locals（source_code_hash の算出）"
difficulty: 2
tags: ["防御的プログラミング", "セキュリティ"]
---

## ひとことで
Lambda の `source_code_hash` は、コードが変わったことを Terraform に伝える値です。このモジュールは、利用者が無効化しているときには計算をせず、`null` を返します。計算を飛ばすことで、ファイルが無くてもエラーにならない道を作っています。

## コード
```hcl:line-numbers=15
  source_code_hash = var.ignore_source_code_hash ? null : (terraform_data.package_filename_for_hash[0].output.filename != null ? try(filebase64sha256(terraform_data.package_filename_for_hash[0].output.filename), null) : null)
```

## 前提知識
- `source_code_hash`: 同じ名前のファイルでも、中身が変わったときに更新を促すための値です。
- `filebase64sha256(パス)`: ファイルの中身から、Base64 形式の SHA-256 ハッシュを計算します。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。

## 何をしているか
### 1. 無効化されていれば null を返す

```hcl:line-numbers=15
  source_code_hash = var.ignore_source_code_hash ? null : (terraform_data.package_filename_for_hash[0].output.filename != null ? try(filebase64sha256(terraform_data.package_filename_for_hash[0].output.filename), null) : null)
```

先頭の `var.ignore_source_code_hash ? null` で、無効化されていれば、後ろの計算を一切行わずに `null` を返します。ファイルが存在しなくても、この段階でエラーは起きません。

### 2. 有効なら、ファイルのハッシュを計算する

有効なときは、資源の出力にファイル名があれば `filebase64sha256` で計算し、読めなければ `try` で `null` に戻します。

## ここがすごい
「計算しないこと」を、最初の条件で先に決めています。三項演算子の先頭に無効化の判定を置くことで、後ろの式が評価されません。`try` と組み合わせて、ファイルが無いときも落ちないようにしています。

## まとめ
- 無効化の判定を式の先頭に置くと、不要な計算を省けます。
- `null` を返すと、属性を省略したのと同じ扱いになります。
- 外部のファイルを読む処理は、`try` で守ると安全です。
