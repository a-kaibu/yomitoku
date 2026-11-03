---
title: "ファイルの読み書きを、途中で中断しても壊れない 1 つの処理にする"
description: "PStore#transaction は、ブロックの中でだけ読み書きを許し、commit と abort を throw と catch で飛び出す仕組みで、保存するかどうかを決める。"
language: ruby
project: "Ruby pstore (標準ライブラリ)"
repo: https://github.com/ruby/pstore
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4491e7119cf03283f2f299b65a8139c25653c77a"
file: lib/pstore.rb
lines: [581, 591]
function: "PStore#transaction"
difficulty: 3
format: 2
tags: ["ファイル", "並行処理", "防御的プログラミング"]
---
## ひとことで

`PStore#transaction` は、ファイルに保存されたデータを、ひとまとまりの処理（トランザクション）の中でだけ読み書きさせるメソッドです。
ブロックの途中で `commit` や `abort` を呼ぶと、そこで処理が止まり、保存するか捨てるかが決まります。
途中でエラーが起きても、ファイルは中途半端な状態になりません。

## コード

```ruby:line-numbers=581
    begin
      @rdonly = read_only
      @abort = false
      file = open_and_lock_file(@filename, read_only)
      if file
        begin
          @table, checksum, original_data_size = load_data(file, read_only)

          catch(self) do
            value = yield(self)
          end
```

## 前提知識

- **トランザクション**: 複数の読み書きを、「全部成功した」か「全部なかったことにする」かのどちらかにまとめる考え方です。
- **ブロック（`do ... end`）と `yield`**: メソッドに渡された処理を、メソッドの中から呼び出す仕組みです。`yield(self)` は、`transaction` に渡されたブロックを、`self` を引数にして呼びます。
- **`catch` と `throw`**: 遠くの場所へ、一気に飛び出すための Ruby の仕組みです。`throw` で指定した値が、同じ名前の `catch` で受け止められます。
- **ファイルのロック**: 別のプロセスが同時に書き換えないように、ファイルに鍵をかけることです。
- **`ensure`**: 正常終了でも例外でも、必ず最後に実行される節です。

## 何をしているか

### 1. ファイルを開いて、ロックする

```ruby:line-numbers=584
      file = open_and_lock_file(@filename, read_only)
```

読み書きの前に、ファイルを開いて、ロックをかけます。読み取り専用のときは、共有ロックになります。
ロックが取れなければ、この後の処理に進めません。

### 2. データを読み込み、ブロックに渡す

```ruby:line-numbers=587
          @table, checksum, original_data_size = load_data(file, read_only)
```

`load_data` で、ファイルの中身を読み込み、`@table` に入れます。同時に、後で変更を確かめるための `checksum` と、サイズも記録します。

```ruby:line-numbers=589
          catch(self) do
            value = yield(self)
          end
```

`catch(self)` で、このブロックの「出口」を作ります。ブロックの中で `commit` か `abort` が呼ばれると、`throw self` によって、この `catch` まで一気に飛びます。
`yield(self)` の値は、`value` に入って、`transaction` の戻り値になります。

### 3. 保存するかどうかを決める

`commit` は `@abort = false` にして `throw` します。`abort` は `@abort = true` にして `throw` します。
ブロックを最後まで実行したときは、そのまま下の `save_data` が呼ばれます。`@abort` が真なら保存されず、途中の変更は捨てられます。

### 4. 必ず、ロックを外す

最後の `ensure` の中で、`@lock.unlock` が呼ばれます。例外が起きても、ロックが残ることはありません。

## ここがすごい

### 戻りを `throw` に任せる

ブロックの途中から抜ける方法を、`return` や `break` の代わりに `throw` にしています。
`commit` や `abort` は、ブロックのどこからでも呼べて、そのたびに同じ出口へ飛べます。
呼び出し側は、途中で何段ネストしていても、決まった書き方ができます。

### 保存を、ブロックの最後に 1 回だけ行う

変更は、メモリ上の `@table` に対して行われます。ファイルへの書き込みは、ブロックが正常に終わったときの 1 回だけです。
途中で失敗しても、ファイルの中身は古いままなので、データが半端に壊れることを防げます。

### 同じファイルへの、ネストした transaction を拒否する

`@lock.try_lock` が失敗すると、「nested transaction」の例外を投げます。
ブロックの中でもう一度 `transaction` を呼ぶと、同じロックを取ろうとして失敗します。
矛盾した書き込みが起きないように、入れ子を禁止しています。

## まとめ

- `transaction` は、ブロックの中の読み書きを、ひとまとまりの処理として扱います。
- `catch(self)` と `throw self` で、`commit` と `abort` の出口を作ります。
- 保存は、ブロックが正常に終わったときだけ、1 回行われます。
- `ensure` でロックを必ず外すので、例外が起きても鍵が残りません。
