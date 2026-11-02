---
title: "割り算を小数にせず、行列式を求める"
description: "Matrix の determinant_bareiss は、Bareiss 法で行列式を求める。途中の値を整数のまま保ち、割り算が必ず割り切れるように計算する。"
language: ruby
project: "Ruby matrix (標準ライブラリ)"
repo: https://github.com/ruby/matrix
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "f8143363a7e9f721e66e4562ac7883e5ee5c8a36"
file: lib/matrix.rb
lines: [1369, 1394]
function: "Matrix#determinant_bareiss"
difficulty: 3
format: 2
tags: ["数値計算", "アルゴリズム", "最適化"]
---
## ひとことで

`Matrix#determinant_bareiss` は、正方行列の **行列式** を、**Bareiss 法** という方法で求めるメソッドです。
行列式は、行列から 1 つの数を取り出す値で、行列が逆行列を持つかどうかを判定するときなどに使います。
途中の計算を、常に整数のまま保ち、割り算が割り切れるように進めるのが特徴です。

## コード

```ruby:line-numbers=1369
  private def determinant_bareiss
    size = row_count
    last = size - 1
    a = to_a
    no_pivot = Proc.new{ return 0 }
    sign = +1
    pivot = 1
    size.times do |k|
      previous_pivot = pivot
      if (pivot = a[k][k]) == 0
        switch = (k+1 ... size).find(no_pivot) {|row|
          a[row][k] != 0
        }
        a[switch], a[k] = a[k], a[switch]
        pivot = a[k][k]
        sign = -sign
      end
      (k+1).upto(last) do |i|
        ai = a[i]
        (k+1).upto(last) do |j|
          ai[j] =  (pivot * ai[j] - ai[k] * a[k][j]) / previous_pivot
        end
      end
    end
    sign * pivot
  end
```

## 前提知識

- **行列式**: 正方行列（行と列の数が同じ行列）から求められる 1 つの数です。0 なら、その行列には逆行列がありません。
- **ピボット（pivot）**: 消去法で、割り算に使う対角線上の値のことです。0 だと割り算できないので、行を入れ替えます。
- **`Proc.new { return 0 }`**: 行の入れ替えが不可能だったとき、行列式が 0 だと決めて、メソッドを抜けるための仕掛けです。
- **`find(no_pivot)`**: 条件に合う要素を探し、見つからなければ引数の手続きを実行します。
- **`upto`**: 数を 1 つずつ増やしながら、ブロックを繰り返します。

## 何をしているか

### 1. 対角のピボットが 0 なら、下の行と入れ替える

```ruby:line-numbers=1376
    size.times do |k|
      previous_pivot = pivot
      if (pivot = a[k][k]) == 0
        switch = (k+1 ... size).find(no_pivot) {|row|
          a[row][k] != 0
        }
        a[switch], a[k] = a[k], a[switch]
        pivot = a[k][k]
        sign = -sign
      end
```

各段階 `k` で、対角の値 `a[k][k]` が 0 なら、下にある行から 0 でないものを探して入れ替えます。入れ替えたので、行列式の符号を反転させます。見つからなければ、行列式は 0 です。

### 2. 残りの要素を、前のピボットで割って更新する

```ruby:line-numbers=1386
      (k+1).upto(last) do |i|
        ai = a[i]
        (k+1).upto(last) do |j|
          ai[j] =  (pivot * ai[j] - ai[k] * a[k][j]) / previous_pivot
        end
      end
```

`k` より下の行と列について、`(pivot * ai[j] - ai[k] * a[k][j]) / previous_pivot` で更新します。Bareiss 法の特徴は、この割り算が必ず割り切れることです。そのため、小数にならず、整数のまま計算できます。

### 3. 最後の値に符号をかけて返す

```ruby:line-numbers=1393
    sign * pivot
```

最後に残ったピボットに符号をかけた値が、行列式です。

## ここがすごい

### 小数を使わずに、正確な答えを得る

素朴な消去法では、途中で分数や小数が出てきて、誤差が入ることがあります。
Bareiss 法は、割り算の結果が必ず整数になるように式を組み立てています。整数の行列なら、答えも正確な整数になります。

### 前のピボットで割る理由

更新式の分母は、1 段前のピボット `previous_pivot` です。
その段の計算の中で、必ず割り切れる値が現れるという性質を使っています。この性質を知っていると、式の意味が納得できます。

### 行の入れ替えを、符号で記録する

行を入れ替えると、行列式の符号が変わります。
`sign` という変数で、その変化を数えておき、最後に掛けることで、入れ替えを含めた正しい結果を得ています。

## まとめ

- 行列式は、消去法で求められますが、割り算の扱い方で正確さが変わります。
- Bareiss 法は、割り算を割り切れる形に保つことで、整数のまま正確に計算できます。
- 行の入れ替えは、符号で記録すると、結果の正しさを保てます。
