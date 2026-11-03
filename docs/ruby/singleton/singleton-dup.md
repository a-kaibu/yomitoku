---
title: "dup でも、シングルトンは増やせない"
description: "Singleton の dup は clone と同じく TypeError を投げる。凍結を引き継がない複製も、唯一のインスタンスを増やせないようにしている。"
language: ruby
project: "Ruby singleton (標準ライブラリ)"
repo: https://github.com/ruby/singleton
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "c24a4625d99283946e48b05a4c1397658b08599b"
file: lib/singleton.rb
lines: [105, 107]
function: "Singleton::SingletonInstanceMethods#dup"
difficulty: 1
format: 2
tags: ["設計パターン", "防御的プログラミング", "エラー処理"]
---
## ひとことで

`dup` は、オブジェクトの中身を別のオブジェクトにコピーするメソッドです。
`Singleton` を含むクラスでは、`dup` を呼んでも例外が投げられ、コピーは作られません。
`clone` を禁止するのと同じ理由で、`dup` も禁止されています。

## コード

```ruby:line-numbers=105
    def dup
      raise TypeError, "can't dup instance of singleton #{self.class}"
    end
```

## 前提知識

- **`dup`**: オブジェクトの複製を作るメソッドです。`clone` と違い、特異メソッドや凍結の状態は引き継がれません。
- **`clone` との違い**: `clone` は凍結の状態も引き継ぎます。`dup` は引き継ぎません。どちらも、中身が同じ新しいオブジェクトを作る点は同じです。
- **`TypeError`**: 値の型や対象が合わないときの例外です。
- **`raise`**: 例外を投げて、処理を止める文です。
- **上書き**: 標準のメソッドと同じ名前で定義し直して、動きを変えることです。

## 何をしているか

### 1. `dup` の呼び出しを、ここで止める

```ruby:line-numbers=106
      raise TypeError, "can't dup instance of singleton #{self.class}"
```

`dup` が呼ばれると、この行で例外が発生します。メッセージには「can't dup instance of singleton」と、クラス名が入ります。
ここで止まるので、新しいオブジェクトは作られません。

### 2. メッセージでクラスを示す

`#{self.class}` によって、どのシングルトンで間違えたかが分かります。
同じプログラムに複数のシングルトンがあっても、エラーの原因をすぐに特定できます。

### 3. `clone` と対になっている

`Singleton` では、`clone` と `dup` の両方を、同じ形で禁止しています。
どちらかだけが残っていると、もう一方の方法で、コピーが作られてしまうからです。

## ここがすごい

### 2 つの複製の方法を、同時にふさいでいる

Ruby には、複製の方法が `clone` と `dup` の 2 つあります。
片方だけを禁止しても、もう片方で同じ事故が起きます。この実装は、両方を同じ場所で扱い、抜け道を作らないようにしています。

### 中身を見ずに、確実に止める

`dup` は、中身を調べてから複製するかを決めることもできます。
しかし、シングルトンは中身が何であれ、増やしてはいけません。そのため、無条件に例外を投げる、単純な形になっています。

### 例外が、設計の意図を伝える

「複製できない」という事実を、例外という形で明確にしています。利用者は、例外を見て「これは 1 つだけのものだ」と理解できます。
ドキュメントを読まなくても、設計の意図がコードの動きから分かります。

## まとめ

- `dup` を呼ぶと、シングルトンのインスタンスは `TypeError` で止まります。
- `clone` と同じ理由で、複製の抜け道をふさいでいます。
- メッセージにクラス名が入るので、原因を素早く見つけられます。
- 中身によらず無条件に止めるので、ルールが単純で、分かりやすいです。
