---
title: 重みつきの当たりくじを 1 回のループで引く
description: Lua の小さなユーティリティ集 lume の weightedchoice。重みの合計を求め、乱数をその範囲に投げて、順番に重みを引き算していく方法で項目を選びます。
language: lua
project: lume
repo: https://github.com/rxi/lume
license: MIT
copyright: Copyright (c) 2020 rxi
commit: "98847e7812cf28d3d64b289b03fad71dc704547d"
file: lume.lua
lines: [145, 157]
format: 2
function: lume.weightedchoice
difficulty: 1
tags: [乱数, アルゴリズム, イテレータ]
---

## ひとことで

`lume.weightedchoice(t)` は、`t` に「項目 → 重み」の表を渡すと、重みに比例した確率で項目のキーを 1 つ返す関数です。`{ apple = 3, banana = 1 }` なら `apple` が出る確率は `banana` の 3 倍になります。ゲームのドロップ率や、確率つきの抽選に使えます。

## コード

```lua:line-numbers=145
function lume.weightedchoice(t)
  local sum = 0
  for _, v in pairs(t) do
    assert(v >= 0, "weight value less than zero")
    sum = sum + v
  end
  assert(sum ~= 0, "all weights are zero")
  local rnd = lume.random(sum)
  for k, v in pairs(t) do
    if rnd < v then return k end
    rnd = rnd - v
  end
end
```

## 前提知識

- **`pairs`**: テーブルのキーと値を順番に取り出すための反復処理です。`for k, v in pairs(t)` は、すべての項目を 1 つずつ `k`（キー）と `v`（値）に入れて回します。
- **`assert`**: 条件が偽のときにエラーを出す関数です。`assert(条件, "メッセージ")` と書きます。
- **乱数**: `lume.random(sum)` は、`0` より大きく `sum` 以下の小数を返します。`lume.random` は内部で `a + math.random() * (b - a)` を計算しているので、引数が 1 つだけのときは `b` が `0` になり、結果は `sum` から `0` の間に散らばります。
- **`pairs` の順番**: Lua の `pairs` は、キーを並べる順番を保証しません。そのため「どの項目から引き算されるか」は実行のたびに変わることがあります。

## 何をしているか

### 1. 重みの合計を求め、負の重みを弾く

まず全部の重みを足します。負の重みは「確率が負」になってしまうので、`assert` で止めます。合計が `0` のときも、抽選の範囲がないので止めます。

```lua:line-numbers=146
  local sum = 0
  for _, v in pairs(t) do
    assert(v >= 0, "weight value less than zero")
    sum = sum + v
  end
  assert(sum ~= 0, "all weights are zero")
```

たとえば `{ apple = 3, banana = 1 }` なら、合計は `4` になります。

### 2. 合計の範囲で乱数を 1 つ引く

`lume.random(sum)` で、`0` より大きく `4` 以下の小数を 1 つ選びます。この数は「数直線の上で、どの項目の区間に落ちるか」を決めるための的になります。

```lua:line-numbers=152
  local rnd = lume.random(sum)
```

### 3. 重みの長さの区間を順番に引き算する

数直線を項目の重みで切り分けると、`apple` が `0〜3`、`banana` が `3〜4` の区間になります。`rnd` が `apple` の重みより小さければ `apple` を返します。そうでなければ `rnd` から重みを引いて、次の項目へ進みます。

```lua:line-numbers=153
  for k, v in pairs(t) do
    if rnd < v then return k end
    rnd = rnd - v
  end
```

`rnd` が `3.5` だったとき、`apple` の重み `3` は `3.5` より小さいので引き算が起き、残りは `0.5` になります。次の `banana` の重み `1` で `0.5 < 1` となり、`banana` が選ばれます。

## ここがすごい

- **1 回の乱数で済む**: 候補を 1 つずつ試して「当たりかどうか」を判定する方法と違い、乱数は 1 回だけです。項目を増やしてもコードの形は変わりません。
- **数直線で考える**: 重みを区間の長さとして並べると、確率の話が「的がどこに落ちるか」という単純な問題になります。引き算で区間の端を追い越していくのが、この関数の核心です。
- **素直な書き方との比較**: 候補ごとに `if math.random() < w / sum` と書く方法は、判定が独立しているので確率が合わなくなります。区間を使う方法なら、必ず 1 つだけが選ばれます。
- **トレードオフ**: 項目が多いと毎回の検索が長くなります。大量の抽選を繰り返すなら、区間の表を前もって作って二分探索するほうが速くなります。

## まとめ

- 重みつきの抽選は、合計を数直線と見なすと 1 回の乱数で済む。
- 負の重みや合計 `0` は、最初に `assert` で弾く。
- 区間の引き算で候補を順に進めると、選ばれるのは必ず 1 つになる。
