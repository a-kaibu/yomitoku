---
title: "問い合わせの結果を列名ごとの辞書にする get_query_results_as_dict"
description: "dbt-utils の get_query_results_as_dict。問い合わせを実行し、列名をキー、その列の値の並びを値とする辞書を作って返す。解析の段階では空の辞書を返す。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_query_results_as_dict.sql
lines: [9, 24]
function: "default__get_query_results_as_dict"
difficulty: 2
tags: [データ構造, API設計]
format: 2
---

## ひとことで

`get_query_results_as_dict` は、問い合わせの結果を、Jinja で扱いやすい辞書の形に変えるマクロです。辞書のキーは列の名前で、値はその列の値の並びになります。たとえば「`name` 列の値の一覧」を、列の名前で直接取り出せます。

## コード

```sql:line-numbers=9
    {%- call statement('get_query_results', fetch_result=True,auto_begin=false) -%}

        {{ query }}

    {%- endcall -%}

    {% set sql_results={} %}

    {%- if execute -%}
        {% set sql_results_table = load_result('get_query_results').table.columns %}
        {% for column_name, column in sql_results_table.items() %}
            {% do sql_results.update({column_name: column.values()}) %}
        {% endfor %}
    {%- endif -%}

    {{ return(sql_results) }}
```

## 前提知識

- **辞書（dict）**: キーと値の組を並べたデータの形。Jinja では `{}` で作れる。
- **`statement`**: 問い合わせを実行し、結果を後で読めるようにする dbt の仕組み。
- **`load_result`**: 実行した問い合わせの結果を読むための関数。
- **`execute`**: 実際に問い合わせを走らせる段階かどうかを表す変数。

## 何をしているか

### 1. 問い合わせを実行する

```sql:line-numbers=9
    {%- call statement('get_query_results', fetch_result=True,auto_begin=false) -%}

        {{ query }}

    {%- endcall -%}
```

`statement` ブロックの中で、渡された問い合わせを実行します。結果は `get_query_results` という名前で保存されます。

### 2. 列ごとに辞書へ入れる

```sql:line-numbers=17
    {%- if execute -%}
        {% set sql_results_table = load_result('get_query_results').table.columns %}
        {% for column_name, column in sql_results_table.items() %}
            {% do sql_results.update({column_name: column.values()}) %}
        {% endfor %}
    {%- endif -%}
```

実行段階なら、結果の列を一つずつ取り出し、列の名前をキーにして、値の並びを辞書に入れます。解析の段階では、何もせず空の辞書を返します。

## ここがすごい

- **列の名前で値を引ける**: 添字の番号を覚えずに、列の名前から値を取り出せます。
- **解析の段階を飛ばす**: 問い合わせを走らせない段階では、空の辞書を返すので、ビルドの流れを止めません。
- **結果を再利用しやすい**: 辞書にしておけば、同じ結果を何度でも読めます。

## まとめ

- 問い合わせの結果は、列の名前をキーにした辞書に変えると扱いやすい。
- 実行段階と解析段階を分けて、無駄な問い合わせを避ける。
- 結果を一度辞書にしておけば、後の処理で繰り返し使える。
