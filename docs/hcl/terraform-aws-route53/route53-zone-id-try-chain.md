---
title: "ゾーンを作ったか参照しただけかで、ID を一本化する"
description: "terraform-aws-route53 の hosted zone ID。新規作成・VPC を無視して作成・既存の参照という 3 通りの結果を、try の候補順で 1 つの値にまとめる。"
language: hcl
project: "terraform-aws-route53"
repo: https://github.com/terraform-aws-modules/terraform-aws-route53
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "883f987d6bb328c09bd4dfc5a04024534b371d59"
file: main.tf
lines: [1, 4]
format: 2
function: "locals（zone_id・zone_name）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Route 53 の hosted zone（DNS のゾーン）は、このモジュールの中で 3 通りの方法のどれかで用意されます。新しく作る、VPC を無視して作る、既存のものを名前で探して参照する、の 3 つです。このコードは、3 つのうち存在するものの ID と名前を、ひとつの `locals` の値にまとめます。

## コード
```hcl:line-numbers=1
locals {
  zone_id   = try(aws_route53_zone.this[0].id, aws_route53_zone.ignore_vpc[0].id, data.aws_route53_zone.this[0].id, null)
  zone_name = try(aws_route53_zone.this[0].name, aws_route53_zone.ignore_vpc[0].name, data.aws_route53_zone.this[0].name, null)
}
```

## 前提知識
- Route 53: AWS の DNS サービスです。ドメインの名前解決の情報を「ホストゾーン（hosted zone）」にまとめて管理します。
- ゾーン ID: ホストゾーンを一意に示す識別子です。レコードを作るときに必ず必要になります。
- `data` ブロック: 既に存在するリソースの情報を読み取るための書き方です。作るのではなく、参照します。
- `locals`: モジュールの中だけで使う、名前付きの値です。何度も使う式を 1 か所にまとめられます。
- `try(A, B, C, ...)`: 左から順に評価し、最初にエラーにならなかった値を返します。全部エラーなら、最後の値（ここでは `null`）になります。
- `count` と `[0]`: `count` が 0 のリソースは存在しないので、`[0]` で参照すると評価がエラーになります。

## 何をしているか
### 1. 候補を左から順に並べる

```hcl:line-numbers=2
  zone_id   = try(aws_route53_zone.this[0].id, aws_route53_zone.ignore_vpc[0].id, data.aws_route53_zone.this[0].id, null)
```

`try` は、左の候補から順に試します。例えば、新しくゾーンを作った場合は `aws_route53_zone.this[0]` が存在するので、その ID が使われます。残りの候補は評価されません。

この順番は、どの場合にどの候補が存在するかを考えて決められています。`this` は通常の作成、`ignore_vpc` は VPC の情報を無視して作成、`data` は既存のゾーンを探して参照したときです。3 つは同時には作られないので、存在するものは必ず 1 つだけです。

### 2. 名前も同じ順番で選ぶ

```hcl:line-numbers=3
  zone_name = try(aws_route53_zone.this[0].name, aws_route53_zone.ignore_vpc[0].name, data.aws_route53_zone.this[0].name, null)
```

ゾーン名も、ID と同じ候補の順番で選びます。ID と名前が必ず同じ出所から来るので、片方だけ別のゾーンを指す事故が起きにくくなります。

### 3. 全部存在しなければ null

4 つ目の候補の `null` は、どのゾーンも作られていないときの最後の受け皿です。`try` は、すべての候補がエラーのときに最後の値を返すので、`null` が使われます。これで、後の処理は `local.zone_id` が `null` かどうかで、ゾーンが無い場合を判断できます。

## ここがすごい
同じ意味の値を、3 つの違うリソースから取り出す処理を、1 行の `try` にまとめています。もし `if` で分岐して書こうとすると、「どの分岐でどの値を使うか」を毎回書く必要があり、読みにくくなります。

また、ID と名前を同じ候補の順で揃えているのが大切です。将来、候補を 1 つ増やすときも、2 つの行に同じ順番で追加すればよく、ずれにくい形になっています。

## まとめ
- `try(候補1, 候補2, ..., 最後の値)` で、存在するものを左から拾えます。
- 作り方が違う複数のリソースを、1 つの値にまとめられます。
- 同じ意味の値（ID と名前など）は、同じ候補の順番で揃えると、ずれを防げます。
