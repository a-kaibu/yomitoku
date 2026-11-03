---
title: "属性リストを context と変数から合わせて作る"
description: "Cloud Posse の null-label が、呼び出し側の context と変数の属性を concat と coalesce で安全に連結する書き方。null が来ても壊れない工夫を読む。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [56, 58]
format: 2
function: "locals（input.attributes）"
difficulty: 2
tags: ["データ構造", "イディオム"]
---

## ひとことで
`attributes` は、モジュールの呼び出し側が渡した属性（context 側）と、変数で直接渡した属性を、順番どおりに 1 つのリストへまとめる部分です。どちらかが `null` でも空リストとして扱うので、エラーにならずに連結されます。

## コード
::: code-group

```hcl:line-numbers=56 [日本語訳]
    # モジュールは、変数で渡された attributes を context で渡されたリストの末尾へ付け足す
    attributes = compact(distinct(concat(coalesce(var.context.attributes, []), coalesce(var.attributes, []))))
    tags       = merge(var.context.tags, var.tags)
```

```hcl:line-numbers=56 [原文]
    # modules tack on attributes (passed by var) to the end of the list (passed by context)
    attributes = compact(distinct(concat(coalesce(var.context.attributes, []), coalesce(var.attributes, []))))
    tags       = merge(var.context.tags, var.tags)
```

:::

## 前提知識
- リスト: 順番のある値の並びです。`["a", "b"]` のように書きます。
- `concat(リストA, リストB)`: 2 つのリストを前後につなぎます。
- `coalesce(値1, 値2, ...)`: 最初に `null` でない値を返す関数です。ここでは `coalesce(x, [])` で、`null` の代わりに空リストを使えます。
- `distinct(リスト)`: 同じ値の重複を取り除きます。
- `compact(リスト)`: リストから空文字を取り除きます。
- `var.context`: 呼び出し側から、まとめて渡された設定のオブジェクトです。

## 何をしているか
### 1. 属性を連結する
```hcl:line-numbers=57
    attributes = compact(distinct(concat(coalesce(var.context.attributes, []), coalesce(var.attributes, []))))
```

`concat(coalesce(var.context.attributes, []), coalesce(var.attributes, []))` が、2 つの属性リストをつなぎます。前が context の属性、後ろが変数の属性です。`coalesce(... , [])` があるため、どちらかが `null` でも `concat` はエラーになりません。

### 2. 重複と空文字を取り除く
```hcl:line-numbers=57
    attributes = compact(distinct(concat(coalesce(var.context.attributes, []), coalesce(var.attributes, []))))
```

連結した結果を `distinct` で重複のない形にし、`compact` で空文字を取り除きます。`compact(distinct(...))` の順に外側からかけています。どちらを先にしても、この入力では大きな違いは出にくいですが、読む側は「まず重複、次に空文字」と順番をたどれます。

### 3. タグと合わせて入力を作る
```hcl:line-numbers=58
    tags       = merge(var.context.tags, var.tags)
```

同じ `input` マップの中で、タグは `merge(var.context.tags, var.tags)` で作ります。属性は連結、タグはマージという違いは、属性がリストで順番が意味を持つのに対し、タグはキーで一意に決まるマップだからです。

## ここがすごい
同じ「合成」でも、リストは順番を保ち、マップは後勝ちになるという違いを、関数を使い分けることで自然に表現しています。`coalesce` で `null` を空リストに変えてから連結しているのは、Terraform の型のルールを考えると、とても実用的な書き方です。

もし `coalesce` を使わなければ、呼び出し側が属性を省略しただけで `concat` に `null` を渡してエラーになります。このモジュールは、呼び出し側が「何も渡さない」を選べるように作られています。

## まとめ
- `coalesce` で `null` を空リストに変えると、省略された入力を安全に扱えます。
- リストは `concat`、マップは `merge` と、データの形で関数を使い分けます。
- `distinct` と `compact` は、連結のあとに通すと結果が整います。

