---
title: "書き込みを一時ファイルに行い、最後に名前を付け替えて壊れないようにする"
description: "PStore の save_data_with_atomic_file_rename_strategy は、一時ファイルに全部書いてから File.rename で本体に置き換え、途中で止まっても元のデータを残す。"
language: ruby
project: "Ruby pstore (標準ライブラリ)"
repo: https://github.com/ruby/pstore
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4491e7119cf03283f2f299b65a8139c25653c77a"
file: lib/pstore.rb
lines: [715, 730]
function: "PStore#save_data_with_atomic_file_rename_strategy"
difficulty: 3
format: 2
tags: ["ファイル", "防御的プログラミング", "システムコール"]
---
## ひとことで

このメソッドは、データを保存するときに、直接元のファイルへ書かず、一時ファイルに全部書き終えてから、名前を付け替えます。
書いている途中で電源が落ちたり、プロセスが止まったりしても、元のファイルは壊れていません。
`PStore` の保存方式のひとつで、安全さを優先するときに使われます。

## コード

```ruby:line-numbers=715
  def save_data_with_atomic_file_rename_strategy(data, file)
    temp_filename = "#{@filename}.tmp.#{Process.pid}.#{rand 1000000}"
    temp_file = File.new(temp_filename, mode: WR_ACCESS | @nofollow, encoding: Encoding::ASCII_8BIT, perm: 0o000)
    begin
      temp_file.flock(File::LOCK_EX)
      temp_file.write(data)
      temp_file.flush
      temp_file.chmod(file.stat.mode)
      File.rename(temp_filename, @filename)
    rescue Exception
      File.unlink(temp_file) rescue nil
      raise
    ensure
      temp_file.close
    end
  end
```

## 前提知識

- **一時ファイル**: 本体とは別の名前で作る、作業用のファイルです。最後に本体の名前へ差し替えます。
- **`File.rename`**: ファイル名を変えるシステムコールです。同じディレクトリの中であれば、ほぼ一瞬で、ファイルの中身を丸ごと差し替えられます。
- **`flock`**: ファイルに排他ロックをかけるシステムコールです。同時に書き込む別のプロセスを止めます。
- **`perm: 0o000`**: 作成時のパーミッションを 0 にする指定です。書き込み途中のファイルを、ほかのユーザーに読ませないためです。
- **`rescue Exception`**: どんな例外でも捕まえて、後始末をしてから、もう一度投げ直す書き方です。

## 何をしているか

### 1. 一時ファイルの名前を、ほかと重ならないように作る

```ruby:line-numbers=716
    temp_filename = "#{@filename}.tmp.#{Process.pid}.#{rand 1000000}"
```

ファイル名に、プロセスの ID と乱数を入れています。同じ時期に、ほかのプロセスが同じ一時ファイル名を使う事故を避けるためです。

### 2. 一時ファイルを、権限 0 で作る

```ruby:line-numbers=717
    temp_file = File.new(temp_filename, mode: WR_ACCESS | @nofollow, encoding: Encoding::ASCII_8BIT, perm: 0o000)
```

`encoding: Encoding::ASCII_8BIT` で、バイト列をそのまま書けるようにしています。`@nofollow` は、シンボリックリンクをたどらせないための指定です。

### 3. ロックして、中身を全部書く

```ruby:line-numbers=719
      temp_file.flock(File::LOCK_EX)
      temp_file.write(data)
      temp_file.flush
```

排他ロックをかけてから書き込みます。`flush` で、メモリ上のバッファを実際にファイルへ渡します。
ここまでは、本体のファイルには一切触れていません。

### 4. 権限をそろえて、名前を付け替える

```ruby:line-numbers=722
      temp_file.chmod(file.stat.mode)
      File.rename(temp_filename, @filename)
```

元のファイルと同じ権限を、一時ファイルに与えます。そのあとで `File.rename` を呼び、一時ファイルを本体の名前にします。
この 1 行が、保存の「完了」の瞬間です。それまでは、元のファイルの中身がそのまま残っています。

### 5. 失敗したら、一時ファイルを消す

```ruby:line-numbers=724
    rescue Exception
      File.unlink(temp_file) rescue nil
      raise
```

途中で例外が起きたら、一時ファイルを削除して、同じ例外を投げ直します。
`rescue nil` は、削除にも失敗した場合に、元の例外を優先させるためです。

## ここがすごい

### 「書く」と「見せる」を分ける

データを書く場所と、読まれる場所を、別々のファイルにしています。
読む側からは、古い完全なデータか、新しい完全なデータかの、どちらか一方しか見えません。書きかけのデータが見えることはありません。

### 名前の付け替えを、切り替えの一点にする

本体の差し替えは `File.rename` の 1 回だけです。この 1 回の操作が成功した時点で、新しいデータが有効になります。
途中のどの段階で止まっても、元のデータは残っているので、壊れた状態にはなりません。

### 権限を、作成時に 0 にしている

一時ファイルは、最初は `perm: 0o000` で作られます。中身が書けるのは、このプロセスだけです。
本体と同じ権限は、中身を書き終えてから `chmod` で与えています。書きかけのファイルを、ほかのユーザーに読ませない工夫です。

## まとめ

- 保存では、本体に直接書かず、一時ファイルに全部書いてから名前を付け替えます。
- `File.rename` の 1 回で、新しいデータに切り替わります。その前で止まっても、元のデータは残ります。
- 一時ファイルは、作成時の権限を 0 にして、書きかけの中身を隠します。
- 失敗したときは一時ファイルを消して、元の例外を投げ直します。
