---
title: "列の値を一覧にして Jinja の変数に取り込む"
description: "dbt-utils の get_column_values。列の値を group by で重複なく集め、load_result で結果を取り出して、Jinja のリストとして返す。表が無いときは既定値を使う。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/get_column_values.sql
lines: [36, 50]
function: "default__get_column_values"
difficulty: 3
tags: [イディオム, 標準ライブラリ]
format: 2
---

## ひとことで

`get_column_values` は、表のある列に入っている値を一覧にして、Jinja の変数として返すマクロです。たとえば、`pivot` で列にする値を、データから取り出して使えます。SQL の結果を、テンプレートの中で値として扱うための仕組みです。

## コード

```sql:line-numbers=36
            select
                {{ column }} as value

            from {{ target_relation }}

            {% if where is not none %}
            where {{ where }}
            {% endif %}

            group by {{ column }}
            order by {{ order_by }}

            {% if max_records is not none %}
            limit {{ max_records }}
            {% endif %}
```

## 前提知識

- **Jinja と SQL の関係**: dbt は、まず Jinja で SQL を組み立て、その SQL をデータベースで実行する。
- **`statement` と `load_result`**: Jinja の中で SQL を実行し、結果を変数として受け取る dbt の仕組み。
- **`group by` で重複をなくす**: 同じ値を 1 行にまとめて、一覧を作る。
- **`order by count(*) desc`**: 出現の多い順に並べる指定。既定の並び順。
- **`map(attribute=0)`**: 結果の各行から、1 番目の列を取り出す Jinja のフィルタ。

## 何をしているか

### 1. 値を重複なく集める SQL を組み立てる

列の値を `group by` で集め、既定では出現の多い順に並べます。`where` や `limit` の条件は、あれば追加されます。

```sql:line-numbers=41
            {% if where is not none %}
            where {{ where }}
            {% endif %}

            group by {{ column }}
            order by {{ order_by }}

            {% if max_records is not none %}
            limit {{ max_records }}
            {% endif %}
```

`group by` で 1 つの値を 1 行にするので、一覧に同じ値が二度出ません。

### 2. 結果を取り出してリストにする

`load_result` で SQL の結果を受け取り、`data` から 1 列目を取り出して、Jinja のリストにします。

```sql:line-numbers=58
    {%- if value_list and value_list['data'] -%}
        {%- set values = value_list['data'] | map(attribute=0) | list %}
        {{ return(values) }}
```

この時点で、`values` は普通のリストです。`pivot` マクロなどに、そのまま渡せます。

### 3. 表が無いときは既定値を返す

表が存在しない場合は、エラーにするか、既定値を返すかを、`default` の引数で決めます。

```sql:line-numbers=27
        {%- elif not relation_exists and default is not none -%}

          {{ log("Relation " ~ target_relation ~ " does not exist. Returning the default value: " ~ default) }}

          {{ return(default) }}
```

## ここがすごい

- **SQL の結果をテンプレートの値として使う**: データに応じて列の並びを決める、という使い方が可能になります。
- **既定値で失敗を避ける**: 表がまだ無い状態でも、既定値を返せるので、全体の処理が止まりにくくなります。
- **並び順と件数の上限を引数にする**: 出現の多い順に、上位だけを取るといった要求にも、引数で応えられます。
- **トレードオフ**: 実行時に SQL を走らせるため、テンプレートの評価に時間がかかります。値の数が極端に多いと、列が増えすぎることにも注意が必要です。

## まとめ

- SQL の結果を Jinja の値として取り込むには、`load_result` と `map` を組み合わせる。
- 値の一覧は `group by` で作ると、重複のない形になる。
- 存在しない表への備えとして、既定値を用意しておくと安定する。
