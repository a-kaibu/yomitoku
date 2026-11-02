---
title: "古いステータス名を受け付けて警告する status_code"
description: ":ok や 200 のように、HTTP のステータスを記号でも数字でも受け取り、数字に直す。廃止された記号には警告を出しつつ、代わりの番号を返す。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [673, 687]
function: "Rack::Utils.status_code"
difficulty: 2
format: 2
tags: [API設計, 防御的プログラミング, エラー処理]
---

## ひとことで

`status_code` は、HTTP のステータスを **記号（`:ok`）でも数字（`200`）でも** 受け取り、数字に直すメソッドです。
`status_code(:ok)` は `200`、`status_code("404")` は `404` になります。
廃止される予定の古い記号が渡されたときは、動きを止めずに **警告を出して、代わりの番号を返します**。

## コード

```ruby:line-numbers=673
    def status_code(status)
      if status.is_a?(Symbol)
        SYMBOL_TO_STATUS_CODE.fetch(status) do
          fallback_code = OBSOLETE_SYMBOLS_TO_STATUS_CODES.fetch(status) { raise ArgumentError, "Unrecognized status code #{status.inspect}" }
          message = "Status code #{status.inspect} is deprecated and will be removed in a future version of Rack."
          if canonical_symbol = OBSOLETE_SYMBOL_MAPPINGS[status]
            message = "#{message} Please use #{canonical_symbol.inspect} instead."
          end
          warn message, uplevel: 3
          fallback_code
        end
      else
        status.to_i
      end
    end
```

## 前提知識

- **`Symbol`（シンボル）**: `:ok` のような、名前を表す軽い値です。
- **`fetch(キー) { ... }`**: キーがあればその値を返し、なければブロックの結果を返します。ブロックで例外を出せば、キーがないことを知らせられます。
- **`raise ArgumentError, "..."`**: 不正な引数を知らせるための例外です。
- **`warn 文字列, uplevel: 3`**: 警告を出します。`uplevel` は「警告の場所を、何段上の呼び出し元にするか」を指定します。
- **`is_a?(Symbol)`**: 値が記号かどうかを調べます。
- **`to_i`**: 文字列や数値を整数にします。

## 何をしているか

### 1. 記号なら、表から番号を探す

```ruby:line-numbers=674
      if status.is_a?(Symbol)
        SYMBOL_TO_STATUS_CODE.fetch(status) do
```

通常の記号（`:ok` など）は、`SYMBOL_TO_STATUS_CODE` という対応表で数字に変えます。

### 2. 見つからなければ、廃止された記号を調べる

```ruby:line-numbers=676
          fallback_code = OBSOLETE_SYMBOLS_TO_STATUS_CODES.fetch(status) { raise ArgumentError, "Unrecognized status code #{status.inspect}" }
```

対応表にもない記号なら、`ArgumentError` を出します。廃止された記号なら、代わりの番号（`fallback_code`）を得ます。

### 3. 警告を出して、番号を返す

```ruby:line-numbers=677
          message = "Status code #{status.inspect} is deprecated and will be removed in a future version of Rack."
          if canonical_symbol = OBSOLETE_SYMBOL_MAPPINGS[status]
            message = "#{message} Please use #{canonical_symbol.inspect} instead."
          end
          warn message, uplevel: 3
          fallback_code
```

警告の文を作ります。新しい記号が分かっていれば、それも案内に加えます。`uplevel: 3` によって、警告はこの関数の中ではなく、利用者のコードの場所に出ます。

### 4. 記号でなければ数字に直す

```ruby:line-numbers=685
        status.to_i
```

`200` や `"404"` は `to_i` で整数になります。

## ここがすごい

### 壊さずに、そっと知らせる

古い記号を使うコードは、すぐに止めるべきではありません。このメソッドは警告を出しつつ、動くように番号を返します。利用者は警告を見て直せばよく、アプリは止まりません。

### 警告の場所を利用者に向ける

`uplevel: 3` を付けると、警告の場所が呼び出し元に変わります。ライブラリの内部の行ではなく、利用者が直すべき行が表示されるので、対応しやすくなります。

### 対応表の失敗を「取りこぼさない」

`fetch` のブロックで例外を出しているので、知らない記号を黙って通すことがありません。`nil` が返って後でおかしな値になる、という事故を防いでいます。

## まとめ

- 記号と数字の両方を受け付けるときは、まず型で分けると分かりやすくなります。
- 廃止する予定の機能は、警告を出しつつ動き続けさせると、移行がしやすくなります。
- `fetch` にブロックを渡すと、見つからなかったときの処理を書けます。
