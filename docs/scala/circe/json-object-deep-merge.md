---
title: "2 つのオブジェクトを、同じキーの値は中まで再帰的に混ぜて合わせる"
description: "circe の JsonObject.deepMerge。キーが両方にあり、どちらも JSON のオブジェクトなら、中身もさらに混ぜ合わせる。片方にしかないキーはそのまま足す。foldLeft で、一方の要素を順に他方へ書き込んでいく。"
language: scala
project: "circe"
repo: https://github.com/circe/circe
license: "Apache-2.0"
copyright: "Copyright 2024 circe"
commit: "66e1e406400d865a176dafeccb7b684f1d679627"
file: "modules/core/shared/src/main/scala/io/circe/JsonObject.scala"
lines: [205, 211]
format: 2
function: "JsonObject.deepMerge"
difficulty: 3
tags: [データ構造, 関数型, 再帰]
---

## ひとことで

circe は、Scala で JSON を扱うライブラリです。JSON のオブジェクトは、キーと値の組の集まりです。`deepMerge` は、2 つのオブジェクトを合わせます。同じキーが両方にあって、値が両方ともオブジェクトなら、その中身も同じ方法で再帰的に合わせます。

## コード

```scala:line-numbers=205
  def deepMerge(that: JsonObject): JsonObject =
    toIterable.foldLeft(that) {
      case (acc, (key, value)) =>
        that(key).fold(acc.add(key, value)) { r =>
          acc.add(key, value.deepMerge(r))
        }
    }
```

## 前提知識

- JSON のオブジェクトは、`{"a": 1, "b": {"x": 2}}` のように、キーと値の組が並んだものです。値の中に、さらにオブジェクトを入れられます。
- 「浅いマージ」は、同じキーがあれば、片方の値で丸ごと上書きすることです。「深いマージ（deepMerge）」は、中のオブジェクトまで混ぜ合わせることです。
- `foldLeft(that)` は、初期値を `that` にして、もう一方の要素を 1 つずつ書き込んでいく畳み込みです。
- `that(key)` は、キーに対応する値を `Option` で返します。値がなければ `None` です。
- `fold(z)(f)` は、`Option` が `None` なら `z`、`Some` なら `f` の結果を返す関数です。

## 何をしているか

### 1. 自分の要素を、順に相手に書き込む

`toIterable.foldLeft(that)` で、このオブジェクトのキーと値を 1 つずつ取り出します。初期値は `that`（相手）です。取り出した組を、途中の結果 `acc` に入れていきます。

```scala:line-numbers=206
    toIterable.foldLeft(that) {
      case (acc, (key, value)) =>
```

### 2. 相手にキーがなければ、そのまま足す

`that(key)` が `None` なら、相手には同じキーがありません。その場合は、`acc.add(key, value)` で値をそのまま足します。

```scala:line-numbers=208
        that(key).fold(acc.add(key, value)) { r =>
```

### 3. 相手にもキーがあれば、値を再帰的に混ぜる

相手にも同じキーがあれば、`value.deepMerge(r)` で、両方の値を混ぜ合わせます。値がオブジェクトなら、この関数がもう一度呼ばれ、中身まで混ざります。値がオブジェクトでなければ、`Json` 側の処理で扱われます。

```scala:line-numbers=209
          acc.add(key, value.deepMerge(r))
        }
```

## ここがすごい

- 1 回の畳み込みで、2 つのオブジェクトの全部のキーを確かめます。キーごとの分岐も、`fold` で 1 行にまとめています。
- 同じキーの値を、再帰的に同じ関数で混ぜるので、入れ子が何段あっても、書き方は変わりません。
- 初期値を相手にしているので、相手のキーはすべて残ります。どちらか一方だけにあるキーも失われません。
- 元のオブジェクトを変えず、新しいオブジェクトを作って返すので、不変のデータとして安全に使えます。

## まとめ

- 深いマージは、キーごとに「片方だけか、両方か」を分けて、両方のときは中へ再帰します。
- `fold` と `foldLeft` を組み合わせると、分岐の多い処理が短く書けます。
- 不変のデータを合わせるときは、新しい値を作って返す形にすると安全です。
