---
title: "整数を素因数分解して「素数の何乗か」の組にする"
description: "Prime.prime_division は、整数を素数の積に分け、[素数, 指数] の組の配列で返す。小さい素数から順に割り、残りが 1 より大きければそれ自体が素数。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [303, 327]
function: "Prime.prime_division"
difficulty: 2
format: 2
tags: ["数値計算", "アルゴリズム", "イテレータ"]
---
## ひとことで

`Prime.prime_division` は、整数を **素因数分解** して、`[素数, 指数]` の組の配列で返すメソッドです。
`Prime.prime_division(45)` は `[[3, 2], [5, 1]]` を返します。これは `3² × 5 = 45` を意味します。

## コード

```ruby:line-numbers=303
  def prime_division(value, generator = Prime::Generator23.new)
    raise ZeroDivisionError if value == 0
    if value < 0
      value = -value
      pv = [[-1, 1]]
    else
      pv = []
    end
    generator.each do |prime|
      count = 0
      while (value1, mod = value.divmod(prime)
             mod) == 0
        value = value1
        count += 1
      end
      if count != 0
        pv.push [prime, count]
      end
      break if value1 <= prime
    end
    if value > 1
      pv.push [value, 1]
    end
    pv
  end
```

## 前提知識

- **素因数分解**: 整数を素数だけの掛け算に分けることです。`45 = 3 × 3 × 5` のように書けます。
- **指数**: 同じ数を何回掛けるかを表す数です。`3²` の `2` が指数です。
- **`raise ZeroDivisionError`**: 0 は素因数分解できないので、例外を投げて知らせます。
- **`divmod`**: 商と余りを、2 つの値として同時に返します。`value1, mod = value.divmod(prime)` の形で使います。
- **ジェネレーター（`generator`）**: 素数の候補を順に出してくれるオブジェクトです。`each` で順に取り出します。
- **`break`**: 繰り返しを途中で止めます。

## 何をしているか

### 1. 負の数は符号を別に覚える

```ruby:line-numbers=304
    raise ZeroDivisionError if value == 0
    if value < 0
      value = -value
      pv = [[-1, 1]]
    else
      pv = []
    end
```

0 はエラーにします。負の数なら、符号を `[-1, 1]` という組として最初に入れておき、以降は絶対値で計算します。

### 2. 小さい素数から順に割る

```ruby:line-numbers=311
    generator.each do |prime|
      count = 0
      while (value1, mod = value.divmod(prime)
             mod) == 0
        value = value1
        count += 1
      end
```

`generator` が出す素数 `prime` で、`value` が割り切れる間は割り続けます。`mod == 0` の間だけ `count` を増やし、割れた分を `value` に反映します。

例えば `value = 45` で `prime = 3` のとき、`45 → 15 → 5` と 2 回割れるので、`count` は 2 になります。

### 3. 割れた素数を記録して、打ち切りを判定する

```ruby:line-numbers=318
      if count != 0
        pv.push [prime, count]
      end
      break if value1 <= prime
    end
```

`count` が 0 でなければ、`[prime, count]` の組を配列へ入れます。
そして `value1 <= prime` なら、残りの `value` にはもう `prime` より大きな素因数が入りようがないので、繰り返しを打ち切ります。

### 4. 残りが 1 より大きければ、それ自身が素数

```ruby:line-numbers=323
    if value > 1
      pv.push [value, 1]
    end
    pv
```

ここまでで割り切れなかった残りが 1 より大きければ、残りは素数 1 つです。`[value, 1]` を足して返します。

## ここがすごい

### 「`√n` を超えたら終わり」を `break` で表す

`value1 <= prime` は、残りが今の素数より小さいか等しければ、それ以上割る必要がないという意味です。
大きな素因数を最後に 1 つだけ残して、残りを一気に決める考え方を、単純な条件 1 つで実現しています。

### 候補の素数を外から渡せる

`generator` は引数のデフォルト値で `Prime::Generator23.new` が使われますが、利用者は別のジェネレーターに差し替えられます。
アルゴリズムと素数の候補の作り方が分かれているので、どちらも取り替えやすくなっています。

### 残りを 1 つの素数として扱う

最後の `value` が 1 より大きければ、もうそれ以上割れない素数です。
特別な処理を作らず、「残りは素数 1 つ」というルールで同じ形の組にまとめています。

## まとめ

- 素因数分解は、小さい素数から順に割り、割れた回数を指数として記録すれば求まります。
- 残りの `value` が `prime` 以下になったら、打ち切ってよいという判定を使うと無駄がありません。
- 素数の候補を別のオブジェクトに任せると、アルゴリズムを変えずに候補の作り方だけを差し替えられます。
