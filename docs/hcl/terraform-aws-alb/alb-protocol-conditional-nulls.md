---
title: "プロトコルごとに送る項目を、null で切り替える"
description: "terraform-aws-alb のリスナー。プロトコルが GENEVE か HTTPS かで、ポートや mTLS のヘッダー名を送るか null にするかを決める。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [284, 290]
format: 2
function: "resource \"aws_lb_listener\"（port・protocol・mTLS のヘッダー）"
difficulty: 3
tags: ["ネットワーク", "防御的プログラミング"]
---

## ひとことで
ALB（Application Load Balancer）のリスナーには、プロトコルごとに使える項目がちがいます。GENEVE では、ポートもプロトコルも意味がちがいますし、HTTPS でしか使えない mTLS のヘッダー名もあります。このコードは、プロトコルを 1 回判定し、その結果で各項目を送るか `null` にするかを決めています。

## コード
```hcl:line-numbers=284
  port                                                                  = coalesce(each.value.protocol, var.default_protocol) != "GENEVE" ? coalesce(each.value.port, var.default_port) : null
  protocol                                                              = coalesce(each.value.protocol, var.default_protocol) != "GENEVE" ? coalesce(each.value.protocol, var.default_protocol) : null
  routing_http_request_x_amzn_mtls_clientcert_header_name               = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_header_name : null
  routing_http_request_x_amzn_mtls_clientcert_issuer_header_name        = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_issuer_header_name : null
  routing_http_request_x_amzn_mtls_clientcert_leaf_header_name          = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_leaf_header_name : null
  routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_serial_number_header_name : null
  routing_http_request_x_amzn_mtls_clientcert_subject_header_name       = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_subject_header_name : null
```

## 前提知識
- リスナー: ロードバランサーが、どのポートとプロトコルで受けつけるかを決める単位です。
- GENEVE: AWS Gateway Load Balancer で使われる、トンネル用のプロトコルです。ポートの指定が要りません。
- mTLS（相互 TLS）: クライアントも証明書を提示する通信の方式です。その証明書の情報を、ヘッダーで転送先へ渡せます。
- `coalesce(each.value.protocol, var.default_protocol)`: 利用者のプロトコルを、無ければ既定のプロトコルにして使います。
- `null`: 属性を送らないという意味です。

## 何をしているか
### 1. GENEVE のときは、ポートを送らない

```hcl:line-numbers=284
  port = coalesce(each.value.protocol, var.default_protocol) != "GENEVE" ? coalesce(each.value.port, var.default_port) : null
```

プロトコルが `GENEVE` でなければ、ポートを使います。`GENEVE` のときは `null` で、ポートは送りません。プロトコルの値は、`coalesce` で既定値を補ってから比べています。

### 2. HTTPS のときだけ、mTLS のヘッダーを送る

```hcl:line-numbers=286
  routing_http_request_x_amzn_mtls_clientcert_header_name = coalesce(each.value.protocol, var.default_protocol) == "HTTPS" ? each.value.routing_http_request_x_amzn_mtls_clientcert_header_name : null
```

mTLS の証明書のヘッダーは、HTTPS のときだけ意味があります。他のプロトコルでは `null` です。同じ判定が、続く 4 行でも使われています。

## ここがすごい
「プロトコルを既定値で補ってから判定する」という順番が、この式の要です。利用者がプロトコルを書かなくても、既定値が正しく効きます。判定を毎回 `coalesce` から書くのは冗長に見えますが、どの行も同じ前提で読めるので、ずれが起きにくくなっています。

また、ほとんどの行が、判定の結果だけで「送る値か `null` か」が決まります。読み手は 1 つの判定を理解すれば、10 行近い属性の意味が分かります。

## まとめ
- プロトコルごとに使える項目が違うときは、判定を先に 1 つ決めて、属性を `null` で切り替えます。
- 既定値の補い（`coalesce`）を判定の前に行うと、利用者の書き忘れに強くなります。
- 同じ判定を並べると、どの属性が、どの条件で有効になるかを一覧で把握できます。
