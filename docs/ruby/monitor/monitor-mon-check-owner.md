---
title: "ロックの持ち主でないスレッドによる操作を、すぐに止める"
description: "MonitorMixin#mon_check_owner は、今のスレッドがモニターの持ち主かを確かめ、違えば ThreadError を投げる。条件変数の待ちなど、持ち主だけが許される操作の前に使う。"
language: ruby
project: "Ruby monitor (標準ライブラリ)"
repo: https://github.com/ruby/monitor
license: "BSD-2-Clause"
copyright: "Copyright (C) 2001 Shugo Maeda <shugo@ruby-lang.org>; Copyright (C) 1993-2013 Yukihiro Matsumoto. All rights reserved."
commit: "b635f1c1df567f65515fac40d423e89d6599a7e6"
file: lib/monitor.rb
lines: [269, 273]
function: "MonitorMixin#mon_check_owner"
difficulty: 1
format: 2
tags: ["並行処理", "防御的プログラミング", "エラー処理"]
---
## ひとことで

`mon_check_owner` は、「いま動いているスレッドが、このモニターのロックを持っているか」を確かめるメソッドです。
持っていなければ、`ThreadError` を投げて処理を止めます。
ロックを持たずに条件変数を待つ、といった誤った使い方を、早い段階で見つけるためにあります。

## コード

```ruby:line-numbers=269
  def mon_check_owner
    if @mon_owner != Thread.current
      raise ThreadError, "current thread not owner"
    end
  end
```

## 前提知識

- **モニターの持ち主**: 今ロックを握っているスレッドです。`@mon_owner` にその記録が入っています。
- **`Thread.current`**: 今動いているスレッドを表すオブジェクトです。
- **`ThreadError`**: スレッドに関する誤った操作で投げられる例外です。
- **`raise`**: 例外を投げて、そこで処理を止める文です。
- **内部メソッド**: `MonitorMixin` の中で、利用者の代わりに呼ばれる部品です。直接呼ぶことは想定されていません。

## 何をしているか

### 1. 持ち主が今のスレッドかを比べる

```ruby:line-numbers=270
    if @mon_owner != Thread.current
```

`@mon_owner` は、ロックを持っているスレッドです。それが今のスレッドと違えば、ロックを持っていません。
`!=` の比べ方によって、「持っていない」場合だけが `if` に入ります。

### 2. 違えば、例外で止める

```ruby:line-numbers=271
      raise ThreadError, "current thread not owner"
```

持ち主でなければ、ここで例外を投げます。メッセージは「current thread not owner」、つまり「今のスレッドは持ち主ではない」です。
例外が投げられると、その先の処理は実行されません。

### 3. 持ち主なら、何もせず戻る

`if` の条件が偽なら、中は実行されず、メソッドは終わります。戻り値は使われていません。
このメソッドは、確かめるだけで、ロックの状態を変えることはありません。

## ここがすごい

### 間違いを、後で壊れる前に見つける

ロックを持っていないのに条件変数を待つと、後になって「なぜか待ち続ける」「ロックが外れている」といった分かりにくい不具合になります。
このメソッドは、呼ばれた時点で即座に例外を投げるので、どこで間違えたかがすぐ分かります。

### 状態を変えずに、確かめるだけ

`mon_check_owner` は、持ち主を変えたり、ロックを取ったりしません。確かめるだけの関数なので、いつ呼んでも安全です。
複数の場所から呼んでも、ほかの動きに影響しません。

### 例外のクラスを、意味に合わせて選んでいる

スレッドの持ち主に関する誤りなので、一般的な `RuntimeError` ではなく `ThreadError` を使っています。
例外を捕まえる側も、「スレッドの扱いを間違えた」と判断できます。

## まとめ

- `mon_check_owner` は、今のスレッドがロックの持ち主かを確かめます。
- 持ち主でなければ、`ThreadError` を投げて処理を止めます。
- 確かめるだけで、ロックの状態は変えません。
- 誤りを早い段階で見つけるので、後で分かりにくい不具合になるのを防げます。
