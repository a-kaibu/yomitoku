---
title: "番号で素数を取り出す、エラトステネスの生成器"
description: "Prime::EratosthenesGenerator#succ は、次に必要な素数の番号を増やし、篩（ふるい）で作った素数の表から取り出す。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [416, 419]
function: "Prime::EratosthenesGenerator#succ"
difficulty: 2
format: 2
tags: ["数値計算", "イテレータ", "アルゴリズム"]
---
## ひとことで

`Prime::EratosthenesGenerator#succ` は、**次に必要な素数を、番号で取り出す** メソッドです。
内部では、エラトステネスの篩（ふるい）で作った素数の表を使います。
呼ばれるたびに番号を 1 つ進めて、その番号の素数を返します。

## コード

```ruby:line-numbers=416
    def succ
      @last_prime_index += 1
      EratosthenesSieve.instance.get_nth_prime(@last_prime_index)
    end
```

## 前提知識

- **エラトステネスの篩**: 2 から順に、その倍数を消していく素数の求め方です。残ったものが素数になります。
- **ジェネレーター**: 素数を順に作り出すオブジェクトです。`succ` や `next` で、次の値を取り出します。
- **番号（インデックス）**: 素数の表の中の位置です。0 番目は 2、1 番目は 3 のように並んでいます。
- **`EratosthenesSieve.instance`**: 篩の表を持つ、唯一のオブジェクトです。
- **`get_nth_prime(n)`**: 表の中の n 番目の素数を返します。

## 何をしているか

### 1. 番号を 1 つ進める

```ruby:line-numbers=417
      @last_prime_index += 1
```

`@last_prime_index` は、最後に取り出した素数の番号です。呼ばれるたびに 1 増やして、次の番号にします。

### 2. その番号の素数を、表から取り出す

```ruby:line-numbers=418
      EratosthenesSieve.instance.get_nth_prime(@last_prime_index)
```

`get_nth_prime` で、篩の表から、その番号の素数を返します。表に無ければ、表を広げながら求めます。

## ここがすごい

### 表を、複数のジェネレーターで共有する

篩の表は `instance` を通して、1 つだけ用意されています。
別のジェネレーターが同じ素数を必要としても、表を作り直さずに済みます。

### 番号だけを持つ

ジェネレーターの状態は、今の番号 1 つだけです。
素数そのものは保存しないので、軽いオブジェクトになります。

### 巻き戻しを、初期化で行う

`rewind` は `initialize` を呼びます。番号を -1 に戻すので、最初からやり直せます。
状態の初期化を、1 か所にまとめています。

## まとめ

- 素数の列は、番号だけを持って表から取り出すと、状態を小さく保てます。
- 大きな表は、共有の唯一のオブジェクトにすると、無駄な計算を避けられます。
- 巻き戻しを初期化の仕組みで行うと、状態の戻し方が 1 か所にまとまります。
