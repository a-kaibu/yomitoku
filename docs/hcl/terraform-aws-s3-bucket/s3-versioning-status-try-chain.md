---
title: "バージョニングの指定を、真偽値でも文字列でも受けつける"
description: "terraform-aws-s3-bucket のバージョニング。enabled の真偽値、status の文字列、どちらも無いときの既定値を、try の候補順で 1 つの Enabled か Suspended に決める。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [273, 273]
format: 2
function: "resource \"aws_s3_bucket_versioning\"（this・versioning_configuration.status）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
S3 のバージョニングは、オブジェクトの古い版を残すかどうかの設定です。値は `Enabled` か `Suspended` の 2 つの文字列で、AWS に送ります。このモジュールは、利用者が書く形式がいくつあっても（真偽値、文字列、大文字小文字の違い）、`try` の候補の順番で 1 つの値に揃えます。

## コード
```hcl:line-numbers=273
    status = try(var.versioning["enabled"] ? "Enabled" : "Suspended", tobool(var.versioning["status"]) ? "Enabled" : "Suspended", title(lower(var.versioning["status"])), "Enabled")
```

## 前提知識
- S3 のバージョニング: 同じキーのオブジェクトを上書きしたとき、古い版を残しておく機能です。誤って消したときに戻せます。
- `Enabled` / `Suspended`: バージョニングを有効にする、または一時停止する、という AWS の状態の値です。
- `try(候補1, 候補2, ...)`: 左から評価し、最初にエラーにならなかった値を返します。最後の値が既定値になります。
- `tobool(値)`: 文字列の `"true"` などを真偽値に変えます。
- `title(lower(値))`: 小文字にしてから、先頭を大文字にします。`enabled` を `Enabled` に直す役割です。
- 三項演算子: 条件に応じて、2 つの文字列のどちらかを選びます。

## 何をしているか
### 1. 真偽値の enabled を最優先で見る

```hcl:line-numbers=273
    status = try(var.versioning["enabled"] ? "Enabled" : "Suspended", tobool(var.versioning["status"]) ? "Enabled" : "Suspended", title(lower(var.versioning["status"])), "Enabled")
```

最初の候補は `var.versioning["enabled"]` を真偽値として使う形です。`enabled` が `true` なら `Enabled`、`false` なら `Suspended` になります。キーが無いときは、ここでエラーになるので次の候補に進みます。

### 2. status の文字列を、真偽値として読む

2 番目の候補は、`status` が `"true"` や `"false"` のような文字列のときに使われます。`tobool` で真偽値にしてから、三項演算子で `Enabled` と `Suspended` を選びます。

### 3. 文字列はそのまま整える

3 番目の候補は、`status` が `"enabled"` や `"suspended"` のように英単語で書かれたときです。`lower` で小文字にしてから `title` で先頭を大文字にするので、AWS が受け取る形になります。

### 4. どれも無ければ Enabled

最後の `"Enabled"` は既定値です。何も指定されていなければ、バージョニングは有効になります。

## ここがすごい
利用者は、真偽値でも文字列でも、好きな形で書けます。その差は、`try` の候補を並べるだけで吸収されています。`if` で分けて書くと、キーの有無と型の組み合わせを全部数える必要がありますが、この式は「うまく読めたものを使う」だけで済みます。

さらに、最後の既定値を `Enabled` にしているのも判断が見えます。何も書かなければ、データを失わない方（古い版を残す方）を選んでいます。

## まとめ
- `try` の候補を型の違いごとに並べると、入力の形式の違いを吸収できます。
- `tobool` と `title(lower())` で、文字列を AWS の値の形に揃えられます。
- 最後の既定値に、安全な側（データを残す側）を選ぶと、利用者が書き忘れても安心です。
