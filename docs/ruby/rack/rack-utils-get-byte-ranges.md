---
title: "Range ヘッダを、ファイルの範囲の列に読み直す"
description: "Rack::Utils.get_byte_ranges は「bytes=0-99」などの Range ヘッダを読み、ファイルの有効な範囲だけの配列にする。末尾からの指定も扱う。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [495, 529]
function: "Rack::Utils.get_byte_ranges"
difficulty: 3
format: 2
tags: ["ネットワーク", "パース", "防御的プログラミング"]
---
## ひとことで

`Rack::Utils.get_byte_ranges` は、HTTP の `Range` ヘッダ（例: `bytes=0-99`）を読んで、**ファイルのどのバイト範囲を返せばよいか** を配列にするメソッドです。
`bytes=0-99,200-` なら、`0..99` と `200..(サイズ - 1)` の 2 つの範囲になります。
読めない指定や、範囲が逆になっているものは `nil` を返します。

## コード

::: code-group

```ruby:line-numbers=495 [日本語訳]
    def get_byte_ranges(http_range, size, max_ranges: 100)
      # HTTP/1.1 の Range の仕様（RFC 2616）を参照
      # ファイルが空なら Range を無視する（416 エラーを避けるため）
      return nil if size.zero?
      return nil unless http_range && http_range =~ /bytes=([^;]+)/
      byte_range = $1
      return nil if byte_range.count(',') >= max_ranges
      ranges = []
      byte_range.split(/,[ \t]*/).each do |range_spec|
        return nil unless range_spec.include?('-')
        range = range_spec.split('-')
        r0, r1 = range[0], range[1]
        if r0.nil? || r0.empty?
          return nil if r1.nil?
          # 末尾からの範囲の指定（例: bytes=-500）。ファイルの最後の部分を表す
          r0 = size - r1.to_i
          r0 = 0  if r0 < 0
          r1 = size - 1
        else
          r0 = r0.to_i
          if r1.nil?
            r1 = size - 1
          else
            r1 = r1.to_i
            return nil  if r1 < r0  # 後ろから前への範囲は、文法として不正
            r1 = size - 1  if r1 >= size
          end
        end
        ranges << (r0..r1)  if r0 <= r1
      end

      return [] if ranges.map(&:size).sum > size

      ranges
    end
```

```ruby:line-numbers=495 [原文]
    def get_byte_ranges(http_range, size, max_ranges: 100)
      # See <http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35>
      # Ignore Range when file size is 0 to avoid a 416 error.
      return nil if size.zero?
      return nil unless http_range && http_range =~ /bytes=([^;]+)/
      byte_range = $1
      return nil if byte_range.count(',') >= max_ranges
      ranges = []
      byte_range.split(/,[ \t]*/).each do |range_spec|
        return nil unless range_spec.include?('-')
        range = range_spec.split('-')
        r0, r1 = range[0], range[1]
        if r0.nil? || r0.empty?
          return nil if r1.nil?
          # suffix-byte-range-spec, represents trailing suffix of file
          r0 = size - r1.to_i
          r0 = 0  if r0 < 0
          r1 = size - 1
        else
          r0 = r0.to_i
          if r1.nil?
            r1 = size - 1
          else
            r1 = r1.to_i
            return nil  if r1 < r0  # backwards range is syntactically invalid
            r1 = size - 1  if r1 >= size
          end
        end
        ranges << (r0..r1)  if r0 <= r1
      end

      return [] if ranges.map(&:size).sum > size

      ranges
    end
```

:::

## 前提知識

- **Range ヘッダ**: 動画や大きなファイルを、一部だけ欲しいときにクライアントが送るヘッダです。`bytes=開始-終了` の形で書きます。
- **416 エラー**: 要求された範囲がファイルの外にあるときの HTTP のエラーです。
- **`=~` と `$1`**: 正規表現に一致したとき、`$1` が最初の `( )` の中身になります。
- **`split` と `include?`**: 区切りで分けたり、文字列に含まれるかを調べたりします。
- **範囲（`r0..r1`）**: 開始から終了までの整数の並びです。`0..99` は 100 バイトを表します。
- **`nil` を返す**: 呼び出し側に「この指定は読めない」と伝える戻り値です。

## 何をしているか

### 1. 空のファイルと、形式が違うものを先に弾く

::: code-group

```ruby:line-numbers=497 [日本語訳]
      # ファイルが空なら Range を無視する（416 エラーを避けるため）
      return nil if size.zero?
      return nil unless http_range && http_range =~ /bytes=([^;]+)/
```

```ruby:line-numbers=497 [原文]
      # Ignore Range when file size is 0 to avoid a 416 error.
      return nil if size.zero?
      return nil unless http_range && http_range =~ /bytes=([^;]+)/
```

:::

サイズ 0 のファイルは、Range を無視します。`bytes=` の形でないヘッダも `nil` にします。

### 2. 範囲の数に上限をかける

```ruby:line-numbers=501
      return nil if byte_range.count(',') >= max_ranges
      ranges = []
      byte_range.split(/,[ \t]*/).each do |range_spec|
        return nil unless range_spec.include?('-')
```

範囲がカンマで多すぎるものや、`-` のない不正なものは、拒否します。`max_ranges` は、大量の範囲を要求させない安全装置です。

### 3. 末尾指定と通常の指定を分けて計算する

::: code-group

```ruby:line-numbers=507 [日本語訳]
        if r0.nil? || r0.empty?
          return nil if r1.nil?
          # 末尾からの範囲の指定（例: bytes=-500）。ファイルの最後の部分を表す
          r0 = size - r1.to_i
          r0 = 0  if r0 < 0
          r1 = size - 1
```

```ruby:line-numbers=507 [原文]
        if r0.nil? || r0.empty?
          return nil if r1.nil?
          # suffix-byte-range-spec, represents trailing suffix of file
          r0 = size - r1.to_i
          r0 = 0  if r0 < 0
          r1 = size - 1
```

:::

`bytes=-500` のように開始が空なら、「末尾から 500 バイト」です。`r0 = size - r1.to_i` で開始位置を計算します。

::: code-group

```ruby:line-numbers=513 [日本語訳]
        else
          r0 = r0.to_i
          if r1.nil?
            r1 = size - 1
          else
            r1 = r1.to_i
            return nil  if r1 < r0  # 後ろから前への範囲は、文法として不正
            r1 = size - 1  if r1 >= size
          end
        end
```

```ruby:line-numbers=513 [原文]
        else
          r0 = r0.to_i
          if r1.nil?
            r1 = size - 1
          else
            r1 = r1.to_i
            return nil  if r1 < r0  # backwards range is syntactically invalid
            r1 = size - 1  if r1 >= size
          end
        end
```

:::

通常の指定では、終了が省略されたら最後まで、ファイルサイズを超えたら最後の位置に切り詰めます。後ろから前への範囲は `nil` です。

### 4. 合計が大きすぎれば、空の配列を返す

```ruby:line-numbers=523
        ranges << (r0..r1)  if r0 <= r1
      end

      return [] if ranges.map(&:size).sum > size

      ranges
```

有効な範囲だけを `ranges` に入れ、その合計がファイルサイズを超えるなら、重なりなどの不正とみなして `[]` を返します。

## ここがすごい

### 読めない指定は、すべて `nil` にまとめる

文法の違い、数の不正、範囲の逆転など、多くの場合分けがありますが、どれも `nil` で一括して扱えます。
呼び出し側は、「範囲指定を無視して全体を返す」だけの判断で済みます。

### 末尾指定を、ファイルサイズから計算する

`bytes=-500` は、ファイルの大きさを知らないと正しい位置が分かりません。
このメソッドは、ファイルサイズを引数として受け取ることで、末尾の範囲も正確に計算できます。

### 合計で、過剰な要求を防ぐ

範囲を重ねて大量に要求すると、サーバーの負担が増えます。
合計がファイルサイズを超えたら拒否する規則で、この問題を単純な比較 1 回で防いでいます。

## まとめ

- HTTP の範囲指定は、文法の検査、数の上限、範囲の補正の順に処理すると、安全に読めます。
- 読めない場合の戻り値を `nil` に統一すると、呼び出し側の判断が単純になります。
- 末尾からの指定は、ファイルの大きさを使って開始位置を計算します。
