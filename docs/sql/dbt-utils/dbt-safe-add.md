---
title: "NULL を 0 にしてから足す safe_add"
description: "dbt-utils の safe_add。足し算に入る列をそれぞれ coalesce(列, 0) で包み、1 つでも NULL があると結果が NULL になる問題を避ける。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/safe_add.sql
lines: [18, 26]
function: "default__safe_add"
difficulty: 1
tags: [防御的プログラミング, 数値計算]
format: 2
---

## ひとことで

`safe_add` は、複数の列を足すとき、どれかが `NULL` でも全体が `NULL` にならないように、足す前に `NULL` を 0 に置き換えるマクロです。

## コード

```sql:line-numbers=18
{% set fields = [] %}

{%- for field in field_list -%}

    {% do fields.append("coalesce(" ~ field ~ ", 0)") %}

{%- endfor -%}

{{ fields|join(' +\n  ') }}
```

## 前提知識

- **`NULL` を含む計算**: `NULL` と何を足しても結果は `NULL` になる。
- **`coalesce(a, b)`**: 最初の `NULL` でない値を返す関数。`coalesce(列, 0)` は、`NULL` を 0 に置き換える。
- **`join`**: Jinja の文字列の並びを、区切りで連結するフィルタ。
- **リストの引数**: 足す列の名前を、Jinja のリストとして渡す。

## 何をしているか

### 1. 列ごとに coalesce で包む

引数で渡された列を 1 つずつ取り出し、`coalesce(列, 0)` の形の式にして、リストに入れます。

```sql:line-numbers=20
{%- for field in field_list -%}

    {% do fields.append("coalesce(" ~ field ~ ", 0)") %}

{%- endfor -%}
```

この時点で、`fields` の中身は、`NULL` が 0 に変わった式の一覧です。

### 2. 式を + でつなぐ

最後に、式を `+` でつないで 1 つの式にします。改行を入れて、読みやすい形にしています。

```sql:line-numbers=26
{{ fields|join(' +\n  ') }}
```

## ここがすごい

- **NULL の伝播を止める**: `NULL` が 1 つあるだけで結果が消えてしまう、という SQL の性質に対して、単純な対策を入れています。
- **1 か所で規則を決める**: どの列も同じ形の `coalesce` で包むので、足し算の規則が統一されます。
- **引数の形を変えた警告**: 古い形（文字列を並べた引数）で呼ばれたら警告を出し、新しいリストの形を促しています。
- **トレードオフ**: `NULL` を 0 と見なすので、「値が無い」と「0」を区別できなくなります。両者の違いが大事な集計では使えません。

## まとめ

- 足し算で `NULL` を消したいときは、各列を `coalesce(列, 0)` で包む。
- マクロで式を作ると、足す列が増えても規則が揃う。
- 「無い」と「0」の意味の違いを考えてから、この変換を使うか決める。
