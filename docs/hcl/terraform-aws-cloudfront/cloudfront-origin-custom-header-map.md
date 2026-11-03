---
title: "オリジンに付けるカスタムヘッダーを、マップのキーと値から作る"
description: "terraform-aws-cloudfront のオリジン。custom_header のマップを dynamic で回し、キーを名前、値を中身にしたヘッダーを、null のときは空のマップで省く。"
language: hcl
project: "terraform-aws-cloudfront"
repo: https://github.com/terraform-aws-modules/terraform-aws-cloudfront
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "5b9a0a480220b84f29f02d84ff71dd5340953f68"
file: main.tf
lines: [230, 237]
format: 2
function: "resource \"aws_cloudfront_distribution\"（origin・dynamic \"custom_header\"）"
difficulty: 2
tags: ["ネットワーク", "データ構造"]
---

## ひとことで
CloudFront は、コンテンツを取りに行く先（オリジン）に、独自のヘッダーを付けて送れます。例えば、オリジンが特定の送信元だけを受けつけるための合言葉を、ヘッダーで渡すことがあります。このコードは、ヘッダーの一覧をマップで受け取り、キーをヘッダーの名前、値をヘッダーの中身として、1 つずつ作ります。

## コード
```hcl:line-numbers=230
      dynamic "custom_header" {
        for_each = origin.value.custom_header != null ? origin.value.custom_header : {}

        content {
          name  = custom_header.key
          value = custom_header.value
        }
      }
```

## 前提知識
- オリジン（origin）: CloudFront が、コンテンツを取りに行く元のサーバーや S3 バケットです。
- カスタムヘッダー: オリジンへのリクエストに、利用者が決めた名前と値を追加するための設定です。
- `custom_header.key` と `custom_header.value`: `dynamic` でマップを回すとき、キーと値をそれぞれ読む書き方です。
- `null` と `{}`: 指定が無いときに、空のマップを使ってブロックを作らないための書き方です。
- `dynamic` のネスト: オリジンの中に、カスタムヘッダーのブロックを入れ子で作ります。

## 何をしているか
### 1. 指定が無ければ、空のマップを回す

```hcl:line-numbers=231
        for_each = origin.value.custom_header != null ? origin.value.custom_header : {}
```

`custom_header` が `null` なら、空のマップを回すので、ヘッダーは 1 つも作られません。指定があれば、マップの項目の数だけヘッダーを作ります。

### 2. キーを名前、値を中身にする

```hcl:line-numbers=234
          name  = custom_header.key
          value = custom_header.value
```

マップのキーが、ヘッダーの名前になります。値が、ヘッダーの中身です。利用者は、`{ "X-Secret" = "abc" }` のように書くだけで、ヘッダーを 1 つ追加できます。

## ここがすごい
ヘッダーの一覧を、名前をキーにしたマップで受け取る設計が、扱いやすさの鍵です。同じ名前を 2 回書くと、マップが自動で 1 つにまとめてくれるので、重複したヘッダーを作る事故が起きにくくなります。

また、`null` を空のマップに置き換えるだけで、ヘッダーがあるときも無いときも、同じ `dynamic` の形で書けます。前に見た記事と同じ型なので、読み手は迷いません。

## まとめ
- マップのキーをヘッダーの名前にすると、利用者の書き方が直感的になります。
- 同じキーは 1 つにまとまるので、重複を防げます。
- `null` を `{}` に置き換えると、省略可能な一覧を統一的に扱えます。
