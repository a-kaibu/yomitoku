---
title: "実行環境の順番を、指定が無ければキーで補う"
description: "terraform-aws-batch の job queue の compute_environment_order。order が無いときは、一覧のキーを順番として使う。"
language: hcl
project: "terraform-aws-batch"
repo: https://github.com/terraform-aws-modules/terraform-aws-batch
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "93a3e2ec1ab003dde08e95b3da055ba040c04ca9"
file: main.tf
lines: [307, 308]
format: 2
function: "dynamic \"compute_environment_order\"（coalesce による order の補完）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
AWS Batch のジョブキューは、実行環境を優先順に並べます。利用者が順番を書かなければ、このモジュールはマップのキーをそのまま順番として使います。`coalesce` で、その補い方を一行で書いています。

## コード
```hcl:line-numbers=307
      compute_environment = aws_batch_compute_environment.this[compute_environment_order.value.compute_environment_key].arn
      order               = try(coalesce(compute_environment_order.value.order, compute_environment_order.key), null)
```

## 前提知識
- ジョブキューの順番: 小さい番号のほうが、先に使われる実行環境です。
- `coalesce`: 最初に `null` でも空でもない値を返します。
- `dynamic` ブロック: 一覧の要素ごとに、ブロックを作ります。

## 何をしているか
### 1. 実行環境の場所を指す

```hcl:line-numbers=307
      compute_environment = aws_batch_compute_environment.this[compute_environment_order.value.compute_environment_key].arn
```

キーで指定された実行環境の ARN を、`compute_environment` に入れます。

### 2. 順番を、指定か既定のキーから決める

```hcl:line-numbers=308
      order               = try(coalesce(compute_environment_order.value.order, compute_environment_order.key), null)
```

`order` が指定されていれば、その値を使います。無ければ、マップのキーを順番にします。キーは文字列なので、順番の数値としてはそのまま使えない場合がありますが、利用者は通常、数値を指定するので、この補いは指定を省いたときの保険として働きます。

## ここがすごい
利用者は、順番を書いても書かなくても、同じ形で書けます。`coalesce` の後ろに、マップの既定の値を置くことで、省略を許しています。

## まとめ
- `coalesce` の後ろに既定値を置くと、省略を許す設定を簡単に作れます。
- `dynamic` の中で、要素ごとに既定値を補えます。
- 既定値の型が合うかを、利用者向けに確認しておくと安心です。
