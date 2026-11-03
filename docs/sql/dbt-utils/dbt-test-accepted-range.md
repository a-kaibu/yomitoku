---
title: "値が範囲の中に収まっているかを確かめるテスト"
description: "dbt-utils の accepted_range テスト。最小値と最大値の外にある行を or と not で集める。1 = 2 を先頭に置き、条件がどれも無いときも安全に動くようにしている。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/generic_tests/accepted_range.sql
lines: [7, 15]
function: "default__test_accepted_range"
difficulty: 2
tags: [防御的プログラミング, 数値計算]
format: 2
---

## ひとことで

`accepted_range` は、ある列の値が、決めた最小値と最大値の間に入っているかを確かめるテストです。範囲の外の行を集めて返します。境界の値を含めるかどうかも、引数で切り替えられます。

## コード

```sql:line-numbers=7
with meet_condition as(
  select *
  from {{ model }}
),

validation_errors as (
  select *
  from meet_condition
  where
```

## 前提知識

- **テストの約束**: dbt のテストは、失敗した行を返す SQL で書く。空の結果なら合格。
- **`not`**: 条件の真と偽を反対にする演算子。
- **`or`**: どちらかが真なら真になる演算子。
- **`1 = 2`**: いつも偽になる条件。
- **Jinja の条件**: `{% if %}` で、引数の値によって SQL の一部を書き分ける。

## 何をしているか

### 1. 常に偽の条件を先頭に置く

`validation_errors` の `where` は、まず `1 = 2` から始まります。

```sql:line-numbers=17
    1 = 2
```

この条件は、どんな行でも偽です。ただし、後ろに `or` でつなぐ条件が付くので、その後の書き方が常に正しい形になります。引数の最小値も最大値も無いときは、この 1 行だけが残り、結果は空になります。

### 2. 最小値より小さい行を集める

最小値が指定されていれば、`or not 列 >= 最小値` を付けます。`not` で条件を反対にして、範囲の外の行だけを残します。

```sql:line-numbers=21
    or not {{ column_name }} > {{- "=" if inclusive }} {{ min_value }}
```

`inclusive` が真なら `>=`、偽なら `>` を使います。`{{- "=" if inclusive }}` の部分が、この切り替えです。

### 3. 最大値より大きい行を集める

最大値についても、同じ形で `or not 列 <= 最大値` を付けます。

```sql:line-numbers=26
    or not {{ column_name }} < {{- "=" if inclusive }} {{ max_value }}
```

最後に、条件に当たった行をそのまま返します。

```sql:line-numbers=30
select *
from validation_errors
```

## ここがすごい

- **空の条件を先頭に置く**: 条件が 0 個でも、`where` が必ず正しく書けるように、常に偽の式で始めています。Jinja で `or` の数が変わっても、SQL の形が崩れません。
- **`not` で合格の条件を反対にする**: 「範囲に入る」を書く代わりに、「範囲から外れる」を書いて集めるので、失敗した行だけを返せます。
- **境界の扱いを引数で切り替える**: `>=` と `>` を、1 つのフラグで書き分けています。
- **トレードオフ**: `NULL` の行は、比較の結果が `NULL` になり、`not` を付けても拾われないことがあります。`NULL` の検査は、別のテスト（`not_null`）で行うのが前提です。

## まとめ

- 条件を組み立てる SQL は、常に偽の式を先頭に置くと、どの組み合わせでも形が崩れない。
- 「合格の条件」を `not` で反対にすると、失敗の行だけを集められる。
- 境界を含むかどうかは、比較演算子の切り替えとして表せる。
