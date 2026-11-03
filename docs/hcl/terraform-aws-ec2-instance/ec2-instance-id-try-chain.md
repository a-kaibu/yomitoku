---
title: "作り方が違っても、インスタンス ID を一か所で取り出す"
description: "terraform-aws-ec2-instance の instance_id。通常・AMI 無視・スポット要求の 3 通りの作り方から、存在するリソースの ID を try の候補順で選ぶ。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [16, 21]
format: 2
function: "locals（instance_id）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
このモジュールは、EC2 インスタンスを 3 通りの方法で作れます。通常の作成、AMI の変更を無視する作成、スポットインスタンスとしての要求です。出力で「作られたインスタンスの ID」を返すには、どの方法で作られたかを気にせずに、存在するものの ID を取り出す必要があります。このコードは、それを `try` の候補順で行います。

## コード
```hcl:line-numbers=16
  instance_id = try(
    aws_instance.this[0].id,
    aws_instance.ignore_ami[0].id,
    aws_spot_instance_request.this[0].spot_instance_id,
    null,
  )
```

## 前提知識
- EC2 インスタンス: AWS の仮想サーバーです。`aws_instance` は通常のインスタンス、`aws_spot_instance_request` はスポット価格で借りる要求を表すリソースです。
- スポットインスタンス: 空いている AWS の計算資源を安く借りる仕組みです。途中で止められることがあります。
- `count = 0` のリソース: 作られていないリソースです。`[0]` で参照しようとすると、評価がエラーになります。
- `try(A, B, C, D)`: 左から評価して、最初にエラーにならなかった値を返します。最後の `null` は、すべてがエラーのときの受け皿です。
- `locals`: モジュールの中で使う、名前付きの値です。

## 何をしているか
### 1. 通常のインスタンスを最初に見る

```hcl:line-numbers=17
    aws_instance.this[0].id,
```

通常の作成条件を満たしていれば、`aws_instance.this[0]` が存在するので、その ID が返されます。この時点で、残りの候補は評価されません。

### 2. AMI 無視の場合を次に見る

```hcl:line-numbers=18
    aws_instance.ignore_ami[0].id,
```

`ignore_ami` は、`ignore_ami_changes` のような設定で作られるインスタンスです。1 番目が作られていなければ、ここで ID を拾います。

### 3. スポット要求の ID を最後に見る

```hcl:line-numbers=19
    aws_spot_instance_request.this[0].spot_instance_id,
```

スポットの場合は、`aws_spot_instance_request` が作られ、その結果の `spot_instance_id` がインスタンスの ID になります。通常のインスタンスの ID とは、別の属性から取り出す必要があるので、ここで別の候補として並べられています。

### 4. すべて無ければ null

`null` は、どの経路でも作られなかったときの値です。モジュールの利用者は、`null` が返ってきたら、インスタンスが作られていないと判断できます。

## ここがすごい
作り方が 3 通りあるのに、利用者が見る出力は 1 つ、という設計です。候補を並べるだけで「今ある方」を選べるので、利用者は `if` で分けて書く必要がありません。

さらに、スポット要求は本体のインスタンスとは別のリソースで、ID の取り出し方も違います。`try` の候補に「スポット用の属性名」まで書いておくことで、呼び出し側は違いを知らずに済みます。

## まとめ
- 作り方が複数あるリソースは、`try` の候補として並べると、存在する方を簡単に拾えます。
- `count` で作られなかったリソースは、`[0]` の参照でエラーになるので、`try` の候補にしやすい性質があります。
- 出力の値は 1 つにまとめ、違いは内側に閉じ込めると、利用者の使い方が簡単になります。
