---
title: "委譲先が応答できるかを、そのまま答える"
description: "Delegator#respond_to_missing? は、包んでいる本当のオブジェクトが応えられるメソッドかを調べ、それに従って答える。非公開メソッドには注意を出す。"
language: ruby
project: "Ruby delegate (標準ライブラリ)"
repo: https://github.com/ruby/delegate
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "fb03e83ac2941188eb7748cfaba20bdc2fd8f122"
file: lib/delegate.rb
lines: [100, 109]
function: "Delegator#respond_to_missing?"
difficulty: 3
format: 2
tags: ["メタプログラミング", "API設計", "防御的プログラミング"]
---
## ひとことで

`Delegator#respond_to_missing?` は、**包んでいる本当のオブジェクトが、そのメソッドに応えられるか** を答えるメソッドです。
`SimpleDelegator` などで別のオブジェクトを包むと、呼び出されたメソッドは中のオブジェクトに渡されます。
この関数は、`respond_to?` の問い合わせにも、中のオブジェクトと同じ答えを返すために使われます。

## コード

```ruby:line-numbers=100
  def respond_to_missing?(m, include_private)
    r = true
    target = self.__getobj__ {r = false}
    r &&= target_respond_to?(target, m, include_private)
    if r && include_private && !target_respond_to?(target, m, false)
      warn "delegator does not forward private method \##{m}", uplevel: 3
      return false
    end
    r
  end
```

## 前提知識

- **委譲（delegation）**: あるオブジェクトが、自分の仕事を別のオブジェクトに任せることです。`Delegator` は、中のオブジェクトへ呼び出しを転送します。
- **`respond_to?`**: オブジェクトに、そのメソッドがあるかを聞くメソッドです。
- **`respond_to_missing?`**: 通常のメソッドが定義されていないときに、`respond_to?` の答えを上書きするためのフックです。
- **`__getobj__`**: 中に包んでいるオブジェクトを返すメソッドです。
- **`private`（非公開）メソッド**: 外のコードからは呼べないメソッドです。`include_private` が真なら、非公開のものも問い合わせの対象になります。
- **`warn ... uplevel: 3`**: 警告を、問題のある呼び出し元の場所として表示します。

## 何をしているか

### 1. 中のオブジェクトがないなら、答えは「ない」

```ruby:line-numbers=101
    r = true
    target = self.__getobj__ {r = false}
```

`__getobj__` にブロックを渡すと、中のオブジェクトが無いときに、そのブロックが実行されます。その場合 `r` は `false` になります。

### 2. 中のオブジェクトに、同じ問い合わせをする

```ruby:line-numbers=103
    r &&= target_respond_to?(target, m, include_private)
```

`r` が真のままなら、`target_respond_to?` で中のオブジェクトに同じ問い合わせをします。`&&=` で、すでに偽の結果は変えません。

### 3. 非公開のメソッドは、外に出さない

```ruby:line-numbers=104
    if r && include_private && !target_respond_to?(target, m, false)
      warn "delegator does not forward private method \##{m}", uplevel: 3
      return false
    end
```

問い合わせが非公開のメソッドを含む場合、中のオブジェクトが公開として持っていないなら、警告を出して `false` を返します。委譲は公開メソッドだけを転送する、という規則を守るためです。

### 4. 最後の答えを返す

```ruby:line-numbers=108
    r
```

残った `r` が、答えになります。

## ここがすごい

### 答えを 1 つの変数で積み上げる

「中のオブジェクトがあるか」「メソッドがあるか」「非公開ではないか」を、同じ `r` に `&&` で重ねています。
どの段階で偽になっても、そこで答えが決まるので、後の条件は評価されずに済みます。

### 委譲の見た目を本物と同じにする

`respond_to?` の答えが、実際に呼び出したときの結果と一致していることが大切です。
中のオブジェクトに無いメソッドを「ある」と答えると、利用者は呼び出して失敗します。
このメソッドは、委譲先の答えをそのまま映すことで、見た目と実際の動きをそろえています。

### 警告で、規則違反を知らせる

非公開のメソッドを、公開の委譲と誤って扱うことは、よくある間違いです。
`warn` で、どこでその問い合わせが行われたかを表示すると、利用者は原因を追いやすくなります。

## まとめ

- 委譲オブジェクトの問い合わせは、委譲先の答えをそのまま映すと、見た目と実際の動きが一致します。
- 条件を `&&` でつなぐと、途中で偽になったら残りを調べずに済みます。
- 規則に合わないときは、警告で原因の場所を示すと、利用者が気づきやすくなります。
