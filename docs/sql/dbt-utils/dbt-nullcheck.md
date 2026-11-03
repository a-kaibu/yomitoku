---
title: "空文字を NULL に変えて文字列の列をそろえる"
description: "dbt-utils の nullcheck。文字列の列は nullif で空文字を NULL に変え、それ以外の列はそのまま並べる。空の値の扱いを表の全体で統一するための式を作る。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/nullcheck.sql
lines: [5, 21]
function: "default__nullcheck"
difficulty: 1
tags: [防御的プログラミング, 文字列処理]
format: 2
---

## ひとことで

`nullcheck` は、列の並びを受け取り、文字列の列だけ空文字を `NULL` に変える `select` の部分を作るマクロです。空文字と `NULL` を別々に扱う集計の誤りを防ぐために使われます。

## コード

```sql:line-numbers=5
{% macro default__nullcheck(cols) %}
{%- for col in cols %}

    {% if col.is_string() -%}

    nullif({{col.name}},'') as {{col.name}}

    {%- else -%}

    {{col.name}}

    {%- endif -%}

{%- if not loop.last -%} , {%- endif -%}

{%- endfor -%}
{% endmacro %}
```

## 前提知識

- **空文字（`''`）と `NULL`**: 空文字は「値はあるが中身が無い」、`NULL` は「値が無い」を表す。データベースでは別物として扱われる。
- **`nullif(a, b)`**: `a` と `b` が等しければ `NULL`、そうでなければ `a` を返す関数。
- **`is_string()`**: 列の型が文字列かどうかを調べる dbt のメソッド。
- **`col.name`**: 列の名前を取り出す属性。
- **`loop.last`**: 繰り返しの最後かどうか。

## 何をしているか

### 1. 文字列の列は空文字を NULL にする

列が文字列なら、`nullif(列, '')` で空文字を `NULL` に変えます。

```sql:line-numbers=8
    {% if col.is_string() -%}

    nullif({{col.name}},'') as {{col.name}}
```

### 2. それ以外の列はそのまま並べる

数値や日付の列は、空文字の概念が無いので、そのまま列の名前を書きます。

```sql:line-numbers=12
    {%- else -%}

    {{col.name}}
```

### 3. カンマで区切る

最後の列以外には、カンマを付けます。

```sql:line-numbers=18
{%- if not loop.last -%} , {%- endif -%}
```

## ここがすごい

- **型に応じて処理を変える**: 文字列の列だけに変換を入れるので、数値の列に余計な関数がかかりません。
- **空文字の混入を表全体で止める**: 集計の前に 1 回変換することで、`count` や `avg` の結果が、空文字と `NULL` の違いで変わるのを防ぎます。
- **式を生成するだけ**: マクロは SQL の一部を返すだけなので、どの `select` にも組み込めます。
- **トレードオフ**: 空文字に本当の意味がある場合は、`NULL` に変えると情報が失われます。変換してよいかは、データの意味を確かめてから決める必要があります。

## まとめ

- 空文字と `NULL` の違いは、集計の結果を変えることがある。
- 文字列の列だけ `nullif` で変換すると、型を壊さずに空の値をそろえられる。
- マクロで SQL の部品を作ると、同じ変換を何度も書かずに済む。
