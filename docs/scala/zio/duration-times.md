---
title: "期間に係数を掛けるとき、溢れる前に無限大にする"
description: "ZIO の Duration の * 演算子。期間をナノ秒にして係数を掛けるとき、Long の最大値を超えるなら Infinity を返す。溢れて負の値になる事故を、掛ける前に防ぐ。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2017-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/Duration.scala"
lines: [139, 144]
format: 2
function: "Duration.*"
difficulty: 2
tags: [数値計算, 防御的プログラミング, エラー処理]
---

## ひとことで

ZIO の `Duration`（時間の長さ）に係数を掛ける `*` です。期間をナノ秒の `Long` にして係数を掛けますが、結果が `Long` の範囲を超えるときは、掛けずに `Infinity`（無限大の期間）を返します。溢れて負の時間になる事故を防ぎます。

## コード

```scala:line-numbers=139
  def *(factor: Double): Duration = {
    val nanos = duration.toNanos
    if (factor <= 0 || nanos <= 0) Duration.Zero
    else if (factor <= Long.MaxValue / nanos.toDouble) (nanos * factor).round.nanoseconds
    else Duration.Infinity
  }
```

## 前提知識

- `Duration` は時間の長さを表す型です。内部ではナノ秒の数として持ちます。
- `Long` は 64 ビットの整数で、最大値（`Long.MaxValue`）があります。その値を超えると、負の値に折り返して壊れます。これを「オーバーフロー」と呼びます。
- `factor <= 0` や `nanos <= 0` のときは、0 として扱うのが約束です。
- `.round` は、Double を最も近い整数に丸める操作です。
- `nanoseconds` は、`Long` の数字から時間の長さを作る拡張メソッドです。

## 何をしているか

### 1. 0 以下なら、ゼロの期間を返す

係数か期間が 0 以下なら、`Duration.Zero` を返します。負の期間や、負の係数は、ここでは扱わない約束です。

### 2. 掛ける前に、上限と比べる

溢れないかを、`Long.MaxValue` を期間で割った値と比べます。割り算で先に上限を求めることで、掛け算の結果を見ずに判定できます。

```scala:line-numbers=142
    else if (factor <= Long.MaxValue / nanos.toDouble) (nanos * factor).round.nanoseconds
```

上限以下なら、掛けて丸め、期間にします。

### 3. 超えるなら無限大

上限を超えるときは、`Duration.Infinity` を返します。実際の値を計算せず、溢れを避けるための値に切り替えます。

## ここがすごい

- 掛けてから比べると、既に溢れた値と比べることになってしまいます。先に割り算で上限を求めて比べるので、溢れを正しく防げます。
- 溢れを例外にせず、無限大という意味のある値で返すので、呼び出し側が自然に扱えます。
- 係数が小さいか大きいかで、丸めた結果だけを使うので、小さな誤差は実用上問題になりにくいです。
- 0 以下の場合を最初に分けておくと、後の割り算でゼロ除算の心配がありません。

## まとめ

- 整数の掛け算で溢れが心配なときは、掛ける前に上限と比べると安全です。
- 溢れのときは、例外ではなく無限大のような意味のある値を返すと扱いやすくなります。
- 0 以下や割り算の前提は、先に分けて書きます。
