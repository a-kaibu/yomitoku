---
title: "「=」が抜けた Base64 も読み戻す"
description: "Base64.urlsafe_decode64 は、末尾の「=」が無い入力を 4 文字単位に揃えてから、URL 用の文字を元に戻して読み取る。"
language: ruby
project: "Ruby base64 (標準ライブラリ)"
repo: https://github.com/ruby/base64
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4d3c0be334d15e30250b98c0e5d258a5186b0130"
file: lib/base64.rb
lines: [370, 381]
function: "Base64.urlsafe_decode64"
difficulty: 2
format: 2
tags: ["文字列処理", "ネットワーク", "防御的プログラミング"]
---
## ひとことで

`Base64.urlsafe_decode64` は、URL 用の Base64 の文字列を **元のバイト列に戻す** メソッドです。
末尾の `=` が無い入力（パディングを外したもの）も、4 文字の倍数になるように補ってから読み取ります。
途中に不正な文字や、間違った長さのパディングがあると、`ArgumentError` を出します。

## コード

::: code-group

```ruby:line-numbers=370 [日本語訳]
  def urlsafe_decode64(str)
    # 注: RFC 4648 は「=」の無い入力について何も述べていないが、
    # 「余分なパディング文字は無視してもよい」とあるので、
    # 「=」の無い入力も受け付けてよいと推測できる。
    if !str.end_with?("=") && str.length % 4 != 0
      str = str.ljust((str.length + 3) & ~3, "=")
      str.tr!("-_", "+/")
    else
      str = str.tr("-_", "+/")
    end
    strict_decode64(str)
  end
```

```ruby:line-numbers=370 [原文]
  def urlsafe_decode64(str)
    # NOTE: RFC 4648 does say nothing about unpadded input, but says that
    # "the excess pad characters MAY also be ignored", so it is inferred that
    # unpadded input is also acceptable.
    if !str.end_with?("=") && str.length % 4 != 0
      str = str.ljust((str.length + 3) & ~3, "=")
      str.tr!("-_", "+/")
    else
      str = str.tr("-_", "+/")
    end
    strict_decode64(str)
  end
```

:::

## 前提知識

- **Base64 の 4 文字単位**: Base64 は、4 文字で 3 バイトを表します。文字数が 4 の倍数になっていると、きれいに区切れます。
- **パディングの省略**: `=` を外した Base64 は、4 の倍数に足りない分の `=` を補えば、元どおり読めます。
- **`end_with?`**: 文字列が指定した文字列で終わるかを調べます。
- **ビット演算 `&`、`~`**: `(n + 3) & ~3` は、`n` を 4 の倍数に切り上げる計算です。`~3` は、下 2 ビットを 0 にする値を作ります。
- **`ljust(長さ, 文字)`**: 文字列の右側を、指定した文字で埋めて、指定した長さにします。
- **`strict_decode64`**: 通常の Base64 を、文字の検査を厳しくして元に戻すメソッドです。

## 何をしているか

### 1. パディングがなく、長さが 4 の倍数でないときは補う

```ruby:line-numbers=374
    if !str.end_with?("=") && str.length % 4 != 0
      str = str.ljust((str.length + 3) & ~3, "=")
      str.tr!("-_", "+/")
```

`=` で終わらず、長さが 4 の倍数でもない入力は、末尾が省略された形です。`(str.length + 3) & ~3` で、次の 4 の倍数の長さを求め、`ljust` で `=` を補います。
例えば長さが 9 なら、`(9 + 3) & ~3` は 12 なので、`=` を 3 つ足します。

### 2. URL 用の文字を、通常の Base64 の文字に戻す

```ruby:line-numbers=376
      str.tr!("-_", "+/")
    else
      str = str.tr("-_", "+/")
```

補った後の文字列では、`-` を `+` に、`_` を `/` に戻します。`=` で終わる入力なら、補わずに `tr` だけを行います。

### 3. 厳密な復号に任せる

```ruby:line-numbers=380
    strict_decode64(str)
```

最後に、通常の Base64 として `strict_decode64` で元の値を読みます。不正な文字や、間違った長さは、ここで `ArgumentError` になります。

## ここがすごい

### 不足分の計算をビット演算で行う

`(str.length + 3) & ~3` は、割り算や余りを使うより、一度の計算で 4 の倍数に切り上げられます。
ビットの性質を知らないと読みにくいですが、短く速い書き方です。

### 「仕様で許されている省略」だけを受け入れる

コードの注釈は、RFC 4648 が余分なパディングを「無視してもよい」と書いていることを根拠にしています。
パディングの省略は許し、途中の余計な `=` は `strict_decode64` で弾く、という線引きです。

### 変換と検査を分ける

このメソッドは、URL の文字を戻して長さを整えるだけです。中身が正しい Base64 かの検査は、`strict_decode64` に任せています。
役割が分かれているので、どこで不正になったのかが追いやすくなります。

## まとめ

- Base64 の長さは 4 の倍数を基準にすると、足りない分を正確に補えます。
- ビット演算で切り上げを書くと、短く速い計算になります。
- 受け入れる入力の範囲は、仕様に沿って決め、それ以外は検査を担当する部品に任せると安全です。
