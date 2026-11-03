---
title: "キーの値が変わった集合を、作り直さずに直す"
description: "Set#reset は、要素の内部の値が変わって Hash のキーが古くなったとき、ハッシュの表を作り直して正しい位置へ戻す。自分自身を返す。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [705, 712]
function: "Set#reset"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ", "防御的プログラミング"]
---
## ひとことで

`Set#reset` は、集合の中の要素を、あとから書き換えてしまったときに使います。
集合は、要素をハッシュの表で管理しています。その要素の値が変わると、表の中の位置が合わなくなります。
`reset` は、表を作り直して、位置を正しい状態に戻します。

## コード

::: code-group

```ruby:line-numbers=705 [日本語訳]
  def reset
    if @hash.respond_to?(:rehash)
      @hash.rehash # ここで、凍結されていないかを確かめる
    else
      raise FrozenError, "can't modify frozen #{self.class.name}" if frozen?
    end
    self
  end
```

```ruby:line-numbers=705 [原文]
  def reset
    if @hash.respond_to?(:rehash)
      @hash.rehash # This should perform frozenness check.
    else
      raise FrozenError, "can't modify frozen #{self.class.name}" if frozen?
    end
    self
  end
```

:::

## 前提知識

- **ハッシュ（Hash）**: キーから値を素早く探すための表です。Ruby の `Set` は、内部で `Hash` を使って要素を保存しています。
- **ハッシュ値**: キーごとに計算される番号です。その番号を使って、表の中の場所を決めます。
- **`rehash`**: ハッシュの表を、すべてのキーのハッシュ値で作り直すメソッドです。キーの値が変わったあとに呼びます。
- **凍結（frozen）**: オブジェクトを、変更できない状態にすることです。`frozen?` で、その状態かを調べられます。
- **`respond_to?`**: オブジェクトが、あるメソッドを持っているかを調べるメソッドです。

## 何をしているか

### 1. 表が、作り直しに対応しているかを調べる

```ruby:line-numbers=706
    if @hash.respond_to?(:rehash)
```

内部の `@hash` が `rehash` を持っていれば、表を作り直せます。持っていなければ、別の処理になります。

### 2. 表を作り直す

`@hash.rehash` の行で、表を作り直します（行末のコメントは、凍結の確認を指しています）。

`rehash` は、すべての要素を、いまの値でハッシュ値を計算し直します。
要素が変わったことで位置がずれていた場合も、正しい位置に並び直されます。

### 3. 作り直せない場合は、例外にする

```ruby:line-numbers=709
      raise FrozenError, "can't modify frozen #{self.class.name}" if frozen?
```

集合そのものが凍結されていると、表を書き換えられません。その場合は、`FrozenError` で知らせます。
このとき、メッセージにはクラス名が入ります。

### 4. 自分自身を返す

```ruby:line-numbers=711
    self
```

作り直したあとは、自分自身を返します。そのため、`set.reset.include?(x)` のように、続けて呼べます。

## ここがすごい

### 作り直しを、利用者が明示的に呼ぶ

要素の値が変わったことを、集合が自動で気づくことはできません。`reset` は、「変えたので直してほしい」という合図を、利用者から受け取る仕組みです。
自動の監視による余計な負担を、かけない設計になっています。

### 凍結のときの扱いを、きちんと分けている

内部の表が作り直せない場合でも、ふつうは黙って失敗させません。凍結されているという理由を、例外のメッセージに明記しています。
何が原因で失敗したかが、利用者にすぐ分かります。

### 「直して、自分を返す」という形

`reset` は、表を直す作業と、自分を返す作業を、1 つのメソッドで完結させています。
戻り値を使えば、一連の処理を、途切れずにつなげられます。

## まとめ

- `reset` は、要素の値が変わったあとに、ハッシュの表を作り直します。
- 表の位置がずれると、`include?` などが正しく動かなくなります。そのずれを直すための操作です。
- 凍結された集合では、`FrozenError` で失敗を知らせます。
- 作り直したあとは、自分自身を返すので、続けて呼べます。
