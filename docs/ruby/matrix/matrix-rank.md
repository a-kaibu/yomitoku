---
title: "行列の「独立な行の数」を消去法で数える"
description: "Matrix#rank は、行列の階数（独立な行の数）を、Bareiss 法の消去で求める。割り算を割り切れる形に保ち、整数のまま計算する。"
language: ruby
project: "Ruby matrix (標準ライブラリ)"
repo: https://github.com/ruby/matrix
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "f8143363a7e9f721e66e4562ac7883e5ee5c8a36"
file: lib/matrix.rb
lines: [1426, 1452]
function: "Matrix#rank"
difficulty: 3
format: 2
tags: ["数値計算", "アルゴリズム", "最適化"]
---
## ひとことで

`Matrix#rank` は、行列の **階数（rank）** を求めるメソッドです。
階数は、行列の中で「他の行の組み合わせでは作れない行」の数を表します。
階数が行数より小さいとき、その行列には逆行列がありません。

## コード

::: code-group

```ruby:line-numbers=1426 [日本語訳]
  def rank
    # 現在は、Bareiss 法の整数を保つガウス消去法を使っている
    # （詳しくは determinant の説明を参照）
    a = to_a
    last_column = column_count - 1
    last_row = row_count - 1
    pivot_row = 0
    previous_pivot = 1
    0.upto(last_column) do |k|
      switch_row = (pivot_row .. last_row).find {|row|
        a[row][k] != 0
      }
      if switch_row
        a[switch_row], a[pivot_row] = a[pivot_row], a[switch_row] unless pivot_row == switch_row
        pivot = a[pivot_row][k]
        (pivot_row+1).upto(last_row) do |i|
           ai = a[i]
           (k+1).upto(last_column) do |j|
             ai[j] =  (pivot * ai[j] - ai[k] * a[pivot_row][j]) / previous_pivot
           end
         end
        pivot_row += 1
        previous_pivot = pivot
      end
    end
    pivot_row
  end
```

```ruby:line-numbers=1426 [原文]
  def rank
    # We currently use Bareiss' multistep integer-preserving gaussian elimination
    # (see comments on determinant)
    a = to_a
    last_column = column_count - 1
    last_row = row_count - 1
    pivot_row = 0
    previous_pivot = 1
    0.upto(last_column) do |k|
      switch_row = (pivot_row .. last_row).find {|row|
        a[row][k] != 0
      }
      if switch_row
        a[switch_row], a[pivot_row] = a[pivot_row], a[switch_row] unless pivot_row == switch_row
        pivot = a[pivot_row][k]
        (pivot_row+1).upto(last_row) do |i|
           ai = a[i]
           (k+1).upto(last_column) do |j|
             ai[j] =  (pivot * ai[j] - ai[k] * a[pivot_row][j]) / previous_pivot
           end
         end
        pivot_row += 1
        previous_pivot = pivot
      end
    end
    pivot_row
  end
```

:::

## 前提知識

- **階数（rank）**: 行列の中で、互いに独立な行（または列）の最大の数です。
- **消去法（ガウス消去法）**: 行どうしを引き算して、下の段の要素を 0 にしていく方法です。
- **ピボット**: 消去で割り算の基準にする要素です。0 のときは、行を入れ替えます。
- **Bareiss 法**: 割り算の結果が必ず整数になるように、式を組み立てる消去法です。
- **`find`**: 条件に合う最初の要素を探します。

## 何をしているか

### 1. 列ごとに、ピボットになる行を探す

```ruby:line-numbers=1429
    a = to_a
    last_column = column_count - 1
    last_row = row_count - 1
    pivot_row = 0
    previous_pivot = 1
    0.upto(last_column) do |k|
      switch_row = (pivot_row .. last_row).find {|row|
        a[row][k] != 0
      }
```

各列 `k` について、まだ使っていない行（`pivot_row` 以降）の中から、その列が 0 でない行を探します。見つからなければ、この列は独立な行を増やしません。

### 2. 見つかった行を、ピボットの位置へ移す

```ruby:line-numbers=1439
        a[switch_row], a[pivot_row] = a[pivot_row], a[switch_row] unless pivot_row == switch_row
        pivot = a[pivot_row][k]
```

見つかった行を、`pivot_row` の位置へ入れ替えます。そして、その列の値をピボットにします。

### 3. 下の行を、整数を保ったまま消す

```ruby:line-numbers=1441
        (pivot_row+1).upto(last_row) do |i|
           ai = a[i]
           (k+1).upto(last_column) do |j|
             ai[j] =  (pivot * ai[j] - ai[k] * a[pivot_row][j]) / previous_pivot
           end
         end
```

ピボットより下の行について、列 `k` より右の要素を計算し直します。割り算は、`previous_pivot` で行い、結果が整数に保たれます。

### 4. 次の段へ進める

```ruby:line-numbers=1447
        pivot_row += 1
        previous_pivot = pivot
```

使った行の数を 1 つ増やし、このピボットを次の割り算の基準にします。

### 5. 使った行の数を返す

```ruby:line-numbers=1450
    end
    pivot_row
  end
```

最後に、ピボットとして使われた行の数を返します。これが階数です。

## ここがすごい

### 行列式と同じ仕組みを使う

階数の計算は、行列式と同じ Bareiss 法の消去を使っています。
同じ仕組みを使うので、整数の行列なら、途中の値が小数になりません。

### 数えるだけで答えが出る

階数は、ピボットになった行の数を数えるだけで決まります。
消去の結果を作り直す必要がなく、数を 1 つずつ増やすだけで済みます。

### 古いメソッドを、新しい名前に寄せる

コメントには、かつての `rank_e` が非推奨で、`rank` を使うべきだと書かれています。
使い方が統一されていくように、名前を整理しています。

## まとめ

- 階数は、消去法でピボットになった行の数として求められます。
- 行列式と同じ整数を保つ方法を使うと、途中で小数が出ず、正確に計算できます。
- 古い名前は、非推奨として残しつつ、新しい名前へ利用を誘導すると、混乱を避けられます。
