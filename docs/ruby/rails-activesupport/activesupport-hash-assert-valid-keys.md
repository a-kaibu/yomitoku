---
title: "想定外の鍵が混ざっていないかを確かめる"
description: "Hash#assert_valid_keys は、ハッシュの鍵がすべて許可された一覧に含まれるかを調べ、知らない鍵があれば ArgumentError を出す。オプションの打ち間違いを早く見つける。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/hash/keys.rb
lines: [54, 61]
function: "Hash#assert_valid_keys"
difficulty: 2
format: 2
tags: ["データ構造", "API設計", "防御的プログラミング"]
---
## ひとことで

`Hash#assert_valid_keys` は、ハッシュの **鍵がすべて許可された一覧に含まれているか** を確かめるメソッドです。
知らない鍵が 1 つでもあれば、`ArgumentError` を出して、どの鍵が不正だったかを伝えます。
`{ colr: "red" }.assert_valid_keys(:color)` は、`colr` が不正なので例外になります。

## コード

```ruby:line-numbers=54
  def assert_valid_keys(*valid_keys)
    valid_keys.flatten!
    each_key do |k|
      unless valid_keys.include?(k)
        raise ArgumentError.new("Unknown key: #{k.inspect}. Valid keys are: #{valid_keys.map(&:inspect).join(', ')}")
      end
    end
  end
```

## 前提知識

- **オプションのハッシュ**: メソッドに「名前付きの引数」を渡すとき、ハッシュにまとめて渡すことがあります。`color: "red"` のように書きます。
- **打ち間違い**: `colr` のような、キーの綴りの誤りです。実行しても、ふつうは何も起きず、設定が効かないまま気づきにくくなります。
- **`flatten!`**: 配列の中の配列を、1 段の配列にします。引数の並べ方を柔軟にするために使われています。
- **`each_key`**: ハッシュの鍵を、順に取り出します。
- **`raise ArgumentError.new(...)`**: 引数の誤りを表す例外を、メッセージ付きで発生させます。

## 何をしているか

### 1. 許可された鍵の一覧を整える

```ruby:line-numbers=55
    valid_keys.flatten!
```

引数で渡された許可の一覧を、配列として 1 つにそろえます。配列を並べて渡しても、そのまま渡しても、同じように扱えます。

### 2. 各鍵が一覧に含まれるかを確かめる

```ruby:line-numbers=56
    each_key do |k|
      unless valid_keys.include?(k)
```

ハッシュの鍵を 1 つずつ取り出し、許可の一覧に含まれないものを探します。

### 3. 不正な鍵があれば、例外を出す

```ruby:line-numbers=58
        raise ArgumentError.new("Unknown key: #{k.inspect}. Valid keys are: #{valid_keys.map(&:inspect).join(', ')}")
```

見つかったら、その鍵の表示と、許可されている鍵の一覧を含めて、`ArgumentError` を発生させます。メッセージから、正しい綴りを推測できます。

## ここがすごい

### 打ち間違いを、実行の早い段階で見つける

設定の鍵の綴りが違っても、普通はそのまま無視されてしまいます。
この検査を入れると、メソッドの最初で誤りが分かり、原因を探す手間が減ります。

### 正しい候補をメッセージに含める

「Unknown key」だけでは、どれが正しいか分かりません。
許可されている鍵の一覧を並べるので、利用者は修正の方向をすぐに知ることができます。

### 一覧を柔軟に受け取る

`flatten!` によって、`assert_valid_keys(:a, :b)` と `assert_valid_keys([:a, :b])` のどちらでも同じ結果になります。
呼び出し側の書き方の違いを、ここで吸収しています。

## まとめ

- オプションの鍵は、早い段階で検査すると、打ち間違いによる不具合を防げます。
- 例外のメッセージには、正しい候補を含めると、利用者がすぐ直せます。
- 引数の形のゆれは、先頭でそろえると、後の処理が単純になります。
