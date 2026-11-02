---
title: "どんな型の値も、型ごとの道を通って、1 つのハッシュに混ぜる"
description: "Apache Pekko の HashCode.hash(seed, any)。値の型を見て、基本の型は専用の hash に回し、参照の型は hashCode を混ぜる。null は 0 として扱い、配列は中身を順に混ぜる。型の判定は match 1 つで書く。"
language: scala
project: "Apache Pekko"
repo: https://github.com/apache/pekko
license: "Apache-2.0"
copyright: "Copyright (C) 2009-2022 Lightbend Inc. <https://www.lightbend.com>"
commit: "ce3c32d9f12115077bec4796732788f5d9b15adc"
file: "actor/src/main/scala/org/apache/pekko/util/HashCode.scala"
lines: [36, 53]
format: 2
function: "HashCode.hash"
difficulty: 3
tags: [ハッシュ, 設計パターン, 型システム]
---

## ひとことで

Apache Pekko の `HashCode` は、複数の値を 1 つのハッシュ値にまとめるための部品です。`hash(seed, any)` は、どんな型の値でも受け取れます。型を `match` で見分けて、基本の型はそれぞれの `hash` に、参照の型は `hashCode` や配列の専用の処理に回します。

## コード

::: code-group

```scala:line-numbers=36 [日本語訳]
  def hash(seed: Int, any: Any): Int = any match {
    case value: Boolean => hash(seed, value)
    case value: Char    => hash(seed, value)
    case value: Short   => hash(seed, value)
    case value: Int     => hash(seed, value)
    case value: Long    => hash(seed, value)
    case value: Float   => hash(seed, value)
    case value: Double  => hash(seed, value)
    case value: Byte    => hash(seed, value)
    case value: AnyRef  =>
      var result = seed
      if (value eq null) result = hash(result, 0)
      else if (!isArray(value)) result = hash(result, value.hashCode())
      else result = hashArray(result, value)
      result
    case unexpected =>
      throw new IllegalArgumentException(s"Unexpected hash parameter: $unexpected") // ここには来ないはずです。match がすべての場合を網羅していることを示すための行です。
  }
```

```scala:line-numbers=36 [原文]
  def hash(seed: Int, any: Any): Int = any match {
    case value: Boolean => hash(seed, value)
    case value: Char    => hash(seed, value)
    case value: Short   => hash(seed, value)
    case value: Int     => hash(seed, value)
    case value: Long    => hash(seed, value)
    case value: Float   => hash(seed, value)
    case value: Double  => hash(seed, value)
    case value: Byte    => hash(seed, value)
    case value: AnyRef  =>
      var result = seed
      if (value eq null) result = hash(result, 0)
      else if (!isArray(value)) result = hash(result, value.hashCode())
      else result = hashArray(result, value)
      result
    case unexpected =>
      throw new IllegalArgumentException(s"Unexpected hash parameter: $unexpected") // will not happen, for exhaustiveness check
  }
```

:::

## 前提知識

- ハッシュは、値から作る整数です。複数の値を 1 つにまとめるときは、前のハッシュ（seed）に次の値を混ぜていく方法が使われます。
- Scala の `Any` は、すべての型の親にあたる型です。`match` で型を調べると、中身の型に応じた処理を書けます。
- `Int` や `Boolean` などの基本の型は、オブジェクトではない値です。`value: Int` のように型で分けると、専用の処理に回せます。
- `value eq null` は、参照が `null` かどうかを調べます。`null` は `hashCode` を呼べないので、先に特別に扱います。
- `isArray(value)` で配列かを調べます。配列は `hashCode` が中身を反映しないので、専用の `hashArray` で中身を混ぜます。

## 何をしているか

### 1. 基本の型は、それぞれの hash に回す

`Boolean`、`Char`、`Short`、`Int`、`Long`、`Float`、`Double`、`Byte` は、それぞれ対応する `hash` の関数に渡します。型ごとに適した混ぜ方を使うためです。

```scala:line-numbers=37
    case value: Boolean => hash(seed, value)
    case value: Char    => hash(seed, value)
    case value: Short   => hash(seed, value)
    case value: Int     => hash(seed, value)
    case value: Long    => hash(seed, value)
    case value: Float   => hash(seed, value)
    case value: Double  => hash(seed, value)
    case value: Byte    => hash(seed, value)
```

### 2. 参照の型は、null と配列を分けて混ぜる

それ以外のオブジェクト（`AnyRef`）は、まず `result` を `seed` で用意します。`null` なら 0 を混ぜ、配列なら中身を `hashArray` で混ぜ、そうでなければ `hashCode` を混ぜます。

```scala:line-numbers=45
    case value: AnyRef  =>
      var result = seed
      if (value eq null) result = hash(result, 0)
      else if (!isArray(value)) result = hash(result, value.hashCode())
      else result = hashArray(result, value)
      result
```

### 3. 想定外の型は例外にする

網羅のために用意した最後の場合は、ふつうには起きません。起きたら例外を投げて、気づけるようにします。

```scala:line-numbers=51
    case unexpected =>
      throw new IllegalArgumentException(s"Unexpected hash parameter: $unexpected") // will not happen, for exhaustiveness check
```

## ここがすごい

- 型ごとの混ぜ方を `match` の 1 つの式にまとめているので、呼び出し側は型を気にせず値を渡せます。
- `null` と配列を特別に扱うことで、`hashCode` が呼べない場合や、中身が反映されない場合にも正しい値を作ります。
- 基本の型を `Int` に直さずに専用の関数へ回すので、`Long` や `Double` の情報を失わずに混ぜられます。
- コメントにあるように、最後の場合で網羅の確認をしています。型が増えたときに、この関数の抜けを見つけやすくなっています。

## まとめ

- 任意の型の値をハッシュにまとめるには、型ごとの処理を `match` で振り分けます。
- `null` と配列のように、ふつうの `hashCode` で済まない場合は、先に分けて扱います。
- 網羅の確認を入れておくと、後から型が増えたときの見落としを防げます。
