---
title: "失敗のときだけ使う予備の値 getOr"
description: "成功なら中の値を、失敗なら渡された予備の値を返す getOr。中断や例外を使わず、既定値を 1 行で決められる。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Get.kt
lines: [42, 47]
function: "Result.getOr"
difficulty: 1
tags: [エラー処理, 関数型, イディオム]
format: 2
---

## ひとことで

`getOr` は、結果（Result）が成功なら中の値を、失敗なら **渡しておいた予備の値** を返す関数です。失敗を例外として投げることも、`null` にすることもなく、「失敗したらこの値にする」を 1 行で書けます。

## コード

```kotlin:line-numbers=42
public infix fun <V, E> Result<V, E>.getOr(default: V): V {
    return when {
        isOk -> value
        else -> default
    }
}
```

## 前提知識

- **Result**: 成功（`Ok`）か失敗（`Err`）のどちらかを表す箱です。成功なら値を、失敗ならエラーを持ちます。
- **拡張関数**: `Result<V, E>.getOr(...)` のように、既存の型に後から関数を足す書き方です。呼び出すときは `result.getOr(0)` と書けます。
- **`infix`**: 関数名を `result getOr 0` のように、2 つの値の間に書けるようにする指定です。文章のように読める呼び出しになります。
- **`when` 式**: 条件を上から調べて、当てはまった枝の値を結果にする書き方です。ここでは `isOk` が真なら `value`、それ以外なら `default` を返します。
- **`value` と `default`**: `value` は成功の中身です。`default` は呼び出し側が渡した予備の値です。型は同じ `V` なので、どちらを返しても戻り値の型はぶれません。

## 何をしているか

### 分岐の中身

中身は 1 つの `when` だけです。

```kotlin:line-numbers=44
        isOk -> value
```

成功なら、箱の中の値をそのまま返します。

```kotlin:line-numbers=45
        else -> default
```

失敗なら、渡された予備の値を返します。エラーの中身（`error`）は見ずに捨てます。どのような失敗だったかを気にしない場面で、この関数はとても素直に使えます。

たとえば、設定の読み込みに失敗したら既定の画面サイズを使う、というような場面です。

```kotlin
val width = parseWidth(text).getOr(800)
```

`parseWidth` が失敗しても、`width` には必ず `800` が入ります。戻り値の型は `Int` のままなので、後続の処理で `null` を確かめる必要がありません。

## ここがすごい

- **失敗の後始末が 1 行で済む**: `if (result.isOk) ... else ...` と書く代わりに、既定値を渡すだけで分岐をまとめられます。
- **戻り値の型が変わらない**: 失敗を `null` にする `get()` とは違い、戻り値は `V` のままです。だから `?:` を続けて書く必要もありません。
- **予備の値は先に評価される**: `default` は引数として渡されるので、呼び出し前に計算されます。重い計算を予備に使うときは、その点を意識すると安心です。
- **中身を取り出すだけで止まる**: 例外を投げないので、失敗が多い処理でも制御の流れが読みやすくなります。

## まとめ

- `getOr` は、失敗のときだけ使う予備の値を 1 行で指定できる。
- 戻り値の型は `V` のままなので、`null` の後始末が要らない。
- エラーの中身が必要なら `getError` や `getErrorOr` を使い分ける。
