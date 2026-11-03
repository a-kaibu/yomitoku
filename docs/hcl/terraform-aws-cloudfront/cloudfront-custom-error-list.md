---
title: "エラー時の応答を、一覧から 1 つずつ作る"
description: "terraform-aws-cloudfront の custom_error_response。利用者の一覧を dynamic で回し、エラーごとに応答のコードとページの場所を設定する。"
language: hcl
project: "terraform-aws-cloudfront"
repo: https://github.com/terraform-aws-modules/terraform-aws-cloudfront
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "5b9a0a480220b84f29f02d84ff71dd5340953f68"
file: main.tf
lines: [30, 39]
format: 2
function: "resource \"aws_cloudfront_distribution\"（dynamic \"custom_error_response\"）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
CloudFront は、オリジンからエラー（404 や 500 など）が返ったときに、別のページを返せます。エラーごとに、どのページを、どの応答コードで返すかを決められます。このコードは、その設定の一覧を `dynamic` で回し、エラーの数だけブロックを作ります。

## コード
```hcl:line-numbers=30
  dynamic "custom_error_response" {
    for_each = var.custom_error_response != null ? var.custom_error_response : []

    content {
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
    }
  }
```

## 前提知識
- エラーレスポンス: オリジンがエラーを返したときに、CloudFront が利用者に返す応答の設定です。
- `error_code`: 差し替える対象のエラーコードです（例: `404`）。
- `response_code`: 利用者に返すステータスコードです（例: `200`）。
- `response_page_path`: 返すページの場所です（例: `/error.html`）。
- `error_caching_min_ttl`: エラーの応答をキャッシュする最短の秒数です。

## 何をしているか
### 1. 指定が無ければ、空の一覧を回す

```hcl:line-numbers=31
    for_each = var.custom_error_response != null ? var.custom_error_response : []
```

`custom_error_response` が `null` なら、空の一覧を回すので、ブロックは作られません。指定があれば、その要素の数だけブロックを作ります。

### 2. 各エラーの設定を、そのまま渡す

```hcl:line-numbers=34
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
```

4 つの項目を、利用者の値のまま渡します。`error_code` で対象を決め、`response_page_path` で差し替えるページを決めます。

## ここがすごい
エラーごとの設定を一覧で受け取るので、404 と 500 で違うページを返す、といった書き方が自然にできます。一覧の要素が 1 つでも、10 個でも、同じ書き方で動きます。

また、この記事で見た他の `dynamic` と同じ型で、「無ければ空の一覧」という書き方になっています。複数の部分が同じ型なので、ディストリビューション全体を読むときの負担が減ります。

## まとめ
- 数が決まらない設定は、一覧と `dynamic` で作ると、利用者が自由に増やせます。
- `null` を空の一覧に置き換えると、ブロックを作らない状態を表せます。
- エラーごとに、対象と応答を分けて渡すと、設定の意味がはっきりします。
