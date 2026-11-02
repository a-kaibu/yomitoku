---
title: "配列を倍々に広げる、ArrayBuffer の成長ルール"
description: "Scala の ArrayBuffer が内部配列を広げるときの計算。要素数を倍にして追加を速く保ちつつ、上限を超えたら例外を投げる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/ArrayBuffer.scala"
lines: [325, 330]
format: 2
function: "ArrayBuffer.resizeUp"
difficulty: 2
tags: [データ構造, 最適化, 標準ライブラリ]
---

## ひとことで

Scala の `ArrayBuffer` は、要素を後ろに足すときに内部の配列が足りなくなると広げます。`resizeUp` は、新しい長さを計算する関数です。配列を毎回 1 つずつ広げると遅くなるので、長さを 2 倍に近づけて、まとめて広げるようにしています。

## コード

```scala:line-numbers=325
  private[mutable] def resizeUp(arrayLen: Int, targetLen: Int): Int =
    if (targetLen < 0) throw new RuntimeException(s"Overflow while resizing array of array-backed collection. Requested length: $targetLen; current length: $arrayLen; increase: ${targetLen - arrayLen}")
    else if (targetLen <= arrayLen) -1
    else if (targetLen > VM_MaxArraySize) throw new RuntimeException(s"Array of array-backed collection exceeds VM length limit of $VM_MaxArraySize. Requested length: $targetLen; current length: $arrayLen")
    else if (arrayLen > VM_MaxArraySize / 2) VM_MaxArraySize
    else math.max(targetLen, math.max(arrayLen * 2, DefaultInitialSize))
```

## 前提知識

- `ArrayBuffer` は、伸び縮みできる配列です。中身は固定長の配列で、足りなくなったら新しい大きな配列にコピーします。
- JVM の配列には長さの上限があります。`VM_MaxArraySize` は、その上限に近い値です。
- `-1` を「広げる必要はない」の合図に使うのは、この関数の約束です。
- `math.max` は 2 つの値の大きい方を返します。
- `throw new RuntimeException(...)` は、回復できない状態を例外で知らせる書き方です。

## 何をしているか

### 1. 変なサイズや、広げる必要がないときを先に扱う

最初の分岐は、目標の長さ `targetLen` が負なら例外（オーバーフロー）、今の長さ以下なら `-1` を返します。広げる必要がないことを、呼び出し側に知らせるためです。

### 2. 上限を超えるときは例外にする

目標が `VM_MaxArraySize` を超えるときは、例外を投げます。JVM の配列はそれ以上に作れないので、ここで早めに止めます。

### 3. 2 倍と最小サイズの大きい方を取る

ほかのときは、次の式で新しい長さを決めます。

```scala:line-numbers=329
    else if (arrayLen > VM_MaxArraySize / 2) VM_MaxArraySize
    else math.max(targetLen, math.max(arrayLen * 2, DefaultInitialSize))
```

現在の長さが上限の半分を超えているときは、上限いっぱいまで広げます。2 倍にすると上限を超えてしまうからです。それ以外のときは、`max(targetLen, max(arrayLen * 2, DefaultInitialSize))` を返します。目標の長さが足りていれば、現在の 2 倍まで一気に広げるので、次に足りなくなるまでの回数が減ります。

## ここがすごい

- 1 回ずつ 1 要素分だけ広げると、要素数が増えるたびにコピーが起きてしまいます。2 倍ずつ広げると、要素 1 つあたりのコピー回数は平均して一定になります。これを「償却 O(1)」の追加と呼びます。
- 上限の半分を超えた場合の処理で、`arrayLen * 2` のオーバーフローを防いでいます。`Int` の掛け算は溢れると負の値になるので、先に比べておく必要があります。
- 広げる量を計算する関数と、実際にコピーする関数（`ensureSize`）を分けているので、テストや再利用がしやすい作りになっています。
- 例外のメッセージに現在の長さと要求された長さを入れているので、原因の調べやすさも考えられています。

## まとめ

- 配列を広げるときは、2 倍ずつ広げると追加が平均して速くなります。
- 掛け算のオーバーフローや上限は、計算の前に確かめます。
- 「広げなくてよい」を `-1` のような特別な値で表すと、呼び出し側が判断しやすくなります。
