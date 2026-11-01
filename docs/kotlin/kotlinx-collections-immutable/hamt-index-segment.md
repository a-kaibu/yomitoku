---
title: "木の段ごとに使うビットの塊を取り出す indexSegment"
description: "永続ハッシュマップの木構造で、ハッシュ値のどの部分を今の段で使うかを決める indexSegment。ずらしと mask で、数ビットずつ切り出す。"
language: kotlin
project: "kotlinx.collections.immutable"
repo: https://github.com/Kotlin/kotlinx.collections.immutable
license: Apache-2.0
copyright: "Copyright 2016-2019 JetBrains s.r.o."
commit: "9f961e4dd419dff58ffea164dd41ebba68acc8d6"
file: core/commonMain/src/implementations/immutableMap/TrieNode.kt
lines: [29, 32]
function: "indexSegment"
difficulty: 3
tags: [データ構造, ビット演算, ハッシュ]
format: 2
---

## ひとことで

`indexSegment()` は、ハッシュ値（キーから作った数値）の中から、**木の今の段で使う数ビットの塊** を取り出す関数です。木の上の段では上位のビット、下の段では下位のビットを使う、という形で、段ごとに使う場所をずらしていきます。

kotlinx.collections.immutable（変更しても元の集まりが壊れない、永続的なコレクションのライブラリ）の、ハッシュマップの中で使われています。

## コード

```kotlin:line-numbers=29
internal fun indexSegment(index: Int, shift: Int): Int {
    assert { shift <= MAX_SHIFT }
    return (index shr shift) and MAX_BRANCHING_FACTOR_MINUS_ONE
}
```

## 前提知識

- **ハッシュ値**: キーから計算された整数です。同じキーからは必ず同じ値が出ます。
- **木の段（レベル）**: ハッシュマップは、ハッシュ値の数ビットずつで枝分かれする木です。上の段で 1 回の枝分かれ、下の段で次の枝分かれ、と進みます。
- **`shr`（右シフト）**: ビットを右にずらす操作です。`index shr shift` は、上の段で使わなくなったビットを捨てる働きをします。
- **マスク（mask）**: 特定のビットだけを残すための値です。`and` でマスクをかけると、残したい部分だけが残ります。
- **`MAX_SHIFT`**: ずらす量の上限です。これを超えると、正しい段の結果にはなりません。

## 何をしているか

### 1. 段の深さだけずらす

```kotlin:line-numbers=31
    return (index shr shift) and MAX_BRANCHING_FACTOR_MINUS_ONE
```

`shift` は、今いる段の深さに比例した値です。ハッシュ値を `shift` だけ右にずらすと、今の段で使う部分が一番下に来ます。

### 2. マスクで必要な部分だけ残す

`MAX_BRANCHING_FACTOR_MINUS_ONE` は、分岐の数から 1 を引いた値で、下位の数ビットだけが 1 になっています。`and` でかけると、その数ビットだけが残ります。残った値が、今の段での枝の番号になります。

### 3. 上限の確認

```kotlin:line-numbers=30
    assert { shift <= MAX_SHIFT }
```

`shift` が上限を超えていないことを確かめます。この確認は、開発中のときに働きます。

## ここがすごい

- **1 つの式で段の番号が決まる**: ずらしとマスクの 2 つの操作だけで、どの段でも同じ形の式が使えます。段ごとに別の計算を書く必要がありません。
- **ハッシュ値を使い回す**: 同じハッシュ値の別の部分を、段ごとに使っていきます。1 回計算したハッシュ値を、木の深さまで活かせます。
- **Kotlin の注意点がコメントに**: ドキュメントには、`Int` のずらし量は 32 で割った余りになる、と書かれています。上限を超えると、エラーではなく、意味のない値が出る危険があります。だから `assert` を置いています。
- **短く、計算量が小さい**: ずらしとマスクは、どちらも 1 回の命令で済む軽い操作です。木をたどるたびに、何度呼ばれても負担になりにくいです。

## まとめ

- `indexSegment` は、ハッシュ値を段の深さだけずらし、マスクで数ビットを取り出して、枝の番号にする。
- ずらし量が上限を超えると意味のない値になるため、`assert` で確かめる。
- 段ごとに同じ式を使えるので、木のどの段でも一貫した計算になる。
