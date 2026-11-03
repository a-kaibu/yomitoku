---
title: "列の数だけ group by の番号を並べる group_by"
description: "dbt-utils の group_by。引数の数 n から「group by 1, 2, ..., n」という句を作り、列の名前を何度も書かずに済むようにする小さなマクロ。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/groupby.sql
lines: [5, 9]
function: "default__group_by"
difficulty: 1
tags: [イディオム, API設計]
format: 2
---

## ひとことで

`group_by` は、`group by` の句を番号で作る小さなマクロです。たとえば `group_by(3)` と書くと、`group by 1,2,3` という文字列を作ります。最初の 3 つの列でまとめたいときに、列の名前を一つずつ書く必要がありません。

## コード

```sql:line-numbers=5
{%- macro default__group_by(n) -%}

  group by {% for i in range(1, n + 1) -%}
      {{ i }}{{ ',' if not loop.last }}   
   {%- endfor -%}
```

## 前提知識

- **`group by`**: 同じ値の行をまとめて、集計する SQL の句。
- **列の番号**: `group by 1` のように、`select` 文の列の順番で列を指す書き方。
- **Jinja の `range`**: 数の並びを作る関数。`range(1, n + 1)` は 1 から n までの数を返す。
- **`loop.last`**: 繰り返しの中で、今が最後の要素かを表す変数。

## 何をしているか

### 1. 1 から n までの番号を回す

```sql:line-numbers=7
  group by {% for i in range(1, n + 1) -%}
      {{ i }}{{ ',' if not loop.last }}   
   {%- endfor -%}
```

`range(1, n + 1)` で 1 から n までの数を順に取り出し、その数を文字列として出します。

### 2. 最後の番号以外にだけ区切りを付ける

```sql:line-numbers=8
      {{ i }}{{ ',' if not loop.last }}   
```

`loop.last` が偽のときだけ `,` を付けます。最後の番号には付かないので、余計なカンマが残りません。

## ここがすごい

- **繰り返しを 1 行で書く**: 列の数が変わっても、引数を変えるだけで句が作られます。
- **区切りの扱いが正確**: 最後の要素だけ区切りを付けない書き方は、Jinja で定番の型です。
- **列の名前を書かない**: 列を番号で指すので、列名を変えても `group by` の句は変わりません。

## まとめ

- 数の範囲を回して、文字列を組み立てる。
- `loop.last` で、区切りを最後だけ省く。
- 番号で列を指すと、列名に依存しない書き方になる。
