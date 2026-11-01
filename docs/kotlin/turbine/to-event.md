---
title: "チャネルの読み取り結果を、テスト用のイベントに変える"
description: "チャネルから読んだ結果を、値・エラー・完了・なしのどれかの Event に振り分ける toEvent。Turbine がテストで流れてきた順番を記録するときに使う。"
language: kotlin
project: "Turbine"
repo: https://github.com/cashapp/turbine
license: Apache-2.0
copyright: "Copyright (C) 2022 Square, Inc."
commit: "8c4e8c9b391d75ac9d7a168cca34b1bf99ed2cb0"
file: src/commonMain/kotlin/app/cash/turbine/channel.kt
lines: [238, 246]
function: "ChannelResult.toEvent"
difficulty: 2
tags: [並行処理, 型システム, 状態機械]
format: 2
---

## ひとことで

`toEvent` は、チャネル（コルーチン同士で値を受け渡す通り道）から読んだ結果を、**Turbine のイベント（`Event`）に変換する** 関数です。

Turbine は、Flow や Channel から流れてくるものを、テストの中で 1 つずつ確かめるためのライブラリです。流れてきたものは、「値が来た」「エラーで終わった」「正常に終わった」「まだ何もない」のどれかになります。この関数は、その 4 つの場合を見分けて、対応する `Event` を返します。

## コード

```kotlin:line-numbers=238
internal fun <T> ChannelResult<T>.toEvent(): Event<T>? {
  val cause = exceptionOrNull()
  return when {
    isSuccess -> Event.Item(getOrThrow())
    cause != null -> Event.Error(cause)
    isClosed -> Event.Complete
    else -> null
  }
}
```

## 前提知識

- **チャネル（Channel）**: コルーチン同士で値を送り合う通り道です。送る側と受ける側が別々に動けます。チャネルを閉じると、それ以上は値が送られません。
- **`ChannelResult<T>`**: チャネルへの操作（`tryReceive` など）の結果を表す型です。成功、失敗、閉じた、のどれかの状態を持ち、中の値やエラーを取り出せます。
- **`isSuccess` / `isClosed` / `exceptionOrNull()`**: 成功したか、チャネルが閉じているか、閉じるときに渡されたエラーは何かを調べる関数です。
- **`Event`**: Turbine のイベントを表す `sealed` のクラスです。`Event.Item`（値）、`Event.Error`（エラー）、`Event.Complete`（完了）があります。
- **`when` の条件なし**: `when { 条件 -> ... }` と書くと、条件を上から調べて、最初に当てはまったものを結果にします。`else` で、どれにも当てはまらない場合を書きます。
- **`null` の意味**: ここでは「まだ何もない」を表します。

## 何をしているか

### 1. 値が取れたら Item

```kotlin:line-numbers=241
    isSuccess -> Event.Item(getOrThrow())
```

読み取りが成功していれば、中の値を `Event.Item` に包みます。`getOrThrow()` は、成功している前提で値を取り出します。

### 2. エラーで閉じられていたら Error

```kotlin:line-numbers=242
    cause != null -> Event.Error(cause)
```

チャネルがエラーを付けて閉じられていれば、そのエラーを `Event.Error` に包みます。この判定を、「閉じたか」より先に置いているのがポイントです。

### 3. 正常に閉じられていたら Complete

```kotlin:line-numbers=243
    isClosed -> Event.Complete
```

エラーなしで閉じられていれば、`Event.Complete` を返します。ここまでの判定で当てはまらなかった閉じた状態が、この分岐になります。

### 4. どれでもなければ null

```kotlin:line-numbers=244
    else -> null
```

値も、閉じた状態もなければ、今は何も届いていないということです。`null` を返して、「イベントはまだない」と伝えます。

## ここがすごい

- **判定の順番がそのまま意味になる**: 「値があるか」「エラーで閉じたか」「閉じたか」という順番で調べると、同時に当てはまる状態も、必ず 1 つの結果に決まります。特にエラー付きの閉じ方が、正常な閉じ方より先に判定されるので、取りこぼしがありません。
- **型で結果を限定する**: 戻り値は `Event<T>?` で、ありうる結果が型に表れています。呼び出し側は、どの場合があるかを型から読み取れます。
- **「まだない」を `null` で表す**: 空の結果を例外にせず `null` にすることで、テストの側が「今は待つべきか」を普通の分岐として判断できます。
- **外側の仕組みを知らなくても読める**: 関数の中身は 4 つの分岐だけです。チャネルの細かい仕組みを知らなくても、どの状態がどのイベントになるかが読み取れます。

## まとめ

- チャネルの読み取り結果は、値、エラー、完了、なし、の 4 つに分けて考える。
- 判定の順番は、より具体的な状態（エラー付きの閉じ方）を先に置く。
- 「まだ何もない」は `null` で表すと、待つかどうかを呼び出し側で決められる。
