---
title: "文字列を識別子の形に変える slugify"
description: "dbt-utils の slugify。文字列を小文字にし、空白や - を _ に置き換え、英数字と _ だけを残す。数字で始まるときは先頭に _ を付ける。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/jinja_helpers/slugify.sql
lines: [1, 5]
function: "slugify(string)"
difficulty: 2
tags: [文字列処理, 正規表現]
format: 2
---

## ひとことで

`slugify` は、どんな文字列でも、SQL の名前として使える形に整えるマクロです。空白や記号を `_` に変え、先頭が数字なら `_` を付けて、名前として不正な文字を取り除きます。

## コード

```sql:line-numbers=1
{% macro slugify(string) %}

{% if not string %}
{{ return('') }}
{% endif %}
```

## 前提知識

- **識別子（identifier）**: 表や列に付ける名前。使える文字の範囲が決まっている。
- **正規表現による置換**: `modules.re.sub` で、パターンに一致する部分を別の文字列に置き換える処理。
- **`[^a-z0-9_]`**: 小文字、数字、`_` 以外の文字を表す集合。`^` は否定。
- **`lower`**: 文字列を小文字にする Jinja のフィルタ。

## 何をしているか

### 1. 小文字にする

```sql:line-numbers=8
{% set string = string | lower %}
```

まず、文字列をすべて小文字にします。大文字と小文字の違いを、先に消しておきます。

### 2. 空白と - を _ にする

```sql:line-numbers=10
{% set string = modules.re.sub('[ -]+', '_', string) %}
```

空白や `-` が続いたところを、一つの `_` に置き換えます。区切りの記号を、名前として使える形に揃えます。

### 3. 使えない文字を取り除く

```sql:line-numbers=12
{% set string = modules.re.sub('[^a-z0-9_]+', '', string) %}
```

小文字、数字、`_` 以外の文字を、すべて取り除きます。

### 4. 数字で始まるときは先頭に _ を付ける

```sql:line-numbers=14
{% set string = modules.re.sub('^[0-9]', '_' + string[0], string) %}
```

先頭が数字のときは、その数字を `_` に置き換えて、先頭の文字を残します。名前を数字で始められない規則に対応するためです。

## ここがすごい

- **正規表現の段階を分ける**: 小文字化、区切りの変換、取り除き、先頭の処理を、一行ずつ分けています。読み手は段階を追えます。
- **空の文字列を最初に返す**: 空の入力は、特別な処理を書かずに、空の結果を返します。
- **同じ規則を一箇所に持つ**: 名前の規則を一つのマクロにまとめるので、ほかの場所で同じ規則を書き直さずに済みます。

## まとめ

- 文字列の整形は、段階ごとに正規表現を一つずつ当てると読みやすい。
- 名前の制約は、先頭の文字の規則まで含めて考える。
- 入力が空のときの扱いを先に決めると、後の処理が簡単になる。
