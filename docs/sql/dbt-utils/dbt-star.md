---
title: "列の名前を全部書かずに SELECT する star マクロ"
description: "dbt-utils の star マクロ。モデルの列の一覧を取り、除外する列や接頭辞、別名を付けて SELECT の列の並びを自動で作る。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/star.sql
lines: [14, 19]
function: "default__star"
difficulty: 3
tags: [イディオム, 標準ライブラリ]
format: 2
---

## ひとことで

`star` は、`SELECT *` の代わりに使うマクロです。モデルの列の名前を、データベースから取得して、一覧にした列の並びに展開します。列を除外したり、名前に接頭辞を付けたりできます。

## コード

```sql:line-numbers=14
    {% set cols = dbt_utils.get_filtered_columns_in_relation(from, except) %}

    {%- set rename_lower = {} -%}
    {%- for key, val in rename.items() -%}
        {%- do rename_lower.update({key.lower(): val}) -%}
    {%- endfor -%}
```

## 前提知識

- **`SELECT *`**: 表の全部の列を取る書き方。列の順番や名前が変わると、結果も変わる。
- **Jinja の変数と辞書**: `{% set %}` で変数を作り、`{}` の辞書に名前と値の組を入れる。
- **`for` ループ**: `{% for %}` で、一覧の要素ごとに SQL を繰り返し作る。
- **`rename` の辞書**: 列名から、新しい別名への対応を持つ辞書。
- **`lower()`**: 文字列を小文字にする。列名の比較を大文字小文字に依存しないようにする。

## 何をしているか

### 1. 列の一覧を取り、別名の対応を作る

まず、`get_filtered_columns_in_relation()` で、除外を取り除いた列の一覧を取ります。次に、別名の辞書の鍵を小文字に変えておきます。

```sql:line-numbers=14
    {% set cols = dbt_utils.get_filtered_columns_in_relation(from, except) %}

    {%- set rename_lower = {} -%}
    {%- for key, val in rename.items() -%}
        {%- do rename_lower.update({key.lower(): val}) -%}
    {%- endfor -%}
```

小文字に変えるのは、列名の大文字と小文字を区別せずに、別名の対応を探すためです。

### 2. 列を並べて、必要なら別名を付ける

続いて、一覧の列を `for` で 1 つずつ書き出します。`quote_identifiers` が真なら、列名を引用符で囲み、必要なら接頭辞や別名を付けます。

```sql:line-numbers=34
        {%- for col in cols %}
            {%- if relation_alias %}{{ relation_alias }}.{% else %}{%- endif -%}
                {%- if quote_identifiers -%}
                    {{ adapter.quote(col)|trim }}
                    {%- if col.lower() in rename_lower %} as {{ rename_lower[col.lower()] }}
                    {%- elif unquote_aliases %} as {{ (prefix ~ col ~ suffix)|trim }}
                    {%- elif prefix!='' or suffix!='' %} as {{ adapter.quote(prefix ~ col ~ suffix)|trim }}
                    {%- endif -%}
                {%- else -%}
                    {{ col|trim }}
                    {%- if col.lower() in rename_lower %} as {{ rename_lower[col.lower()] }}
                    {%- elif prefix!='' or suffix!='' %} as {{ (prefix ~ col ~ suffix)|trim }}
                    {%- endif -%}
                {%- endif -%}
            {%- if not loop.last %},{{ '\n  ' }}{%- endif -%}
        {%- endfor -%}
```

列と列の間には、カンマと改行を入れます。`loop.last` の判定で、最後の列だけはカンマを付けません。

## ここがすごい

- **列の並びを人が書かずに済む**: モデルの列が増減しても、マクロの呼び出しはそのままで、SQL が正しく作られます。
- **大文字と小文字の揺れを吸収する**: 列名の比較を小文字でそろえることで、データベースごとの大文字の扱いの違いを避けています。
- **既定の値を多く持つ**: 引数の多くに初期値があり、単純な呼び出しは 1 つの引数で済みます。
- **トレードオフ**: 列の並びは実行時に決まるので、列が増えたときに下流の処理がそれに耐えられるかを確かめる必要があります。

## まとめ

- 列の一覧を SQL の列の並びに展開すると、列の変化に強い書き方になる。
- 比較の前に大文字と小文字をそろえると、データベースの違いで壊れにくい。
- 列を並べる処理は、区切り文字の扱い（最後だけ付けない）が要点になる。
