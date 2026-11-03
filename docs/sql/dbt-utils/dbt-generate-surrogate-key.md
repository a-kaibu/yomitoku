---
title: "複数の列から代理キーを作る小さなマクロ"
description: "dbt-utils の generate_surrogate_key。各列を文字列にそろえ、NULL を目印の文字列に置き換えてから連結し、ハッシュ化して一意なキーにする。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/generate_surrogate_key.sql
lines: [5, 27]
function: "default__generate_surrogate_key"
difficulty: 2
tags: [ハッシュ, イディオム]
format: 2
---

## ひとことで

`generate_surrogate_key` は、複数の列の値から、1 つの代わりのキー（代理キー）を作るマクロです。`dbt` でモデルを作るとき、もとの主キーが無いか、複数の列の組み合わせで行を一意にしたいときに使います。

## コード

```sql:line-numbers=5
{%- macro default__generate_surrogate_key(field_list) -%}

{%- if var('surrogate_key_treat_nulls_as_empty_strings', False) -%}
    {%- set default_null_value = "" -%}
{%- else -%}
    {%- set default_null_value = '_dbt_utils_surrogate_key_null_' -%}
{%- endif -%}

{%- set fields = [] -%}

{%- for field in field_list -%}

    {%- do fields.append(
        "coalesce(cast(" ~ field ~ " as " ~ dbt.type_string() ~ "), '" ~ default_null_value  ~"')"
    ) -%}

    {%- if not loop.last %}
        {%- do fields.append("'-'") -%}
    {%- endif -%}

{%- endfor -%}

{{ dbt.hash(dbt.concat(fields)) }}
```

## 前提知識

- **dbt**: SQL の `SELECT` 文をモデルとして管理し、テーブルやビューを作るツール。`{% macro %}` でマクロ（再利用する部品）を書ける。
- **Jinja**: `{{ }}` や `{% %}` を使うテンプレートの言語。SQL を書く前に、繰り返しや条件分岐を展開できる。
- **代理キー（surrogate key）**: 元のデータにはない、行を一意に決めるための人工のキー。
- **ハッシュ**: 任意の長さの文字列を、固定の長さの値に変換する関数。同じ入力からは同じ値が出る。
- **`NULL`**: 値が無いことを表す。文字列にすると通常の連結で消えてしまうことがある。

## 何をしているか

### 1. NULL の代わりの値を決める

`NULL` を含むと連結の結果が `NULL` になってしまうため、目印の値を用意します。設定が有効なら空文字、そうでなければ専用の文字列を使います。

```sql:line-numbers=7
{%- if var('surrogate_key_treat_nulls_as_empty_strings', False) -%}
    {%- set default_null_value = "" -%}
{%- else -%}
    {%- set default_null_value = '_dbt_utils_surrogate_key_null_' -%}
{%- endif -%}
```

### 2. 各列を文字列にして、区切りを入れる

列の並びを 1 つずつ見て、`cast` で文字列にし、`coalesce` で `NULL` を目印に置き換えます。列と列の間には `'-'` を入れます。

```sql:line-numbers=15
{%- for field in field_list -%}

    {%- do fields.append(
        "coalesce(cast(" ~ field ~ " as " ~ dbt.type_string() ~ "), '" ~ default_null_value  ~"')"
    ) -%}

    {%- if not loop.last %}
        {%- do fields.append("'-'") -%}
    {%- endif -%}
```

`loop.last` は、いま見ている列が最後かどうかを表す Jinja の変数です。最後以外にだけ区切りを足します。

### 3. 連結してハッシュにする

最後に、作った式をすべて連結し、ハッシュ関数で固定長の値にします。

```sql:line-numbers=27
{{ dbt.hash(dbt.concat(fields)) }}
```

`dbt.concat` と `dbt.hash` は、データベースの種類ごとに正しい関数名へ変換されるマクロです。

## ここがすごい

- **区切りの `'-'` で、値の並びの曖昧さを減らしている**: `('a1', 'b')` と `('a', '1b')` が同じ文字列になるのを、区切りで防ぎやすくしています。
- **NULL を専用の文字列にしている**: 空文字と NULL を区別するため、既定では `_dbt_utils_surrogate_key_null_` という特別な値を使います。
- **データベースの違いを吸収している**: 文字列型やハッシュの関数名は、マクロが各データベース向けに変換します。
- **トレードオフ**: 区切りを使っても、値に区切り文字そのものが入る場合は衝突の可能性が残ります。値の性質を知ったうえで使う必要があります。

## まとめ

- `NULL` は連結の前に目印の値へ置き換えると、キーの作り方が安定する。
- 列の区切りを入れると、値の並びの違いが文字列にも残る。
- 同じ入力から同じキーが作れるので、行の同一性を確かめるのに使える。
