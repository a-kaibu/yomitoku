---
title: "行列を単位行列に変形し、逆行列を作る"
description: "Matrix#inverse_from は、ガウス・ジョルダン法で逆行列を作る。部分ピボット選択で誤差を抑え、同じ行の操作を単位行列にも施して逆行列を得る。"
language: ruby
project: "Ruby matrix (標準ライブラリ)"
repo: https://github.com/ruby/matrix
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "f8143363a7e9f721e66e4562ac7883e5ee5c8a36"
file: lib/matrix.rb
lines: [1184, 1226]
function: "Matrix#inverse_from"
difficulty: 3
format: 2
tags: ["数値計算", "アルゴリズム", "防御的プログラミング"]
---
## ひとことで

`Matrix#inverse_from` は、ガウス・ジョルダン法で逆行列を作る、内部用のメソッドです。
元の行列を単位行列に変形しながら、同じ操作を単位行列にも施します。すると単位行列の側が、そのまま逆行列になります。

## コード

::: code-group

```ruby:line-numbers=1184 [日本語訳]
  private def inverse_from(src) # 公開しない内部用
    last = row_count - 1
    a = src.to_a

    0.upto(last) do |k|
      i = k
      akk = a[k][k].abs
      (k+1).upto(last) do |j|
        v = a[j][k].abs
        if v > akk
          i = j
          akk = v
        end
      end
      raise ErrNotRegular if akk == 0
      if i != k
        a[i], a[k] = a[k], a[i]
        @rows[i], @rows[k] = @rows[k], @rows[i]
      end
      akk = a[k][k]

      0.upto(last) do |ii|
        next if ii == k
        q = a[ii][k].quo(akk)
        a[ii][k] = 0

        (k + 1).upto(last) do |j|
          a[ii][j] -= a[k][j] * q
        end
        0.upto(last) do |j|
          @rows[ii][j] -= @rows[k][j] * q
        end
      end

      (k+1).upto(last) do |j|
        a[k][j] = a[k][j].quo(akk)
      end
      0.upto(last) do |j|
        @rows[k][j] = @rows[k][j].quo(akk)
      end
    end
    self
  end
```

```ruby:line-numbers=1184 [原文]
  private def inverse_from(src) # :nodoc:
    last = row_count - 1
    a = src.to_a

    0.upto(last) do |k|
      i = k
      akk = a[k][k].abs
      (k+1).upto(last) do |j|
        v = a[j][k].abs
        if v > akk
          i = j
          akk = v
        end
      end
      raise ErrNotRegular if akk == 0
      if i != k
        a[i], a[k] = a[k], a[i]
        @rows[i], @rows[k] = @rows[k], @rows[i]
      end
      akk = a[k][k]

      0.upto(last) do |ii|
        next if ii == k
        q = a[ii][k].quo(akk)
        a[ii][k] = 0

        (k + 1).upto(last) do |j|
          a[ii][j] -= a[k][j] * q
        end
        0.upto(last) do |j|
          @rows[ii][j] -= @rows[k][j] * q
        end
      end

      (k+1).upto(last) do |j|
        a[k][j] = a[k][j].quo(akk)
      end
      0.upto(last) do |j|
        @rows[k][j] = @rows[k][j].quo(akk)
      end
    end
    self
  end
```

:::

## 前提知識

- **逆行列**: 元の行列と掛けると単位行列になる行列です。逆行列が存在しないことを「非正則」と呼びます。
- **単位行列**: 対角線だけが 1 で、ほかは 0 の正方行列です。
- **行の入れ替えと定数倍**: 連立方程式の解法と同じく、行どうしの足し引きや定数倍は、解の関係を変えません。
- **ピボット**: 消去のために選ぶ基準の要素です。ここでは `a[k][k]` を指します。
- **`quo`**: 割り算を行います。整数同士でも、有理数として正確に割ります。

## 何をしているか

### 1. 列ごとに、絶対値が最も大きい行を選ぶ

```ruby:line-numbers=1188
    0.upto(last) do |k|
      i = k
      akk = a[k][k].abs
      (k+1).upto(last) do |j|
        v = a[j][k].abs
        if v > akk
          i = j
          akk = v
        end
      end
```

`k` 列目の消去を始める前に、`k` 行目以降で `a[j][k].abs` が最大の行 `i` を探します。
値が 0 に近い小さな数で割ると、誤差が大きく増えるからです。これを部分ピボット選択と呼びます。

### 2. ピボットが 0 なら逆行列はない

```ruby:line-numbers=1198
      raise ErrNotRegular if akk == 0
```

`akk == 0` なら、その列はすべて 0 に近いので、非正則として `ErrNotRegular` を出します。
見つけた行を `k` 行目と入れ替えたあと、ピボットを `akk` に記録します。

### 3. 他の行から、`k` 列目の成分を消す

```ruby:line-numbers=1205
      0.upto(last) do |ii|
        next if ii == k
        q = a[ii][k].quo(akk)
        a[ii][k] = 0

        (k + 1).upto(last) do |j|
          a[ii][j] -= a[k][j] * q
        end
        0.upto(last) do |j|
          @rows[ii][j] -= @rows[k][j] * q
        end
```

`ii` 行目ごとに、`q` を `a[ii][k] / akk` として求めます。
同じ行の `a[ii][j] -= a[k][j] * q` で `k` 列目の成分を 0 にし、同じ操作を `@rows` にも行います。`@rows` は、最初は単位行列です。

### 4. ピボット行を 1 に正規化する

```ruby:line-numbers=1218
      (k+1).upto(last) do |j|
        a[k][j] = a[k][j].quo(akk)
      end
      0.upto(last) do |j|
        @rows[k][j] = @rows[k][j].quo(akk)
      end
```

最後に、`k` 行目の成分をすべて `akk` で割ります。こうして全体が単位行列に近づいていき、`@rows` が逆行列になります。

## ここがすごい

このメソッドの工夫は、二つの行列を同時に変形する点です。`a` は元の行列で、`@rows` は逆行列を作るための行列です。`a` に行った操作を `@rows` にも同じように行うので、逆行列を計算するための追加の式は不要です。

また、最初に `self.class.I(row_count)` で単位行列を作り、それを `send(:inverse_from, self)` で変形しています。`inverse_from` が `self` を書き換えず、新しい行列の側を変えるので、呼び出し元の行列は壊れません。

部分ピボット選択は、精度の面でも効いています。絶対値の大きい値を割り算の基準にするので、小さな数で割る誤差を抑えられます。一方で、ここでは分数で割るため `quo` を使っています。整数の行列でも、途中で丸められた値が混ざりません。

## まとめ

`inverse_from` は、ピボットの選択と行の入れ替え、そして同じ操作を単位行列に施す仕組みで逆行列を作ります。元の行列を壊さず、精度の低下も抑えるように設計されています。
