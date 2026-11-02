---
title: "比較にかかる時間から秘密を盗ませない、定数時間の文字列比較"
description: "パスワードやトークンを比べるとき、1 文字目で違っても最後まで調べる比較。XOR と OR を全バイトに積み重ねて、違いがあったかだけを最後に見る。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/security_utils.rb
lines: [4, 38]
function: "ActiveSupport::SecurityUtils.fixed_length_secure_compare"
difficulty: 3
format: 2
tags: [セキュリティ, 暗号, ビット演算]
---

## ひとことで

`secure_compare(a, b)` は、2 つの文字列が等しいかを、**比較にかかる時間が中身によって変わらないように** 調べるメソッドです。
API トークンや署名（HMAC）のように、攻撃者に知られてはいけない値を比べるときに使います。
ふつうの `a == b` では、比較にかかった時間から秘密を少しずつ推測される「タイミング攻撃」のおそれがあるからです。

## コード

::: code-group

```ruby:line-numbers=4 [日本語訳]
module ActiveSupport
  module SecurityUtils
    if defined?(OpenSSL.fixed_length_secure_compare)
      # 固定長の文字列の、定数時間での比較です。
      #
      # 比較する値は、固定長であるべきです。たとえば
      # HMAC で処理済みの文字列などです。長さが違えば例外を出します。
      def fixed_length_secure_compare(a, b)
        OpenSSL.fixed_length_secure_compare(a, b)
      end
    else
      def fixed_length_secure_compare(a, b)
        raise ArgumentError, "string length mismatch." unless a.bytesize == b.bytesize

        l = a.unpack "C#{a.bytesize}"

        res = 0
        b.each_byte { |byte| res |= byte ^ l.shift }
        res == 0
      end
    end
    module_function :fixed_length_secure_compare

    # 可変長の文字列のための安全な比較です。
    #
    # タイミング攻撃では、比較された内容は分からないものの、
    # secure_compare で比べられた秘密の長さは推測できてしまいます。
    # secure_compare を使うときは、この点を考慮してください。
    # 弱くて短い秘密をユーザー入力と比べる場合は特に注意が必要です。
    def secure_compare(a, b)
      a.bytesize == b.bytesize && fixed_length_secure_compare(a, b)
    end
    module_function :secure_compare
  end
end
```

```ruby:line-numbers=4 [原文]
module ActiveSupport
  module SecurityUtils
    if defined?(OpenSSL.fixed_length_secure_compare)
      # Constant time string comparison, for fixed length strings.
      #
      # The values compared should be of fixed length, such as strings
      # that have already been processed by HMAC. Raises in case of length mismatch.
      def fixed_length_secure_compare(a, b)
        OpenSSL.fixed_length_secure_compare(a, b)
      end
    else
      def fixed_length_secure_compare(a, b)
        raise ArgumentError, "string length mismatch." unless a.bytesize == b.bytesize

        l = a.unpack "C#{a.bytesize}"

        res = 0
        b.each_byte { |byte| res |= byte ^ l.shift }
        res == 0
      end
    end
    module_function :fixed_length_secure_compare

    # Secure string comparison for strings of variable length.
    #
    # While a timing attack would not be able to discern the content of
    # a secret compared via secure_compare, it is possible to determine
    # the secret length. This should be considered when using secure_compare
    # to compare weak, short secrets to user input.
    def secure_compare(a, b)
      a.bytesize == b.bytesize && fixed_length_secure_compare(a, b)
    end
    module_function :secure_compare
  end
end
```

:::

## 前提知識

- **タイミング攻撃**: ふつうの文字列比較は、先頭から 1 バイトずつ比べて、違いが見つかった瞬間に `false` を返します。すると「1 文字目が合っている入力」は少しだけ長く時間がかかります。この差を何度も測れば、1 文字ずつ正解を当てられてしまいます。
- **`defined?(OpenSSL.fixed_length_secure_compare)`**: そのメソッドが使えるかを調べます。新しい OpenSSL ライブラリには、C で書かれた定数時間比較が用意されています。
- **`unpack "C10"`**: 文字列を 10 個の符号なし 8 ビット整数（0〜255 のバイト値）の配列に変換します。
- **`^`（XOR）**: ビットごとに「違えば 1、同じなら 0」を計算します。同じバイトどうしなら結果は 0 です。
- **`|=`（OR 代入）**: `res = res | x` の省略形です。一度でも 1 になったビットは、ずっと 1 のままです。
- **`module_function`**: 指定したメソッドを、`SecurityUtils.secure_compare(a, b)` のようにモジュールから直接呼べるようにします。

## 何をしているか

### 1. 速い実装があればそれを使う

```ruby:line-numbers=6
    if defined?(OpenSSL.fixed_length_secure_compare)
      # Constant time string comparison, for fixed length strings.
      #
      # The values compared should be of fixed length, such as strings
      # that have already been processed by HMAC. Raises in case of length mismatch.
      def fixed_length_secure_compare(a, b)
        OpenSSL.fixed_length_secure_compare(a, b)
      end
```
OpenSSL に定数時間の比較があれば、それを呼ぶだけにします。

### 2. なければ Ruby で実装する

```ruby:line-numbers=15
      def fixed_length_secure_compare(a, b)
        raise ArgumentError, "string length mismatch." unless a.bytesize == b.bytesize

        l = a.unpack "C#{a.bytesize}"

        res = 0
        b.each_byte { |byte| res |= byte ^ l.shift }
        res == 0
      end
```
まず長さが違えばエラーにします。この関数は「長さが同じ文字列」専用です。
次に、`a` をバイトの配列 `l` にし、`b` のバイトと 1 つずつ XOR して、結果を `res` に OR で積み重ねます。

`a = "abc"`、`b = "abd"` で追ってみます。

| バイト | a | b | a ^ b | res |
| --- | --- | --- | --- | --- |
| 1 | 97 | 97 | 0 | 0 |
| 2 | 98 | 98 | 0 | 0 |
| 3 | 99 | 100 | 7 | 7 |

最後に `res == 0` なら等しい、そうでなければ違う、と判定します。ここでは 7 なので `false` です。

### 3. 長さの違う文字列にも使える版

```ruby:line-numbers=33
    def secure_compare(a, b)
      a.bytesize == b.bytesize && fixed_length_secure_compare(a, b)
    end
```
`secure_compare` は、まず長さを比べ、同じときだけ `fixed_length_secure_compare` を呼びます。`&&` は左が偽なら右を評価しません。

## ここがすごい

### 違いを見つけても止まらない

ふつうの比較と最大の違いは、**途中で `return false` しない** ことです。1 バイト目で違いが見つかっても、最後のバイトまで同じ回数の計算をします。どこで違ったかによって処理時間が変わらないので、時間を測っても何もわかりません。

### 分岐のない計算

ループの中には `if` がありません。「違いがあったか」を真偽値ではなく、ビットの OR という **数値の計算** で記録しています。分岐があると、CPU の動き方の違いから時間差が生まれることがあるため、計算だけで済ませるのが定石です。

### 長さの扱いは正直に書く

コード中のコメントにあるとおり、`secure_compare` は長さが違うとすぐに `false` を返すので、**秘密の長さ** は推測される可能性があります。そのため、実際の Rails では比較の前に両方を HMAC などで同じ長さのハッシュ値にしてから比べる、という使い方をします。できることとできないことをコメントで明記しています。

### 速い実装と遅い実装を、読み込み時に切り替える

`if defined?(...)` はメソッドの中ではなく、**メソッドの定義そのもの** を分岐させています。プログラムを読み込むときに 1 回だけ判定し、呼び出しのたびに確認するコストをかけません。

## まとめ

- 秘密の値を比べるときは、途中で止まらない「定数時間比較」を使います。
- XOR で違いを求め、OR で積み重ねると、分岐なしで「違いがあったか」がわかります。
- 長さが漏れる点など、安全性の限界はコメントで明記しておくことが大切です。
- 環境によって実装を選ぶときは、定義そのものを分岐させると呼び出しのたびのコストがかかりません。
