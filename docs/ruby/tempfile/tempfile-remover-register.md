---
title: "使い忘れられたファイルを、オブジェクトの回収時に閉じる"
description: "Tempfile::Remover#register は、Tempfile のオブジェクトに終了処理（finalizer）を登録し、オブジェクトが回収されるときにファイルを閉じる。"
language: ruby
project: "Ruby tempfile (標準ライブラリ)"
repo: https://github.com/ruby/tempfile
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "a0fda392c3df985a72a5ff08898a26e905f38214"
file: lib/tempfile.rb
lines: [380, 384]
function: "Tempfile::Remover#register"
difficulty: 3
format: 2
tags: ["ファイル", "GC", "防御的プログラミング"]
---
## ひとことで

`Tempfile` は、一時的に使うファイルを作るクラスです。
使い終わったら `close` や `unlink` を呼ぶべきですが、呼び忘れることがあります。
`register` は、その保険として、オブジェクトが GC（ガベージコレクション、不要になったオブジェクトの回収）されるときに、開いたファイルを閉じる仕組みを登録します。

## コード

```ruby:line-numbers=380
    def register(obj, file)
      ObjectSpace.undefine_finalizer(obj)
      ObjectSpace.define_finalizer(obj, self)
      @open_files[obj.object_id] = file
    end
```

## 前提知識

- **GC（ガベージコレクション）**: 使われなくなったオブジェクトを、自動的に見つけて回収する仕組みです。Ruby では、いつ回収されるかは予測できません。
- **finalizer（終了処理）**: オブジェクトが回収される直前に、自動で呼ばれる処理です。`ObjectSpace.define_finalizer` で登録します。
- **`ObjectSpace.undefine_finalizer`**: 登録済みの終了処理を取り消します。同じオブジェクトに二重に登録しないための準備です。
- **`object_id`**: オブジェクトを一意に表す番号です。ハッシュのキーにできるので、ここでは、どのオブジェクトがどのファイルを開いているかの対応表として使われています。
- **`Remover` の役割**: 複数の `Tempfile` の開いたファイルをまとめて記録し、回収のときに閉じる、専用のオブジェクトです。

## 何をしているか

### 1. 既存の終了処理を取り消す

```ruby:line-numbers=381
      ObjectSpace.undefine_finalizer(obj)
```

同じオブジェクトに、すでに終了処理が登録されていれば、それを先に取り消します。
登録が二重になり、ファイルが二度閉じられることを防ぎます。

### 2. 終了処理として、`Remover` を登録する

```ruby:line-numbers=382
      ObjectSpace.define_finalizer(obj, self)
```

オブジェクトが回収されるとき、`self`（この `Remover`）の `call` メソッドが呼ばれるように登録します。
`call` は、オブジェクトの `object_id` を引数に受け取ります。

### 3. 対応表に、開いているファイルを記録する

```ruby:line-numbers=383
      @open_files[obj.object_id] = file
```

`@open_files` は、`object_id` から開いたファイルへの対応表です。
回収時には、`call` がこの表を引いて、対応するファイルを閉じます。

## ここがすごい

### 回収されるまで、ファイルを閉じない保険

Ruby では、オブジェクトがいつ回収されるか分かりません。その間、ファイルは開いたままになり、資源を使い続けます。
この仕組みは、「使い終わったら閉じる」を書き忘れても、GC で最後に閉じてくれる保険です。
もちろん、普段は明示的に `close` するのが正しい使い方です。

### オブジェクトを直接ではなく、番号で覚える

対応表のキーに、オブジェクトそのものではなく `object_id` を使っています。
終了処理が呼ばれる時点では、オブジェクトはもう参照できないことがあります。
番号だけを保持しておくことで、オブジェクトが回収されていても、対応表を引けます。

### 登録と取り消しを、対で書く

登録の前に、必ず `undefine_finalizer` を呼んでいます。
同じ処理を何度呼んでも、終了処理は 1 つだけになります。登録を安全に繰り返せる、冪等（何回しても結果が同じ）な書き方です。

## まとめ

- `Tempfile` は、呼び忘れたときの保険として、GC の終了処理にファイルを閉じる仕組みを登録します。
- 登録の前に既存の終了処理を取り消し、二重登録を防ぎます。
- オブジェクトの番号を対応表のキーにして、回収のあとでもファイルを特定できるようにしています。
- ただし、明示的に `close` や `unlink` を呼ぶのが基本です。
