---
title: "シングルトンのインスタンスを、複製できないようにする"
description: "Singleton の clone は、インスタンスを複製しようとすると TypeError を投げる。1 つしかないものが、コピーで増えるのを防ぐ。"
language: ruby
project: "Ruby singleton (標準ライブラリ)"
repo: https://github.com/ruby/singleton
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "c24a4625d99283946e48b05a4c1397658b08599b"
file: lib/singleton.rb
lines: [100, 102]
function: "Singleton::SingletonInstanceMethods#clone"
difficulty: 1
format: 2
tags: ["設計パターン", "防御的プログラミング", "エラー処理"]
---
## ひとことで

`Singleton` を含むクラスのインスタンスは、`clone` で複製できません。
複製しようとすると、`TypeError` という例外で止まります。
シングルトンは「世界に 1 つだけ」という前提なので、コピーで増えてしまうと、その前提が壊れるからです。

## コード

```ruby:line-numbers=100
    def clone
      raise TypeError, "can't clone instance of singleton #{self.class}"
    end
```

## 前提知識

- **`clone`**: オブジェクトを複製するメソッドです。ふつうは、中身が同じ別のオブジェクトを作ります。
- **`dup`**: `clone` と似ていますが、凍結（変更できない状態）を引き継がない複製です。この実装では、`dup` も同じように禁止されています。
- **`TypeError`**: 値の型が合わないときに使う例外です。ここでは「このオブジェクトは、この操作の対象にできない」という意味で使われています。
- **`#{self.class}`**: 文字列の中に、クラス名などの値を埋め込む書き方です。
- **メソッドの上書き**: 同じ名前のメソッドを、別の場所で定義し直すことです。ここでは、標準の `clone` を置き換えています。

## 何をしているか

### 1. `clone` を呼ばれたら、例外を投げる

```ruby:line-numbers=101
      raise TypeError, "can't clone instance of singleton #{self.class}"
```

`clone` が呼ばれると、この行で例外が発生します。メッセージには、どのクラスのインスタンスかが入ります。
例えば `Config` というシングルトンなら、「can't clone instance of singleton Config」と表示されます。

### 2. 呼び出し側には、複製は返らない

例外が投げられると、`clone` は値を返しません。呼び出し側は、コピーが作られたかどうかで迷うことがありません。
「複製できない」という事実が、例外として明確に伝わります。

### 3. ふつうのオブジェクトとの違い

Ruby の標準の `Object#clone` は、中身をコピーした新しいオブジェクトを返します。
`Singleton` は、`SingletonInstanceMethods` という名前のモジュールで、この `clone` を上書きしています。
そのモジュールを `include` したクラスのインスタンスだけが、この制限を受けます。

## ここがすごい

### 「1 つだけ」という前提を、コードで守る

シングルトンは、「同じものが 1 つだけある」ことに意味があります。
うっかり `clone` を呼んで、2 つ目の設定オブジェクトができると、片方を変えても、もう片方には反映されません。
それは、設計が崩れて、とても見つけにくいバグになります。例外で止めることで、その事故を防いでいます。

### クラス側の `clone` は、別に扱っている

`Singleton` は、インスタンス側の `clone` を禁止する一方、クラス自身の `clone` は `Singleton.__init__` で正しく扱います。
クラスを複製したとき、その複製も新しいシングルトンとして設定されます。
インスタンスとクラスで、役割を分けて書いている点が、この実装の工夫です。

### 例外のメッセージに、クラス名を入れる

どのクラスで間違えたかが、メッセージから分かります。デバッグのときに、どこを直せばよいかをすぐ判断できます。

## まとめ

- シングルトンのインスタンスを `clone` すると、`TypeError` が投げられます。
- 「1 つだけ」という前提を、複製を禁止することで守っています。
- `dup` も同じように禁止されています。
- クラス自身の複製は、別の仕組みで正しく扱われています。
