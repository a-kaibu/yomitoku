---
title: "X-Ray の有効化を、入れ子のマップから安全に読む"
description: "terraform-aws-step-functions の enable_xray_tracing。二段のマップを try で読み、キーが無ければ false として扱う。"
language: hcl
project: "terraform-aws-step-functions"
repo: https://github.com/terraform-aws-modules/terraform-aws-step-functions
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "16c7a1ffaa72643d714a7b3924216edce9413482"
file: main.tf
lines: [7, 7]
format: 2
function: "locals（enable_xray_tracing の入れ子の try）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
X-Ray によるトレースは、`service_integrations` という入れ子のマップで指定します。利用者がどの段階まで書いたかは分からないので、このコードは途中のキーが無くても止まらないように読んでいます。

## コード
```hcl:line-numbers=7
  enable_xray_tracing = try(var.service_integrations["xray"]["xray"], false) == true
```

## 前提知識
- 入れ子のマップ: マップの値が、さらにマップになっている形です。`マップ["a"]["b"]` の形で読みます。
- `try(式, 既定値)`: 式がエラーになれば、既定値を返します。
- `== true`: 値が真かどうかを、明示的に比べています。

## 何をしているか
### 1. 二段のキーを読む

```hcl:line-numbers=7
  enable_xray_tracing = try(var.service_integrations["xray"]["xray"], false) == true
```

`service_integrations["xray"]["xray"]` の二段のキーを読みます。どちらかのキーが無いと、そのままではエラーになります。

### 2. 無ければ false にして、真のときだけ有効にする

`try` は、読めなかった場合に `false` を返します。その結果が `true` と等しいときだけ、X-Ray は有効になります。

## ここがすごい
入れ子の深さを、利用者に強制せず、既定の値で吸収しています。`== true` で比べることで、値が文字列や空などの場合にも、有効とみなされるのを防いでいます。

## まとめ
- 入れ子のマップは、`try` で一段ずつ守ると安全です。
- 既定値を `false` にすると、省略時の動作が明確になります。
- 真偽値は `== true` で比べると、意図しない値での有効化を防げます。
