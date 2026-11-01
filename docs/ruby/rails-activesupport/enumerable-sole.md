---
title: "「ちょうど 1 つ」でなければエラーにする sole"
description: "要素がちょうど 1 つのときだけその要素を返し、0 個や 2 個以上ならエラーにする。2 個目を見た瞬間に止まる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [236, 254]
function: "Enumerable#sole"
difficulty: 1
tags: [防御的プログラミング, エラー処理, イテレータ]
---

## ひとことで

`sole` は、コレクションの要素が **ちょうど 1 つ** なら、その要素を返すメソッドです。
`["x"].sole` は `"x"` ですが、空のときは「見つからない」、2 つ以上あるときは「複数見つかった」というエラーになります。
「この条件に合うユーザーは 1 人のはず」という前提をコードで確かめたいときに使います。

## コード

```ruby:line-numbers=236
  def sole
    result = nil
    found = false

    each do |*element|
      if found
        raise SoleItemExpectedError, "multiple items found"
      end

      result = element.size == 1 ? element[0] : element
      found = true
    end

    if found
      result
    else
      raise SoleItemExpectedError, "no item found"
    end
  end
```

## 前提知識

- **`each do |*element| ... end`**: 要素を 1 つずつ取り出してブロックを実行します。`*element` は、ブロックに渡された値をすべて配列にまとめて受け取る書き方です。
- **`raise 例外クラス, "メッセージ"`**: 例外（エラー）を発生させ、処理を中断します。
- **`SoleItemExpectedError`**: Rails が定義した、このメソッド専用の例外クラスです。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B になります。
- **ハッシュの each**: ハッシュの `each` はブロックにキーと値の 2 つを渡します。`|*element|` で受けると `[キー, 値]` という配列になります。

## 何をしているか

### 1. 状態を用意する（237〜238 行目）

見つけた要素を入れる `result` と、すでに 1 つ見つけたかを表す `found` を用意します。

### 2. 1 つずつ見る（240〜247 行目）

- 1 つ目の要素: `found` は偽なので、`result` に入れて `found = true` にします。
- 2 つ目の要素: `found` がすでに真なので、すぐに「multiple items found」のエラーにします。

245 行目は、ブロックに渡された値が 1 つなら `element[0]`、2 つ以上（ハッシュのキーと値など）なら配列のまま保存します。`{ a: 1 }.sole` は `[:a, 1]` になります。

### 3. 最後に確認する（249〜253 行目）

ループを抜けたとき、1 つ見つけていればそれを返し、1 つもなければ「no item found」のエラーにします。

## ここがすごい

### 「最初の 1 つ」との違い

`first` は要素がいくつあっても最初の 1 つを返し、空なら `nil` を返します。そのため「本当は 1 つのはずなのに、データの不具合で 2 つあった」という状況に気づけません。
`sole` は前提が崩れたらすぐにエラーにするので、**おかしなデータを静かに使い続ける** ことを防げます。

### 2 個目で止まる

要素数を `count` や `size` で数えてから判定すると、全部を数える必要があります。このコードは 2 つ目を見た時点でエラーにして抜けるので、大きなコレクションでも無駄がありません。

### nil の要素も正しく扱う

「見つかったか」を `result` が `nil` かどうかで判断すると、`[nil].sole` のときに「見つからない」と誤判定してしまいます。`found` という別のフラグを持つことで、要素が `nil` でも正しく返せます。

### エラーの種類を分けている

0 個と 2 個以上で違うメッセージを出すので、ログを見るだけで何が起きたかわかります。

## まとめ

- 「ちょうど 1 つのはず」という前提は、確かめるメソッドを使うと不具合に早く気づけます。
- 要素の値とは別に「見つけたか」のフラグを持つと、`nil` の要素も正しく扱えます。
- 条件が崩れた時点ですぐに止まると、余計な処理をしません。
