---
title: "2 と 3 の倍数を飛ばして素数の候補を作る"
description: "Prime::Generator23 は、2 と 3 で割り切れない数だけを順に返す。増える幅を 2 と 4 で交互に切り替えて、無駄な候補を省いている。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [456, 468]
function: "Prime::Generator23#succ"
difficulty: 2
format: 2
tags: ["数値計算", "アルゴリズム", "イテレータ"]
---
## ひとことで

`Prime::Generator23#succ` は、**2 と 3 で割り切れない数だけ** を、小さい順に 1 つずつ返すメソッドです。
返す値は 5, 7, 11, 13, 17, 19, 23, … のように、2 と 3 の倍数を除いた列になります。
素数だけではなく素数の候補を返すので、「素数の候補ジェネレーター（pseudo-prime generator）」と呼ばれる部品です。

## コード

```ruby:line-numbers=456
    def succ
      if (@step)
        @prime += @step
        @step = 6 - @step
      else
        case @prime
        when 1; @prime = 2
        when 2; @prime = 3
        when 3; @prime = 5; @step = 2
        end
      end
      @prime
    end
```

## 前提知識

- **`succ`（successor）**: 次の値を返す、という名前のメソッドです。ここでは次の候補を返します。
- **`alias next succ`**: `next` という別名を付けて、同じメソッドを呼べるようにします。
- **`if (@step)`**: インスタンス変数 `@step` が `nil` でないかを調べます。
- **`case ... when ...; ...`**: 値ごとに処理を分けます。`;` で 1 行の中に書けます。
- **インスタンス変数（`@prime`、`@step`）**: オブジェクトの中に保存しておく値です。呼び出しのたびに状態が残ります。

## 何をしているか

### 1. 初めの 3 つは決め打ちで返す

```ruby:line-numbers=461
        case @prime
        when 1; @prime = 2
        when 2; @prime = 3
        when 3; @prime = 5; @step = 2
        end
```

最初の呼び出しでは `@step` が `nil` なので、`else` の `case` に入ります。
`1` → `2`、`2` → `3` と進み、`3` のとき `@prime = 5` にして、`@step = 2` を設定します。
`2` と `3` は素数ですが、2 と 3 の倍数ではない最初の候補が `5` なので、ここで列の形が決まります。

### 2. 増える幅を交互に変える

```ruby:line-numbers=457
      if (@step)
        @prime += @step
        @step = 6 - @step
```

`@step` が設定されてからは、`@prime += @step` で次の候補へ進みます。
`@step = 6 - @step` で、増える幅が 2 と 4 の間を行き来します。

例えば `5` のあとは、`5 + 2 = 7`、そのあと幅は `6 - 2 = 4` になり、`7 + 4 = 11`、幅は再び 2 で `11 + 2 = 13` になります。

### 3. 候補を返す

```ruby:line-numbers=467
      @prime
```

更新した `@prime` を返します。呼び出し側は、この値を順に受け取ります。

## ここがすごい

### 6 の周期で、2 の倍数と 3 の倍数を同時に飛ばす

2 と 3 の最小公倍数は 6 です。6 の周期では、残るのは `6k+1` と `6k+5` の 2 種類だけです。
`5 → 7 → 11 → 13` は、この 2 つを交互に並べたものです。
幅を 2 と 4 で切り替えるだけで、2 と 3 の倍数を飛ばせます。

### 状態を 2 つの変数に閉じ込める

`@prime` は今の候補、`@step` は次の幅です。どちらもオブジェクトの中にあるので、呼び出しのたびに続きから計算できます。
別のジェネレーターを作っても、互いに影響しません。

### 「素数の候補」であることを明示する

この生成器は、2 と 3 以外の素数だけを確実に返すわけではなく、6 の周期の候補を返すだけです。
名前が `Generator23` で、クラスの説明にも「2 と 3 で割り切れない数」と書かれているので、読み手は正確な意味をつかめます。

## まとめ

- 2 と 3 の倍数を除くと、残りの候補は 6 の周期で 2 種類になります。
- 増える幅を交互に切り替えると、候補を 1 つずつ素早く作れます。
- 生成器は `succ` と `next` のような形にしておくと、`each` などの繰り返しに組み込みやすくなります。
