---
title: "クラスの完全な名前を、一度だけ調べてから覚えておく"
description: "クラスの完全修飾名を取り出す getFullName と、その結果を保存する saveCache。調べにくい名前を、クラスごとに 1 回だけ求めて使い回す。"
language: kotlin
project: "Koin"
repo: https://github.com/InsertKoinIO/koin
license: Apache-2.0
copyright: "Copyright 2017-Present the original author or authors."
commit: "d486a5e8748f90db43f939e227083f2bd2c47c12"
file: projects/core/koin-core/src/commonMain/kotlin/org/koin/ext/KClassExt.kt
lines: [24, 32]
function: "KClass<*>.getFullName, KClass<*>.saveCache"
difficulty: 2
tags: [最適化, 防御的プログラミング, データ構造]
format: 2
---

## ひとことで

`getFullName` は、クラスの **完全な名前（パッケージ名を含む名前）を返す** 関数です。結果は内部の表に覚えておき、同じクラスの名前を求めるときは、表から取り出します。

名前を求めるには、プラットフォームごとの処理（Java の反射など）を使います。それは比較的重い処理なので、同じクラスについて何度も求めないように、`saveCache` で一度だけ計算して保存しています。

## コード

```kotlin:line-numbers=24
fun KClass<*>.getFullName(): String {
    return classNames[this] ?: saveCache()
}

fun KClass<*>.saveCache(): String {
    val name = KoinPlatformTools.getClassName(this)
    classNames[this] = name
    return name
}
```

## 前提知識

- **完全修飾名**: `org.example.MyClass` のように、パッケージ名を含めたクラスの名前です。同じ名前の別のクラスを区別できます。
- **`KClass`**: Kotlin でクラスを表す型です。`クラス名::class` で得られます。
- **`MutableMap`**: 後から値を追加したり変えたりできる対応表です。キーに対応する値を取り出せます。
- **`?:`（エルビス演算子）**: 左側が `null` のとき、右側の値を使います。`classNames[this]` が `null` なら、まだ覚えていないということです。
- **`KoinPlatformTools.safeHashMap()`**: 対象のプラットフォームで安全に使える対応表を作る関数です。複数のスレッドから使っても壊れにくい表が作られます。
- **`private val`**: このファイルの中だけで使える値です。外からは見えません。

## 何をしているか

### 1. 表から探す

```kotlin:line-numbers=25
    return classNames[this] ?: saveCache()
```

まず、表（`classNames`）にこのクラスの名前があるかを調べます。あればそれを返します。なければ `saveCache()` を呼んで、名前を求めて保存します。

### 2. 名前を求めて、表に保存する

```kotlin:line-numbers=29
    val name = KoinPlatformTools.getClassName(this)
    classNames[this] = name
    return name
```

プラットフォームごとの関数で名前を求め、その名前を表に登録してから返します。次に同じクラスの名前が必要になったときは、この登録が使われます。

## ここがすごい

- **重い処理を 1 回にまとめる**: 名前を求める処理は、呼ばれるたびに行うと無駄になります。表に残すことで、同じクラスについては 2 回目以降はすぐ答えられます。
- **表を使う関数と、作る関数を分ける**: `getFullName` は「探す」、`saveCache` は「求めて保存する」と役割を分けています。`saveCache` は、表を更新したいときに直接呼ぶこともできます。
- **`?:` で 2 通りを 1 行に**: 「覚えているか」「覚えていないか」の分岐が、エルビス演算子で 1 行になっています。
- **プラットフォームの違いを隠す**: 名前の求め方は `KoinPlatformTools` に任せています。この関数は、どのプラットフォームでも同じように使えます。

## まとめ

- 重い計算の結果は、キーごとに表へ覚えておくと、同じ問い合わせを速く返せる。
- 「探す」と「求めて保存する」は別の関数にすると、役割がはっきりする。
- プラットフォームごとの違いは、専用の関数の中に閉じ込めると、呼び出し側が簡単になる。
