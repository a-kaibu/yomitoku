---
title: "省略記号の長さまで考えて文字列を切り詰める truncate"
description: "指定の長さに収まるよう文字列を切り、末尾に「...」を付ける。区切り文字の手前で切るオプションと、HTML の安全性への配慮がある。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/string/filters.rb
lines: [95, 113]
function: "String#truncate"
difficulty: 2
tags: [文字列処理, セキュリティ, API設計]
---

## ひとことで

`truncate(n)` は、文字列が n 文字より長いとき、**末尾の「...」も含めて n 文字に収まるように切り詰める** メソッドです。
`"Once upon a time in a world far far away".truncate(27)` は `"Once upon a time in a wo..."` になります。
`separator: " "` を付けると、単語の途中では切らずに `"Once upon a time in a..."` のようにできます。

## コード

```ruby:line-numbers=95
  def truncate(truncate_to, options = {})
    return dup unless length > truncate_to

    omission = options[:omission] || "..."
    length_with_room_for_omission = truncate_to - omission.length
    return omission.dup if length_with_room_for_omission <= 0

    stop = \
      if options[:separator]
        rindex(options[:separator], length_with_room_for_omission) || length_with_room_for_omission
      else
        length_with_room_for_omission
      end

    # Slice to_str, not self, so a SafeBuffer gives a plain String: the cut
    # can split an HTML tag, so the result must not be html_safe. The slice is
    # a fresh, mutable string, so append the omission to it.
    to_str[0, stop] << omission
  end
```

## 前提知識

- **`options = {}`**: オプションをハッシュで受け取る書き方です。`options[:omission]` のように取り出します。
- **`return dup unless 条件`**: 条件が偽なら、その場でコピーを返して終わります。
- **`a || "..."`**: `a` が `nil` なら `"..."` を使う、という既定値の書き方です。
- **`rindex(文字列, 位置)`**: 指定した位置より **前** で、その文字列が最後に現れる位置を返します。見つからなければ `nil` です。
- **`stop = \` と改行**: 行末の `\` は「次の行に続く」という意味です。`if` 式の結果を `stop` に代入しています。Ruby の `if` は値を返す式です。
- **`str[0, n]`**: 先頭から n 文字を取り出した新しい文字列です。
- **`<<`**: 文字列の末尾に連結します（その文字列自身を書き換えます）。
- **SafeBuffer（html_safe）**: Rails で「HTML として安全」と印を付けた文字列です。印付きの文字列はビューで HTML エスケープされずにそのまま出力されます。

## 何をしているか

### 1. 短ければ何もしない（96 行目）

文字列の長さが `truncate_to` 以下なら、コピーを返して終わりです。

### 2. 省略記号の分を差し引く（98〜100 行目）

`"Once upon a time in a world far far away"`（40 文字）を `truncate(27)` する場合、`omission` は `"..."`（3 文字）なので、本文に使えるのは `27 - 3 = 24` 文字です。
もし省略記号の方が長くて余地が 0 以下なら、省略記号だけを返します。

### 3. どこで切るか決める（102〜107 行目）

`separator` が指定されていれば、24 文字目より前で最後に現れる区切り文字の位置を探します。スペースなら 21 文字目（`"in a"` の後）が見つかるので、そこで切ります。見つからなければ 24 文字目で切ります。

### 4. 切って省略記号を付ける（112 行目）

先頭から `stop` 文字を取り出し、`"..."` を付けて返します。

## ここがすごい

### 結果の長さが必ず n 以下

「n 文字で切ってから ... を付ける」と、結果は n + 3 文字になってしまいます。画面の幅に収めたいという目的からすると、これでは困ります。このメソッドは最初に省略記号の長さを差し引くので、**結果が指定の長さを超えることがありません**。

### HTML の安全性を失わせる

109〜111 行目のコメントが重要です。`self[0, stop]` ではなく `to_str[0, stop]` と書くことで、元が「HTML として安全」な SafeBuffer でも、結果は **ふつうの文字列** になります。
`"<b>bold</b>"` を途中で切ると `"<b>bo..."` のように閉じタグのない HTML ができます。これを安全なまま出力するとページの構造が壊れたり、悪用されたりするかもしれません。印を外しておけば、ビューで自動的にエスケープされます。

### コピーを無駄に作らない

`to_str[0, stop]` はすでに新しい文字列なので、そこに `<<` で直接省略記号を付け足しています。`+` で連結するともう 1 つ文字列が作られますが、この書き方なら作るのは 1 回だけです。

## まとめ

- 「...」を付けるなら、その長さを先に引いておくと結果が指定の長さに収まります。
- `rindex` を使うと「この位置より前の最後の区切り」が簡単に見つかります。
- 文字列を切ると HTML が壊れることがあるので、安全の印は外すべきです。
- 新しく作った文字列には `<<` で付け足すと、余計なコピーを作りません。
