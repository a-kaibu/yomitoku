---
title: "整数を IP アドレスに足す演算を関数で作る"
description: "PostgreSQL の int8pl_inet(bigint, inet)。bigint を inet の値に足して、アドレスを数だけ進める。演算子 + の型の組み合わせのために、足す順番を入れ替えて定義している。"
language: sql
project: "PostgreSQL"
repo: https://github.com/postgres/postgres
license: "PostgreSQL"
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "4f31212020ea1c2aedb0494cb1fc329b5275c1cf"
file: src/backend/catalog/system_functions.sql
lines: [237, 241]
function: "int8pl_inet(bigint, inet)"
difficulty: 2
tags: [ネットワーク, 型システム]
format: 2
---

## ひとことで

`int8pl_inet` は、`bigint`（整数）と `inet`（IP アドレス）の足し算を行う関数です。`inet + bigint` の演算子は、順番を変えた `bigint + inet` の形でも使えるように、この関数を定義して補っています。

## コード

```sql:line-numbers=237
CREATE OR REPLACE FUNCTION int8pl_inet(bigint, inet)
 RETURNS inet
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
RETURN $2 + $1;
```

## 前提知識

- **`inet` 型**: IPv4 や IPv6 のアドレスを表す型。ネットワークの範囲を表すこともできる。
- **`bigint`**: 大きな整数の型。
- **演算子と関数**: 演算子（`+` など）は、内部では同じ名前の関数に対応する。`pl` は plus（足す）の略。
- **`STRICT`**: 引数に `NULL` があれば、結果も `NULL` にする指定。
- **`$1`、`$2`**: 1 番目と 2 番目の引数。

## 何をしているか

### 1. 引数の型と戻り値を宣言する

この関数は、`bigint` と `inet` を受け取り、`inet` を返します。`IMMUTABLE` で、同じ入力には同じ結果を返すことを約束しています。

```sql:line-numbers=237
CREATE OR REPLACE FUNCTION int8pl_inet(bigint, inet)
 RETURNS inet
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT COST 1
```

### 2. 足す順番を入れ替えて、既存の演算に任せる

本体は、`$2 + $1`、つまり `inet + bigint` を書いています。`inet + bigint` の演算は既に定義されているので、それを呼ぶだけで済みます。

```sql:line-numbers=241
RETURN $2 + $1;
```

つまり、`bigint + inet` の書き方を受けるために、順番を入れ替えて既存の演算に渡しています。

## ここがすごい

- **交換法則を、型の組み合わせで補っている**: 数の足し算では順番を変えても同じですが、型が違うと、演算子の定義は別々に必要になります。その穴を、1 つの関数で埋めています。
- **既存の定義を再利用する**: 足し算の本体は書かず、`inet + bigint` に任せるので、ロジックは 1 か所にあります。
- **`STRICT` で `NULL` を扱いやすくする**: 値が無いときの結果が、利用者にとって予測しやすくなります。
- **トレードオフ**: アドレスを超える大きな数を足すと、範囲外のエラーになります。引数の値の範囲は、利用者が確かめる必要があります。

## まとめ

- 型の組み合わせで演算子が足りないときは、引数の順番を入れ替えた関数で補える。
- 既存の演算を呼ぶだけの関数は、ロジックを 1 か所に保つのに役立つ。
- 同じ計算でも、型の順番によって別の定義が必要になることがある。
