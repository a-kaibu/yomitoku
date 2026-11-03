---
title: "インスタンスの種類が t 系かを、正規表現で判定する"
description: "terraform-aws-ec2-instance の is_t_instance_type。インスタンス名の先頭が t2・t3・t3a・t4g かどうかを replace の正規表現で判定する。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [6, 6]
format: 2
function: "locals（is_t_instance_type の replace による判定）"
difficulty: 3
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
T 系のインスタンスは、CPU の使い方が特殊なため、設定の一部が変わります。このモジュールは、インスタンスの種類の名前から、それが T 系かどうかを判定しています。正規表現で一致する部分だけを `"1"` に置き換え、その結果で判定しています。

## コード
```hcl:line-numbers=6
  is_t_instance_type = replace(var.instance_type, "/^t(2|3|3a|4g){1}\\..*$/", "1") == "1" ? true : false
```

## 前提知識
- 正規表現: 文字の並び方を、パターンで表す書き方です。`^` は先頭、`.*` は任意の文字の繰り返しを表します。
- `replace(文字列, パターン, 置き換え先)`: パターンに合う部分を置き換えます。パターンを `/…/` で囲むと、正規表現として扱われます。
- 三項演算子: 条件が真なら `true`、偽なら `false` を返します。

## 何をしているか
### 1. 種類の名前から、一致する部分を `"1"` にする

```hcl:line-numbers=6
  is_t_instance_type = replace(var.instance_type, "/^t(2|3|3a|4g){1}\\..*$/", "1") == "1" ? true : false
```

`t2.`、`t3.`、`t3a.`、`t4g.` のどれかで始まる名前なら、その部分が `"1"` に置き換わります。T 系でない名前は置き換わらず、元の文字列のままです。

### 2. 結果が `"1"` かで判定する

置き換えの結果が `"1"` と等しければ、T 系だと判定します。等しくなければ `false` になります。

## ここがすごい
「名前を一覧で比べる」のではなく、「名前が T 系の形をしているか」を一つの式で判定しています。`replace` の戻り値を判定に使うので、判定用の変数を別に作る必要がありません。

## まとめ
- `replace` の戻り値を使うと、一致の判定を一行で書けます。
- 正規表現は `^` で先頭を限定すると、部分一致の誤りを防げます。
- 判定の結果を変数に入れて、利用側で条件分岐すると読みやすくなります。
