---
title: "値ごとに case で振り分けて列を作る pivot"
description: "dbt-utils の pivot マクロ。与えられた値の一覧を 1 つずつ case when で判定し、集計関数で包んで列にする。横に広がる表を、SQL の式として作る。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/pivot.sql
lines: [68, 84]
function: "default__pivot"
difficulty: 2
tags: [データ構造, イディオム]
format: 2
---

## ひとことで

`pivot` は、縦の表の値を横の列に並べ替えるための SQL を作るマクロです。値の一覧を受け取り、値の数だけ `sum(case when ... then 1 else 0 end)` の式を作ります。`group by` と組み合わせると、ピボット表（クロス集計）になります。

## コード

```sql:line-numbers=68
  {% for value in values %}
    {{ agg }}(
      {% if distinct %} distinct {% endif %}
      case
      when {{ column }} {{ cmp }} '{{ dbt.escape_single_quotes(value) }}'
        then {{ then_value }}
      else {{ else_value }}
      end
    )
    {% if alias %}
      {% if quote_identifiers %}
            as {{ adapter.quote(prefix ~ value ~ suffix) }}
      {% else %}
        as {{ dbt_utils.slugify(prefix ~ value ~ suffix) }}
      {% endif %}
    {% endif %}
    {% if not loop.last %},{% endif %}
```

## 前提知識

- **ピボット（pivot）**: 縦に並んだ値を、横の列に展開すること。集計の表でよく使われる。
- **`case when ... then ... else ... end`**: 条件に応じて値を変える式。
- **集計関数**: `sum` や `count` など、複数の行を 1 つの値にまとめる関数。
- **`group by`**: グループごとに集計する指定。
- **`dbt.escape_single_quotes()`**: 文字列の中の引用符を、SQL で安全に書けるように変換する dbt のマクロ。

## 何をしているか

### 1. 値の数だけ、列の式を作る

`for` で値を 1 つずつ取り出し、その値に対応する列を 1 つ作ります。

```sql:line-numbers=68
  {% for value in values %}
    {{ agg }}(
      {% if distinct %} distinct {% endif %}
      case
      when {{ column }} {{ cmp }} '{{ dbt.escape_single_quotes(value) }}'
        then {{ then_value }}
      else {{ else_value }}
      end
```

`when 列 = '値' then 1 else 0 end` が、その行が値に一致するかどうかを 1 と 0 にします。`sum` で包むと、一致した行の数が数えられます。

### 2. 列の名前を付ける

`alias` が真なら、値の名前を列名として付けます。引用符や接頭辞、接尾辞も、引数で指定できます。

```sql:line-numbers=77
    {% if alias %}
      {% if quote_identifiers %}
            as {{ adapter.quote(prefix ~ value ~ suffix) }}
      {% else %}
        as {{ dbt_utils.slugify(prefix ~ value ~ suffix) }}
      {% endif %}
    {% endif %}
```

列と列の間には、カンマを付けます。最後の列にはカンマを付けない、という判定を `loop.last` で行います。

## ここがすごい

- **1 行ずつの判定を、集計で列にまとめる**: 「値が一致する行の数」を、`case` と `sum` の組み合わせで横に並べます。
- **値を Jinja が生成する**: 値の数が変わっても、マクロの呼び出しを変えるだけで、列の数が自動的に合います。
- **引用符を安全に扱う**: 値に引用符が含まれても壊れないよう、`escape_single_quotes` を使っています。
- **トレードオフ**: 列の数は値の数で決まるので、値がとても多いと、表が横に広がりすぎます。値の数の上限を考える必要があります。

## まとめ

- 縦の値を横の列に並べるには、値ごとの `case` と集計の組み合わせが基本。
- Jinja の繰り返しで列を作ると、値の増減に自動的に対応できる。
- 値に引用符が含まれる場合は、エスケープを忘れないようにする。
