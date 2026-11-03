---
title: "廃止された surrogate_key の警告を出す仕組み"
description: "dbt-utils の surrogate_key。すでに generate_surrogate_key に置き換えられた旧マクロで、呼ばれると置き換えを案内する警告を出して、処理を止める。"
language: sql
project: "dbt-utils"
repo: https://github.com/dbt-labs/dbt-utils
license: "Apache-2.0"
copyright: "Copyright 2022 dbt Labs, Inc."
commit: "2a8f07bcbd02fb7a8c011298a1bdaf3e92759c14"
file: macros/sql/surrogate_key.sql
lines: [6, 20]
function: "default__surrogate_key"
difficulty: 2
tags: [エラー処理, 防御的プログラミング]
format: 2
---

## ひとことで

`surrogate_key` は、古い名前の代理キーマクロです。今は `generate_surrogate_key` に置き換えられています。このマクロは、呼ばれると新しいマクロへの移行を案内するエラーを出して、処理を止めます。古い動きを黙って続けないための工夫です。

## コード

```sql:line-numbers=6
{%- macro default__surrogate_key(field_list) -%}

{%- set error_message = '
Warning: `dbt_utils.surrogate_key` has been replaced by \
`dbt_utils.generate_surrogate_key`. The new macro treats null values \
differently to empty strings. To restore the behaviour of the original \
macro, add a global variable in dbt_project.yml called \
`surrogate_key_treat_nulls_as_empty_strings` to your \
dbt_project.yml file with a value of True. \
The {}.{} model triggered this warning. \
'.format(model.package_name, model.name) -%}

{%- do exceptions.raise_compiler_error(error_message) -%}

{%- endmacro -%}
```

## 前提知識

- **代理キー（surrogate key）**: 元のデータの列の組み合わせから作る、一意な識別子。
- **`raise_compiler_error`**: dbt のコンパイル時に、エラーを出して止める関数。
- **非推奨（deprecated）**: 使うと将来の問題になるため、新しい方法への移行を勧めている状態。
- **`varargs`**: マクロに渡された余分な引数の一覧。

## 何をしているか

### 1. 警告の文を組み立てる

```sql:line-numbers=8
{%- set error_message = '
Warning: `dbt_utils.surrogate_key` has been replaced by \
`dbt_utils.generate_surrogate_key`. The new macro treats null values \
differently to empty strings. To restore the behaviour of the original \
macro, add a global variable in dbt_project.yml called \
`surrogate_key_treat_nulls_as_empty_strings` to your \
dbt_project.yml file with a value of True. \
The {}.{} model triggered this warning. \
'.format(model.package_name, model.name) -%}
```

置き換えられたことと、古い動きに戻すための設定を、文字列にまとめます。どのモデルで呼ばれたかも、一緒に書きます。

### 2. エラーにして止める

```sql:line-numbers=18
{%- do exceptions.raise_compiler_error(error_message) -%}
```

組み立てた文を、コンパイル時のエラーとして出します。警告で流すのではなく止めるので、移行を先送りできません。

## ここがすごい

- **移行を強制する**: 古い関数が黙って使われ続けないように、エラーにしています。
- **解決策を文の中に書く**: 読み手は、どの設定を変えればよいかをエラーの文から直接知れます。
- **呼び出し元を示す**: どのモデルが古い関数を使ったかを、メッセージに入れています。

## まとめ

- 廃止された関数は、呼ばれたら移行先を案内するエラーにすると、移行を確実にできる。
- エラーの文には、直し方と場所を入れると読み手が迷わない。
- 古い動きを残すための設定は、文の中で示すと安全に移行できる。
