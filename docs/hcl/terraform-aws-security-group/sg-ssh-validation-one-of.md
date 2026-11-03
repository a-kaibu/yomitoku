---
title: "許可元をちょうど 1 つに限る validation"
description: "terraform-aws-security-group の ssh モジュール。ingress_rules の各ルールで、cidr_ipv4 など 4 つの許可元のうち、ちょうど 1 つだけが指定されているかを確かめる validation。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: modules/ssh/variables.tf
lines: [132, 138]
format: 2
function: "variable \"ingress_rules\"（validation）"
difficulty: 2
tags: ["防御的プログラミング", "セキュリティ"]
---

## ひとことで
受信ルールの許可元は、IPv4 の CIDR、IPv6 の CIDR、プレフィックスリスト、セキュリティグループ参照の 4 種類のうち、ちょうど 1 つだけを指定する決まりです。この `validation` は、その決まりを plan の前に確かめ、違えばエラーにします。

## コード
```hcl:line-numbers=132
  validation {
    condition = alltrue([
      for k, v in var.ingress_rules :
      length(compact([v.cidr_ipv4, v.cidr_ipv6, v.prefix_list_id, v.referenced_security_group_id])) == 1
    ])
    error_message = "Each ingress rule must set exactly one of cidr_ipv4, cidr_ipv6, prefix_list_id, or referenced_security_group_id."
  }
```

## 前提知識
- `validation` ブロック: 変数の値をチェックする条件を書きます。`condition` が真なら通り、偽ならエラーになります。
- `alltrue(リスト)`: リストの要素がすべて真なら真を返します。
- `for k, v in マップ : 式`: マップの要素ごとに式を評価するための `for` 式です。`alltrue` の中に書くと、全部のルールを順に調べられます。
- `compact(リスト)`: `null` と空文字を取り除いたリストを返します。
- `length(リスト) == 1`: 残ったものの数が 1 つかどうかを判定します。
- `error_message`: エラー時に表示する文章です。

## 何をしているか
### 1. 各ルールの許可元の数を数える
```hcl:line-numbers=134
      for k, v in var.ingress_rules :
      length(compact([v.cidr_ipv4, v.cidr_ipv6, v.prefix_list_id, v.referenced_security_group_id])) == 1
```

`for k, v in var.ingress_rules` で、ルールを 1 件ずつ取り出します。`[v.cidr_ipv4, v.cidr_ipv6, v.prefix_list_id, v.referenced_security_group_id]` は、4 種類の許可元の値の並びです。`compact` で `null` を取り除くと、指定されたものだけが残ります。

### 2. 数が 1 つのときだけ通す
```hcl:line-numbers=135
      length(compact([v.cidr_ipv4, v.cidr_ipv6, v.prefix_list_id, v.referenced_security_group_id])) == 1
    ])
```

`length(...) == 1` で、残りが 1 つのときだけ真になります。0 個（許可元が無い）でも、2 個以上（重複して指定）でも偽になるので、エラーになります。`alltrue` は、すべてのルールがこの条件を満たしたときだけ真を返します。

### 3. エラーの文章で、決まりを伝える
```hcl:line-numbers=137
    error_message = "Each ingress rule must set exactly one of cidr_ipv4, cidr_ipv6, prefix_list_id, or referenced_security_group_id."
```

`error_message` には、「4 種類のうちちょうど 1 つを指定してください」という決まりが、そのまま書かれています。利用者は、エラーを読めば、何を直せばよいかが分かります。

## ここがすごい
ルールの形の決まりを、型だけでは表せない「どれか 1 つだけ」という条件で書いています。型の定義に `optional` を使うだけでは、この条件は守れません。`validation` と `compact` の組み合わせで、その隙間を埋めています。

また、同じ書き方が `egress_rules` にも使われています。受信と送信で、同じ規則を別々の変数に書くので、どちらか一方だけが緩くなる心配がありません。

## まとめ
- `compact` で `null` を除き、`length` で数えると、「ちょうど 1 つ」を表せます。
- `alltrue` と `for` 式で、全部の要素に同じ条件を適用できます。
- エラーの文章に決まりを書くと、利用者がすぐに直せます。

