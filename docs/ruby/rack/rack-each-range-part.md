---
title: "残りの長さを数えながら、少しずつファイルを読んで渡す"
description: "HTTP の Range リクエストで、ファイルの一部だけを送るための処理。8KB ずつ読み、残りの長さが 0 になるか、ファイルの終わりで止まる。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/files.rb
lines: [189, 199]
function: "Rack::Files#each_range_part"
difficulty: 2
format: 2
tags: [ファイル, 入出力, ネットワーク]
---

## ひとことで

`each_range_part` は、ファイルの **指定された範囲（開始位置から終了位置まで）だけ** を、少しずつ読み出して渡すメソッドです。
動画や大きなファイルを途中から再開して送るとき（HTTP の `Range` ヘッダへの応答）に使われます。
ファイル全部を一度にメモリに読み込まず、8 キロバイトずつ処理します。

## コード

```ruby:line-numbers=189
      def each_range_part(file, range)
        file.seek(range.begin)
        remaining_len = range.end - range.begin + 1
        while remaining_len > 0
          part = file.read([8192, remaining_len].min)
          break unless part
          remaining_len -= part.length

          yield part
        end
      end
```

## 前提知識

- **HTTP の Range**: クライアントが「この範囲だけ送ってほしい」と頼む仕組みです。途中からの再開や、動画の一部の読み込みに使います。
- **`file.seek(位置)`**: ファイルの読む位置を指定した場所に動かします。
- **`file.read(長さ)`**: 指定した長さ分のバイトを読みます。ファイルの終わりに来ると `nil` を返します。
- **`yield part`**: メソッドを呼んだ側に、読んだ部分を渡します。呼び出し側は、受け取るたびに送信などの処理ができます。
- **`[8192, remaining_len].min`**: 2 つの値の小さい方を取ります。残りが 8192 より少ないときは、残りの分だけ読みます。
- **`break unless part`**: 読めなかった（`nil` になった）ら、ループを抜けます。

## 何をしているか

### 1. 開始位置へ移動し、残りの長さを求める

```ruby:line-numbers=190
        file.seek(range.begin)
        remaining_len = range.end - range.begin + 1
```

`range` が `0..99` なら、100 バイトを送る必要があります。`range.end - range.begin + 1` で、その長さを求めます。

### 2. 残りがなくなるまで、8 キロバイト以内ずつ読む

```ruby:line-numbers=192
        while remaining_len > 0
          part = file.read([8192, remaining_len].min)
          break unless part
          remaining_len -= part.length

          yield part
        end
```

残りが 100 バイトなら、`[8192, 100].min` で 100 バイトだけ読みます。読めた長さを残りから引き、`yield` で渡します。

## ここがすごい

### 読む量の上限を決めている

`[8192, remaining_len].min` のおかげで、どんなに大きな範囲でも一度に読むのは 8 キロバイトまでです。また、範囲より多くを読んで送ってしまうこともありません。

### 途中で終わっても止まる

`break unless part` で、ファイルが途中で終わっていても無限に回らずに抜けます。残りの長さが 0 になるのを待つだけに頼ると、壊れたファイルでループが止まらなくなるので、この 2 つの終わり方を両方書いています。

### 送る側が受け取る形

中身を配列に集めずに、`yield` で一つずつ渡します。大きなファイルでも、メモリにはいつも 1 回分の内容しか置かれません。

## まとめ

- 大きなデータは、一定の大きさずつ読んで処理すると、メモリを使いすぎません。
- 「残りの量」を数えて、0 になったら止めると、必要な分だけを正確に扱えます。
- 読み出しが終わったかどうか（`nil`）も同時に確かめると、壊れた入力でも止まります。
