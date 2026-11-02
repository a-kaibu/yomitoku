---
title: "余りをぴったり埋める「(n - size % n) % n」の式"
description: "配列を決まった個数ずつに分ける in_groups_of。足りない分を埋める個数を、分岐なしの 1 行の計算で求めている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/grouping.rb
lines: [30, 51]
function: "Array#in_groups_of"
difficulty: 1
format: 2
tags: [イディオム, 数値計算, 標準ライブラリ]
---

## ひとことで

`in_groups_of(n)` は、配列を **n 個ずつのグループに分ける** メソッドです。
`[1, 2, 3, 4, 5].in_groups_of(2)` は `[[1, 2], [3, 4], [5, nil]]` になり、最後のグループの足りない場所は `nil`（または指定した値）で埋められます。
表のように「1 行に 3 個ずつ並べる」画面を作るときなどに便利です。

## コード

::: code-group

```ruby:line-numbers=30 [日本語訳]
  def in_groups_of(number, fill_with = nil, &block)
    if number.to_i <= 0
      raise ArgumentError,
        "Group size must be a positive integer, was #{number.inspect}"
    end

    if fill_with == false
      collection = self
    else
      # size % number は、余りの個数を表す。
      # number から引くと、追加する個数になる。
      # 最後に % number をすると、埋めるだけのグループを作らないようにする。
      padding = (number - size % number) % number
      collection = dup.concat(Array.new(padding, fill_with))
    end

    if block_given?
      collection.each_slice(number, &block)
    else
      collection.each_slice(number).to_a
    end
  end
```

```ruby:line-numbers=30 [原文]
  def in_groups_of(number, fill_with = nil, &block)
    if number.to_i <= 0
      raise ArgumentError,
        "Group size must be a positive integer, was #{number.inspect}"
    end

    if fill_with == false
      collection = self
    else
      # size % number gives how many extra we have;
      # subtracting from number gives how many to add;
      # modulo number ensures we don't add group of just fill.
      padding = (number - size % number) % number
      collection = dup.concat(Array.new(padding, fill_with))
    end

    if block_given?
      collection.each_slice(number, &block)
    else
      collection.each_slice(number).to_a
    end
  end
```

:::

## 前提知識

- **デフォルト引数**: `fill_with = nil` は「省略されたら `nil` を使う」という意味です。
- **`raise ArgumentError, "..."`**: 例外（エラー）を発生させます。不正な引数を受け取ったときに使う定番の書き方です。
- **`"#{...}"`**: 文字列の中に式の値を埋め込む書き方（式展開）です。`inspect` は値をデバッグ用の文字列にします。
- **`%`（剰余）**: 割り算の余りです。`5 % 2` は `1`、`4 % 2` は `0` です。
- **`dup` と `concat`**: `dup` は配列のコピーを作り、`concat` はそこに別の配列の要素を後ろに付け足します。元の配列は変わりません。
- **`Array.new(3, x)`**: `x` が 3 つ並んだ配列 `[x, x, x]` を作ります。
- **`each_slice(n)`**: 配列を先頭から n 個ずつ区切って取り出す、Ruby 標準のメソッドです。ブロックなしで呼ぶと「あとで取り出せるもの（Enumerator）」を返し、`to_a` で配列にできます。

## 何をしているか

### 1. 引数のチェック

```ruby:line-numbers=31
    if number.to_i <= 0
      raise ArgumentError,
        "Group size must be a positive integer, was #{number.inspect}"
    end
```
0 個ずつや -1 個ずつには分けられないので、`ArgumentError` を出します。メッセージに実際の値を入れて、原因をわかりやすくしています。

### 2. 埋める数を計算する

```ruby:line-numbers=36
    if fill_with == false
      collection = self
    else
      # size % number gives how many extra we have;
      # subtracting from number gives how many to add;
      # modulo number ensures we don't add group of just fill.
      padding = (number - size % number) % number
      collection = dup.concat(Array.new(padding, fill_with))
    end
```
`fill_with` に `false` を渡したときは「埋めない」という意味なので、元の配列をそのまま使います。
それ以外は、次の式で埋める個数を求めます。

```ruby:line-numbers=42
      padding = (number - size % number) % number
```

5 個の配列を 2 個ずつに分ける場合で追ってみます。

- `size % number` → `5 % 2 = 1`（最後のグループに入っている数）
- `number - 1` → `2 - 1 = 1`（足りない数）
- `1 % 2` → `1`

よって `nil` を 1 個足して `[1, 2, 3, 4, 5, nil]` にします。

### 3. each_slice で区切る

```ruby:line-numbers=46
    if block_given?
      collection.each_slice(number, &block)
    else
      collection.each_slice(number).to_a
    end
```
あとは標準の `each_slice` に任せます。ブロックが渡されていればグループごとにブロックを実行し、なければ配列の配列を返します。

## ここがすごい

### 割り切れるときも同じ式で 0 になる

4 個を 2 個ずつに分けるとき、`size % number` は 0 なので `number - 0 = 2` になり、そのままだと「`nil` が 2 個だけのグループ」が余計にできてしまいます。
そこで最後にもう一度 `% number` をしています。`2 % 2 = 0` なので、割り切れるときは何も足しません。
`if size % number == 0` のような分岐を書かずに、**1 つの式ですべての場合を正しく扱う** 小技です（コード中のコメントにも説明があります）。

### 本体を壊さない

`dup` してから `concat` するので、呼び出し元の配列に `nil` が混ざることはありません。メソッドを呼んだだけで元のデータが変わると、思わぬバグの原因になります。

### 標準の部品に任せる

「n 個ずつ区切る」部分は自分で書かず `each_slice` に任せています。このメソッドが新しく担当しているのは「埋める」部分だけなので、コードが短く読みやすくなっています。

## まとめ

- `(n - x % n) % n` は「次の n の倍数まであといくつか」を求める定番の式です。
- 最後の `% n` で「ちょうど割り切れる」場合も分岐なしで扱えます。
- 引数がおかしいときは、値を含めたメッセージで早めにエラーにすると親切です。
- 既存のメソッドで足りない部分だけを足すと、実装が小さくなります。
