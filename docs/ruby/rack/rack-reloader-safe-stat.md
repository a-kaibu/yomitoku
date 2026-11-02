---
title: "消えたファイルでエラーにせず、通常のファイルかだけ確かめる"
description: "ファイルの情報を取るとき、存在しない場合の例外を受け止めて false にする。通常のファイルでなければ結果に含めない。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/reloader.rb
lines: [103, 109]
function: "Rack::Reloader::Stat#safe_stat"
difficulty: 2
format: 2
tags: [ファイル, エラー処理, 防御的プログラミング]
---

## ひとことで

`safe_stat` は、ファイルの情報（`File.stat`）を安全に取るメソッドです。
ファイルが存在しない、またはフォルダの途中がない、という状況では、例外を出さずに偽（`false`）を返します。
通常のファイル（フォルダではないもの）だけを「見つかった」とみなします。

## コード

```ruby:line-numbers=103
      def safe_stat(file)
        return unless file
        stat = ::File.stat(file)
        return file, stat if stat.file?
      rescue Errno::ENOENT, Errno::ENOTDIR, Errno::ESRCH
        @cache.delete(file) and false
      end
```

## 前提知識

- **`File.stat`**: ファイルの情報（大きさ、種類、更新日時など）を取得します。存在しないと例外が出ます。
- **`rescue 例外クラス`**: 指定した例外が起きたとき、その処理を行います。メソッドの本体の最後に書くと、本体全体を守れます。
- **`stat.file?`**: 通常のファイルかを調べます。フォルダなら偽です。
- **`@cache.delete(file)`**: キャッシュから、そのキーを取り除きます。

## 何をしているか

### 1. 空なら何もしない

```ruby:line-numbers=104
        return unless file
```

ファイル名が `nil` なら、調べずに終わります。

### 2. 情報を取り、通常のファイルなら返す

```ruby:line-numbers=105
        stat = ::File.stat(file)
        return file, stat if stat.file?
```

情報を取って、通常のファイルなら、ファイル名と情報を返します。

### 3. 例外なら、キャッシュを消して偽を返す

```ruby:line-numbers=107
      rescue Errno::ENOENT, Errno::ENOTDIR, Errno::ESRCH
        @cache.delete(file) and false
```

ファイルがない、途中のフォルダがない、などの例外を受け止めます。キャッシュに残った古い場所を消し、偽を返します。

## ここがすごい

### 例外を「ふつうの結果」に変える

ファイルが消えるのは、珍しいことではありません。その場合に例外で処理を止めず、偽という値で「見つからなかった」と伝えます。呼び出し側は、`if` で扱えます。

### キャッシュも一緒に直す

消えたファイルの場所を覚えたままだと、次回も同じ失敗を繰り返します。例外を受け止めたときに、キャッシュからも取り除いて、次は正しく探せるようにしています。

### 例外の種類を並べる

`ENOENT`（ない）、`ENOTDIR`（フォルダではない）、`ESRCH` のように、想定する失敗だけを書いています。何でも受け止めると、本当のバグまで隠してしまうからです。

## まとめ

- ファイルの有無のように、普通に起こりうる失敗は、例外ではなく値で扱うと呼び出しが楽になります。
- 失敗の原因になった記録（キャッシュ）は、一緒に消すと同じ失敗を繰り返しません。
- 受け止める例外は、想定するものだけに絞ると、バグを隠しにくくなります。
