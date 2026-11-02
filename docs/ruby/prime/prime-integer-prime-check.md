---
title: "割り算の回数を減らす 30 周期の素数判定"
description: "Integer#prime? は、小さな数は手で場合分けし、大きな数は Miller-Rabin 法へ回す。残りは 30 ごとの候補だけを割って確かめる。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [35, 50]
function: "Integer#prime?"
difficulty: 2
format: 2
tags: ["数値計算", "アルゴリズム", "最適化"]
---
## ひとことで

`Integer#prime?` は、整数に対して `prime?` と書くと、その数が素数なら `true`、そうでなければ `false` を返すメソッドです。
`97.prime?` は `true`、`91.prime?` は `false`（`7 × 13`）です。
数の大きさに応じて、3 つの方法を使い分けています。

## コード

```ruby:line-numbers=35
  def prime?
    return self >= 2 if self <= 3

    if (bases = miller_rabin_bases)
      return miller_rabin_test(bases)
    end

    return true if self == 5
    return false unless 30.gcd(self) == 1
    (7..Integer.sqrt(self)).step(30) do |p|
      return false if
        self%(p)    == 0 || self%(p+4)  == 0 || self%(p+6)  == 0 || self%(p+10) == 0 ||
        self%(p+12) == 0 || self%(p+16) == 0 || self%(p+22) == 0 || self%(p+24) == 0
    end
    true
  end
```

## 前提知識

- **`return ... if 条件`**: 条件が真のときだけ、そこで値を返して終わる書き方です。
- **`gcd`**: 最大公約数です。`30.gcd(self) == 1` は「30 と互いに素（共通の約数が 1 だけ）」という意味です。
- **`step(30)`**: 初めの値から 30 ずつ増やしながら、ブロックを繰り返します。
- **`Integer.sqrt`**: 平方根の整数部分です。素因数を `√n` まで調べれば十分という事実に使います。
- **`self % p`**: 割り算の余りです。`== 0` なら割り切れます。
- **`private def`**: 外からは呼べないメソッドを定義します。ここでは `miller_rabin_bases` と `miller_rabin_test` を支える部分です。

## 何をしているか

### 1. 小さい数は直接決める

```ruby:line-numbers=36
    return self >= 2 if self <= 3
```

2 以下は素数ではなく、2 と 3 は素数です。ここでは「2 以上か」で判定を終わらせます。

### 2. 大きい数は Miller-Rabin 法へ回す

```ruby:line-numbers=38
    if (bases = miller_rabin_bases)
      return miller_rabin_test(bases)
    end
```

`miller_rabin_bases` が底（base）を返せる大きさなら、確率的な判定の `miller_rabin_test` に任せます。返せない（`nil`）ほど大きな数は、次の割り算による方法へ進みます。

### 3. 2・3・5 の倍数を除く

```ruby:line-numbers=42
    return true if self == 5
    return false unless 30.gcd(self) == 1
```

5 は素数です。30 と互いに素でない数（2、3、5 の倍数）は、ここでまとめて `false` になります。

### 4. 30 ごとに候補だけを割る

```ruby:line-numbers=44
    (7..Integer.sqrt(self)).step(30) do |p|
      return false if
        self%(p)    == 0 || self%(p+4)  == 0 || self%(p+6)  == 0 || self%(p+10) == 0 ||
        self%(p+12) == 0 || self%(p+16) == 0 || self%(p+22) == 0 || self%(p+24) == 0
    end
```

`7` から始めて、30 ずつ増やします。30 の周期で、2・3・5 の倍数ではない候補は `p`, `p+4`, `p+6`, `p+10`, `p+12`, `p+16`, `p+22`, `p+24` の 8 個だけです。この 8 個で割り切れるかを調べ、1 つでも割り切れれば合成数です。

## ここがすごい

### 30 の周期で候補を 8 個に減らす

すべての奇数で割ると、大きな数ほど割り算の回数が増えます。
このコードは、2・3・5 の倍数を先に除いて、残りを 30 の周期の 8 個の候補に絞っています。
割る数が約 1/4 に減るので、割り算の回数も同じ割合で減ります。

### 割る範囲を平方根までにする

`(7..Integer.sqrt(self))` は、`√n` までしか割りません。
合成数なら、必ず `√n` 以下の素因数を持つからです。大きな数でも、割る相手は平方根までの数だけで済みます。

### 大きさで方法を切り替える

小さな数は割り算で十分に速く、大きな数は割り算では遅すぎます。
`prime?` は、その境目を `miller_rabin_bases` が `nil` を返すかどうかで決めています。
読み手は「小さい数は割る」「大きい数は確率で判定する」という考え方を、1 つのメソッドの中で追えます。

## まとめ

- 素数判定は、数の大きさによって割り算と Miller-Rabin 法を使い分けると速くなります。
- 割る候補を、倍数の性質（ここでは 30 の周期）で減らせます。
- 合成数は `√n` 以下の約数を持つので、平方根までだけ調べれば十分です。
