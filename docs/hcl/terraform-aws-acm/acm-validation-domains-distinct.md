---
title: "証明書の検証項目を、ワイルドカードを外して重複なしにする"
description: "terraform-aws-acm の検証項目作り。*. を外したドメイン名を merge と distinct で一意にし、DNS レコードを作る順番を安定させる。"
language: hcl
project: "terraform-aws-acm"
repo: https://github.com/terraform-aws-modules/terraform-aws-acm
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d461daf01f5d11bf116b82cdd9680a29772eb8f7"
file: main.tf
lines: [12, 16]
format: 2
function: "locals（validation_domains）"
difficulty: 2
tags: ["文字列処理", "データ構造"]
---

## ひとことで
ACM（AWS の証明書サービス）で DNS 検証をするには、ドメインごとに「確かにそのドメインを持っている」と示す DNS レコードを作る必要があります。このコードは、証明書が返す検証項目の一覧から、ワイルドカード（`*.`）を外した重複のないリストを作ります。その結果、同じレコードを二重に作らずに済みます。

## コード
```hcl:line-numbers=12
  validation_domains = local.create_certificate || local.create_route53_records_only ? distinct(
    [for k, v in try(aws_acm_certificate.this[0].domain_validation_options, var.acm_certificate_domain_validation_options) : merge(
      tomap(v), { domain_name = replace(v.domain_name, "*.", "") }
    )]
  ) : []
```

## 前提知識
- ACM（AWS Certificate Manager）: HTTPS 用の証明書を発行・管理するサービスです。
- ワイルドカード証明書: `*.example.com` のように、同じ階層の任意のサブドメインを 1 枚でカバーする証明書です。
- DNS 検証: 証明書の発行時に、ドメインの DNS へ決まった値の CNAME などを登録させ、所有を確かめる方法です。
- `for` 式: `[for k, v in 集まり : 式]` で、集まりの各要素を変換して新しいリストを作ります。
- `distinct(list)`: 同じ値の重複を取り除きます。
- `replace(文字列, "*.", "")`: 文字列の中の `*.` を空にして消します。
- `tomap(v)`: オブジェクトをマップに変換します。`merge` でマップを足すために使われています。

## 何をしているか
### 1. 検証する項目の一覧を、ACM から受け取る

```hcl:line-numbers=12
  validation_domains = local.create_certificate || local.create_route53_records_only ? distinct(
```

証明書を作るとき、または既存の証明書の DNS レコードだけを作るときに、この一覧を使います。どちらでもなければ空のリストです。`try(aws_acm_certificate.this[0].domain_validation_options, var.acm_certificate_domain_validation_options)` は、証明書が作成済みならその検証項目を、まだ無ければ利用者が渡した値を使います。

### 2. ワイルドカードの `*.` を外す

```hcl:line-numbers=13
    [for k, v in try(aws_acm_certificate.this[0].domain_validation_options, var.acm_certificate_domain_validation_options) : merge(
      tomap(v), { domain_name = replace(v.domain_name, "*.", "") }
    )]
```

ACM は、`*.example.com` の検証項目を返すことがあります。しかし、レコードを作るときに必要なのは検証用の名前で、ワイルドカードの印は要りません。`replace` で `*.` を消し、`merge` で `domain_name` だけを差し替えます。`merge(tomap(v), {...})` は、元の検証項目の値（レコード名や値）を残したまま、名前だけを上書きする書き方です。

### 3. 同じレコードを 1 つにまとめる

`distinct(...)` は、`example.com` と `*.example.com` のように、ワイルドカードを外すと同じ名前になる項目を 1 つにまとめます。これにより、同じ DNS レコードを 2 回作ってエラーになる事態を避けられます。

## ここがすごい
「ワイルドカードを外す」と「重複を取る」を、外からは見えない 1 つの式にまとめているのが特徴です。`*.example.com` と `example.com` は、どちらも同じ検証用の DNS レコードを使うことがあります。そのため、単純に項目を並べると、レコードの作成が二重になって失敗します。

また、証明書がまだ無いときは、利用者が渡した `acm_certificate_domain_validation_options` をそのまま使えるようにしている点もよく考えられています。`try` の 2 番目の候補で、作成前と作成後の両方に対応しています。

## まとめ
- `for` 式と `replace` で、リストの各要素を別の形に変換できます。
- `distinct` は、変換後にできた重複を取り除く定番の組み合わせです。
- `try(A, B)` は、A が使えないときに B を使う、と書けます。作成前と後で値の出所が変わる場面で役立ちます。
