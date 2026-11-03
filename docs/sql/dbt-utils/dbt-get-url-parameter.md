---
title: "文字列の分割だけで URL のパラメータを取る"
description: "dbt-utils の get_url_parameter。formatted の名前を含む文字列を split_part で 2 回分け、値の部分を取り出す。空の値は nullif で NULL にする。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/web/get_url_parameter.sql
lines: [7, 11]
function: "default__get_url_parameter"
difficulty: 2
tags: [文字列処理, イディオム]
format: 2
---

## ひとことで

`get_url_parameter` は、URL の中にある `?page=2&...` のようなパラメータの値を取り出す SQL を作るマクロです。正規表現を使わず、`split_part` を 2 回使って、名前の後ろの値を切り出します。値が空なら `NULL` を返します。

## コード

```sql:line-numbers=7
{%- set formatted_url_parameter = "'" + url_parameter + "='" -%}

{%- set split = dbt.split_part(dbt.split_part(field, formatted_url_parameter, 2), "'&'", 1) -%}

nullif({{ split }},'')
```

## 前提知識

- **URL のパラメータ**: `?名前=値&名前=値` の形で、ページ番号などを渡す仕組み。
- **`split_part(文字列, 区切り, 番号)`**: 文字列を区切りで分け、番号目（1 から数える）の部分を返す関数。
- **`nullif(値, '')`**: 値が空文字なら `NULL` にする関数。
- **Jinja の文字列連結**: `+` と `~` で、Jinja の中の文字列をつなぐ。
- **SQL の文字列リテラル**: 引用符 `'` で囲んだ文字列。Jinja が作る SQL の中に、そのまま埋め込まれる。

## 何をしているか

### 1. 探す名前を SQL の文字列にする

`page` のような名前を受け取り、`'page='` という SQL の文字列リテラルを作ります。

```sql:line-numbers=7
{%- set formatted_url_parameter = "'" + url_parameter + "='" -%}
```

`"'" + url_parameter + "='"` は、Jinja の段階で文字列を組み立てる式です。できあがった `'page='` が、次の SQL の中で区切り文字として使われます。

### 2. 2 回の split_part で値を取り出す

まず、`'page='` で分けて、その後ろの部分を取ります。次に、その部分を `&` で分けて、先頭だけを取ります。

```sql:line-numbers=9
{%- set split = dbt.split_part(dbt.split_part(field, formatted_url_parameter, 2), "'&'", 1) -%}
```

1 回目の `split_part(..., 2)` は、区切りの後ろ側を取ります。2 回目の `split_part(..., 1)` は、その中で `&` より前の部分を取ります。こうして、次のパラメータが始まるまでの値が残ります。

### 3. 空の値を NULL にする

最後に、値が空文字なら `NULL` に変えます。

```sql:line-numbers=11
nullif({{ split }},'')
```

## ここがすごい

- **正規表現を使わない**: どのデータベースにも `split_part` はあるので、正規表現の関数の違いを気にせず書けます。
- **名前の後ろの値だけを狙う**: 区切りを 2 段階にすることで、次のパラメータとの区切りを簡単に表せています。
- **空を `NULL` に統一する**: 値が無いことを `NULL` で表すと、後の集計で扱いやすくなります。
- **トレードオフ**: `?a=1&page=2` のように、別の名前の中に `page=` が含まれると、正しく取れません。完全な URL の解析には向きません。

## まとめ

- 単純なパラメータの取り出しは、`split_part` の 2 段階で書ける。
- 区切りの文字列は、Jinja で組み立てると、名前を差し替えて使える。
- 解析の限界を理解しておくと、誤った結果に気付きやすい。
