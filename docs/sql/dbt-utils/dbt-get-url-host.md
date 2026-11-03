---
title: "URL からホスト名だけを剥がし取る"
description: "dbt-utils の get_url_host。android-app や http や https の接頭辞を replace で消し、split_part で最初の / と ? より前を取り出して、ホスト名を得る。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/web/get_url_host.sql
lines: [7, 17]
function: "default__get_url_host"
difficulty: 2
tags: [文字列処理, イディオム]
format: 2
---

## ひとことで

`get_url_host` は、URL の文字列からホスト名（例: `example.com`）だけを取り出すマクロです。接頭辞を消す `replace` と、区切りを探す `split_part` を組み合わせています。正規表現を使わず、どのデータベースでも同じ考え方で書けます。

## コード

```sql:line-numbers=7
{%- set parsed =
    dbt.split_part(
        dbt.split_part(
            dbt.replace(
                dbt.replace(
                    dbt.replace(field, "'android-app://'", "''"
                    ), "'http://'", "''"
                ), "'https://'", "''"
            ), "'/'", 1
        ), "'?'", 1
    )
```

## 前提知識

- **ホスト名**: URL の `https://` と `/` の間にある部分。`example.com` など。
- **`replace(文字列, 探す, 置き換え)`**: 文字列の中の部分を別の文字に置き換える関数。
- **`split_part`**: 区切りで分けて、番号目を取る関数（前の記事を参照）。
- **`safe_cast`**: 失敗しても止まらずに、型を変換する dbt のマクロ。
- **`android-app://`**: Android のアプリの URL の接頭辞。アプリのリンクを扱うために、ホスト名の取り出しでも消している。

## 何をしているか

### 1. 接頭辞を消す

`replace` を 3 回ネストして、`android-app://`、`http://`、`https://` の接頭辞を、空の文字に置き換えます。

```sql:line-numbers=9
        dbt.split_part(
            dbt.replace(
                dbt.replace(
                    dbt.replace(field, "'android-app://'", "''"
                    ), "'http://'", "''"
                ), "'https://'", "''"
```

内側の `replace` から順に実行されるので、最も外側の `https://` の置き換えが最後になります。接頭辞が無い URL でも、そのまま残るだけなので安全です。

### 2. 最初の / と ? より前を取る

残った文字列を、まず `/` で分けて最初の部分を取り、次に `?` で分けて最初の部分を取ります。

```sql:line-numbers=7
{%- set parsed =
    dbt.split_part(
```

```sql:line-numbers=15
            ), "'/'", 1
        ), "'?'", 1
    )
```

パスの部分や、クエリの部分は、この 2 回の `split_part` で切り落とされます。

### 3. 型を文字列にそろえる

最後に、結果を `safe_cast` で文字列の型にそろえます。

## ここがすごい

- **分解の順番で、必要な部分だけを残す**: 接頭辞の除去、パス、クエリの除去、という段階に分けて考えると、読みやすい順番になっています。
- **正規表現に頼らない**: 正規表現の関数が無いデータベースでも、同じ考え方で使えます。
- **`safe_cast` で型の失敗を防ぐ**: 結果が想定外の値でも、変換の時点で止まらないようにしています。
- **トレードオフ**: ポート番号 `:8080` や、ユーザー名の付いた URL（`user@host`）は、ホスト名の一部として残ります。対象の URL の形を事前に確かめる必要があります。

## まとめ

- 文字列の一部を取るときは、前の部分を消してから区切りで切ると順番が分かりやすい。
- 正規表現を使えない環境では、`replace` と `split_part` の組み合わせで多くの場合が済む。
- 型の変換は、失敗に強い形を選ぶと、途中で止まらない。
