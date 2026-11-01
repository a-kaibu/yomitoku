---
title: "条件に合ったら失敗に変える toErrorIf"
description: "成功の値が条件を満たしたとき、そこから作ったエラーで失敗に切り替える toErrorIf。条件に合わなければ元の結果をそのまま返す。"
language: kotlin
project: "kotlin-result"
repo: https://github.com/michaelbull/kotlin-result
license: ISC
copyright: "Copyright (c) 2017-2025 Michael Bull (https://www.michael-bull.com)"
commit: "aed7438b2bd92adc704b5022e64cddf263e38800"
file: kotlin-result/src/commonMain/kotlin/com/github/michaelbull/result/Map.kt
lines: [303, 316]
function: "Result.toErrorIf"
difficulty: 2
tags: [エラー処理, 関数型, 防御的プログラミング]
format: 2
---

## ひとことで

`toErrorIf()` は、成功している結果の値が **条件を満たしたら、失敗に切り替える** 関数です。条件を満たさなければ、元の成功をそのまま返します。

「値が正しい範囲にあるか」や「空でないか」を、結果の流れの中で確かめて、ダメなら失敗にする、という場面で使えます。

## コード

```kotlin:line-numbers=303
public inline fun <V, E> Result<V, E>.toErrorIf(
    predicate: (V) -> Boolean,
    transform: (V) -> E,
): Result<V, E> {
    contract {
        callsInPlace(predicate, InvocationKind.AT_MOST_ONCE)
        callsInPlace(transform, InvocationKind.AT_MOST_ONCE)
    }

    return when {
        isOk && predicate(value) -> Err(transform(value))
        else -> this
    }
}
```

## 前提知識

- **述語（predicate）**: 値を受け取って `true` か `false` を返す関数です。ここでは「この値は失敗にすべきか」を判断する関数として渡されます。
- **`transform`**: 値から、失敗の中に入れるエラーを作る関数です。条件に合った値から、どんなエラーを作るかを決めます。
- **`Err(...)`**: 失敗の箱を作る関数です。`Err(transform(value))` は、作ったエラーを入れた失敗を表します。
- **`takeIf` への言及**: ドキュメントにある `@see [takeIf]` は、標準ライブラリの `takeIf` に似た考え方だという意味です。条件を満たせば値を通し、満たさなければ別の結果に変えます。

## 何をしているか

### 条件を満たしたら失敗にする

```kotlin:line-numbers=313
        isOk && predicate(value) -> Err(transform(value))
```

成功していて、かつ `predicate` が `true` のとき、`transform` で作ったエラーを入れた失敗を返します。`&&` の左側で成功かどうかを確かめ、右側で条件を調べています。左が `false` なら、右は呼ばれません。

### それ以外は元の結果のまま

```kotlin:line-numbers=314
        else -> this
```

失敗のときや、条件を満たさなかった成功のときは、元の結果をそのまま返します。失敗の中身も、成功の値も変わりません。

## ここがすごい

- **流れを止めずに検査できる**: 途中で `if` を使って値を検査し、`Err` を作り直す代わりに、結果の流れの中で 1 行で書けます。
- **`&&` の短絡評価**: 成功でないときは `predicate` が呼ばれないので、失敗の中の値に対して条件を調べることはありません。安全な順番になっています。
- **`contract` で呼び出し回数が分かる**: `predicate` と `transform` は、どちらも最大 1 回だけ呼ばれると宣言されています。コンパイラが、ラムダの中の変数を安全に扱えます。
- **元の結果を返すだけの枝**: 条件に合わない値は、新しい箱を作らずにそのまま返します。無駄なコピーが増えません。

## まとめ

- `toErrorIf` は、成功の値が条件を満たしたら、その値からエラーを作って失敗に切り替える。
- 条件に合わなければ、元の結果を変えずに返す。
- 検査と失敗への変換を 1 行にまとめられるので、結果の流れを途切れさせずに書ける。
