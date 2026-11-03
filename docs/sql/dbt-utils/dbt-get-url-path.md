---
title: "URL からパスの部分を取り出す get_url_path"
description: "dbt-utils の get_url_path。列の URL から http:// と https:// を取り除き、最初の / の位置を求め、? の前までを切り出してパスにする。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright (c) 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/web/get_url_path.sql
lines: [5, 34]
function: "default__get_url_path"
difficulty: 3
tags: [文字列処理, イディオム]
format: 2
---

## ひとことで

`get_url_path` は、URL の文字列からパスの部分だけを取り出すマクロです。たとえば `https://example.com/docs/a?x=1` からは、`/docs/a` を取り出します。ホストの名前は、`get_url_host` という別のマクロで取り出します。

## コード

```sql:line-numbers=5
{% macro default__get_url_path(field) -%}

    {%- set stripped_url =
        dbt.replace(
            dbt.replace(field, "'http://'", "''"), "'https://'", "''")
    -%}

    {%- set first_slash_pos -%}
        coalesce(
            nullif({{ dbt.position("'/'", stripped_url) }}, 0),
            {{ dbt.position("'?'", stripped_url) }} - 1
            )
    {%- endset -%}

    {%- set parsed_path =
        dbt.split_part(
            dbt.right(
                stripped_url,
                dbt.length(stripped_url) ~ "-" ~ first_slash_pos
                ),
            "'?'", 1
            )
    -%}

    {{ dbt.safe_cast(
        parsed_path,
        dbt.type_string()
    )}}

{%- endmacro %}
```

## 前提知識

- **`position`**: 文字列の中で、別の文字列が何番目にあるかを返す関数。見つからないと 0。
- **`nullif`**: 二つの値が等しければ `NULL` を返す関数。ここでは 0 を `NULL` にする。
- **`split_part`**: 区切りの文字で分けて、指定した番目の部分を取り出す関数。
- **`dbt.*` の関数**: 方言の違いを吸収するために dbt が用意したマクロ群。

## 何をしているか

### 1. プロトコルを取り除く

```sql:line-numbers=7
    {%- set stripped_url =
        dbt.replace(
            dbt.replace(field, "'http://'", "''"), "'https://'", "''")
    -%}
```

`http://` と `https://` を空文字に置き換えます。残った文字列は、ホスト名から始まります。

### 2. 最初の / の位置を求める

```sql:line-numbers=12
    {%- set first_slash_pos -%}
        coalesce(
            nullif({{ dbt.position("'/'", stripped_url) }}, 0),
            {{ dbt.position("'?'", stripped_url) }} - 1
            )
    {%- endset -%}
```

`/` の位置を探します。見つからないときは、`?` の位置から 1 を引いた値を使います。`nullif` は、位置が 0 のときに `NULL` に変えて、`coalesce` で次の候補に逃がしています。

### 3. パスを切り出す

```sql:line-numbers=19
    {%- set parsed_path =
        dbt.split_part(
            dbt.right(
                stripped_url,
                dbt.length(stripped_url) ~ "-" ~ first_slash_pos
                ),
            "'?'", 1
            )
    -%}
```

最初の `/` から後ろを取り出し、`?` より前の部分だけを残します。最後に、文字列の型にキャストします。

## ここがすごい

- **候補を順に試す**: 最初の `/` が無い URL でも、`coalesce` で次の候補を使うので、どの形の URL にも対応します。
- **方言に依存しない**: 関数を `dbt.*` の形で書くので、データベースを変えても同じ仕組みで動きます。
- **段階を変数に分ける**: 途中の結果に名前を付けてあるので、どの段階が何をしているかを追えます。

## まとめ

- 文字列の位置は、`position` で求めて `nullif` と `coalesce` で整える。
- 文字列の切り出しは、`right` と `split_part` を組み合わせて作る。
- 方言に依存しない書き方は、`dbt.*` の関数を使うと実現できる。
