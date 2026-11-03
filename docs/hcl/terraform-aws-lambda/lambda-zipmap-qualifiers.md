---
title: "zipmap で名前と値の組を作り、null の項目を for 式で除く"
description: "terraform-aws-lambda の非同期呼び出し設定。zipmap で current_version と unqualified_alias の 2 つの名前に true か null を対応させ、null を for 式で取り除く書き方。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [303, 305]
format: 2
function: "locals（qualifiers）"
difficulty: 3
tags: ["データ構造", "設計パターン"]
---

## ひとことで
Lambda の非同期呼び出しの設定は、関数のバージョンごとに作ることができます。このブロックは、「現在のバージョン」と「未修飾のエイリアス」という 2 つの名前に、有効なら `true`、無効なら `null` を対応させます。次の `for_each` は、`null` の項目を取り除いたものだけを使います。

## コード
```hcl:line-numbers=303
locals {
  qualifiers = zipmap(["current_version", "unqualified_alias"], [var.create_current_version_async_event_config ? true : null, var.create_unqualified_alias_async_event_config ? true : null])
}
```

## 前提知識
- Lambda のバージョンとエイリアス: 関数の公開された版（バージョン）と、それを指す別名（エイリアス）です。
- 非同期呼び出しの設定: 関数を非同期で呼んだときの、再試行や送信先の設定です。バージョンや別名ごとに持たせられます。
- `zipmap(キーのリスト, 値のリスト)`: 2 つのリストを対応させ、キーと値のマップにする関数です。
- `true` と `null` の使い分け: `null` は、項目を省略する印として使えます。`for` 式の `if` で、`null` を取り除けます。
- 三項演算子: `条件 ? 真の値 : 偽の値` です。

## 何をしているか
### 1. 2 つの名前と、その有効化の値を並べる
```hcl:line-numbers=304
  qualifiers = zipmap(["current_version", "unqualified_alias"], [var.create_current_version_async_event_config ? true : null, var.create_unqualified_alias_async_event_config ? true : null])
```

`zipmap(["current_version", "unqualified_alias"], [...])` は、キーの一覧と値の一覧を、順番どおりに組にしてマップを作ります。キーは「現在のバージョン」「未修飾のエイリアス」の 2 つで、値はそれぞれの有効化フラグです。

### 2. 無効なものは null にする
```hcl:line-numbers=304
  qualifiers = zipmap(["current_version", "unqualified_alias"], [var.create_current_version_async_event_config ? true : null, var.create_unqualified_alias_async_event_config ? true : null])
```

値の部分では、`var.create_current_version_async_event_config ? true : null` のように、有効なら `true`、無効なら `null` を入れます。`false` ではなく `null` を使うのがポイントです。次の `for` 式で、`null` だけを取り除けます。

### 3. null を除いて、for_each に渡す
```hcl:line-numbers=308
  for_each = { for k, v in local.qualifiers : k => v if v != null && local.create && var.create_function && !var.create_layer && var.create_async_event_config }
```

`for_each` の中の `for` 式は、`v != null` の条件で `null` の項目を除きます。残った名前だけが、非同期呼び出しの設定を作る対象になります。さらに、モジュールを作るかどうかなどの条件も、同じ `if` にまとめられています。

## ここがすごい
「有効なものを `true`、無効なものは `null`」という書き方によって、条件の判定を、後の `for` 式の 1 か所に任せられます。`false` を使うと、「無効」を表しつつも、項目が残ってしまい、`for_each` で作ろうとしてしまいます。`null` によって、「無い」と「無効」を同じ扱いにできます。

また、`zipmap` を使うと、名前と値の対応が 1 行で読めます。2 つのリストの長さがそろっていれば、対応が崩れないという前提も、読み手に分かりやすい形です。

## まとめ
- `zipmap` は 2 つのリストを、キーと値のマップに変換します。
- 無効な項目は `null` にしておくと、`for` 式の `if` で取り除けます。
- 値を `null` で表すと、「無効」を項目の有無として扱えます。

