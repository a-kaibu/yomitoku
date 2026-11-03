---
title: "無効化されたモジュールの出力を空文字にする"
description: "Cloud Posse の null-label の output 定義。enabled が false のとき、id や id_full を空文字として返す三項演算子の使い方を読む。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: outputs.tf
lines: [1, 9]
format: 2
function: "output（id・id_full）"
difficulty: 1
tags: ["イディオム", "防御的プログラミング"]
---

## ひとことで
`outputs.tf` の 2 つの `output` は、モジュールが有効（`enabled = true`）なら計算済みの ID を返し、無効なら空文字を返します。呼び出し側は、モジュールを使わないときも同じ参照の書き方で値を受け取れます。

## コード
```hcl:line-numbers=1
output "id" {
  value       = local.enabled ? local.id : ""
  description = "Disambiguated ID string restricted to `id_length_limit` characters in total"
}

output "id_full" {
  value       = local.enabled ? local.id_full : ""
  description = "ID string not restricted in length"
}
```

## 前提知識
- `output` ブロック: モジュールの結果として外へ返す値を定義します。呼び出し側は `module.名前.id` のように参照します。
- `value`: `output` が返す式です。
- `description`: 値の説明文です。ドキュメントを自動生成するツールが読みます。
- 三項演算子: `条件 ? 真の値 : 偽の値` で、条件によって値を選びます。
- `local.enabled`: `locals` で決めた「このモジュールを有効にするか」の真偽値です。

## 何をしているか
### 1. 有効なときだけ ID を返す
```hcl:line-numbers=1
output "id" {
  value       = local.enabled ? local.id : ""
  description = "Disambiguated ID string restricted to `id_length_limit` characters in total"
}
```

`value = local.enabled ? local.id : ""` は、`enabled` が真なら `local.id` を、偽なら空文字を返します。`description` には「id_length_limit 以内に収めた ID」と書いてあり、どのように作られた値かが読み手に伝わります。

### 2. 制限なしの ID も同じ規則で返す
```hcl:line-numbers=6
output "id_full" {
  value       = local.enabled ? local.id_full : ""
  description = "ID string not restricted in length"
}
```

`id_full` は、長さの制限をかけない ID です。同じ三項演算子で、無効なときは空文字を返します。`id` と `id_full` が同じ規則なので、呼び出し側は「無効なら空」という 1 つの約束だけを覚えればよくなります。

## ここがすごい
無効なモジュールでも同じ出力名で値を参照できるので、呼び出し側は「有効なときだけ参照する」という分岐を書かずに済みます。出力に `null` ではなく空文字を使っているため、値は常に文字列として扱えます。

一方で、どのリソースも作らないのに出力だけ空で返す設計なので、呼び出し側が「空文字なら作られていない」と判断できます。モジュールの中で作るものと、外へ返す値の関係を、この 2 行で明確にしています。

この 2 行は小さいですが、モジュールを使う側の書き方にも影響します。たとえば、他の設定で `module.label.id` を名前の一部として使うとき、無効化されたモジュールでは空文字が入るだけで、参照そのものは壊れません。値が入るかどうかを、利用者が `enabled` の一つの変数で切り替えられる、という形になっています。

## まとめ
- `output` の値は、モジュールの有効・無効に合わせて三項演算子で決められます。
- 無効のときに空文字を返すと、呼び出し側の参照を変えずに済みます。
- `description` を書いておくと、値の意味が呼び出し側に伝わります。

