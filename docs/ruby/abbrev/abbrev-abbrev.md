---
title: "他と混同されない省略形を、すべて作る"
description: "Abbrev.abbrev は単語の一覧から、他の単語と混同されない省略形をすべて作る。同じ省略形が 2 回出てきたら、表から消して無効にする。"
language: ruby
project: "Ruby abbrev (標準ライブラリ)"
repo: https://github.com/ruby/abbrev
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2001,2003 Akinori MUSHA <knu@iDaemons.org>"
commit: "138820c087d1fccc776eb7665634ac6bca602faf"
file: lib/abbrev.rb
lines: [74, 107]
function: "Abbrev.abbrev"
difficulty: 3
format: 2
tags: ["文字列処理", "データ構造", "アルゴリズム"]
---
## ひとことで

`Abbrev.abbrev` は、単語の一覧を受け取り、**ほかの単語と混同されない省略形をすべて作る** メソッドです。
`["car", "cone"]` なら、`ca` は `car` だけの省略形、`co` は `cone` だけの省略形になります。`c` は両方に当てはまるので、省略形としては使えません。
戻り値は「省略形 → 元の単語」のハッシュです。コマンドの入力補完などに使われます。

## コード

::: code-group

```ruby:line-numbers=74 [日本語訳]
  def abbrev(words, pattern = nil)
    table = {}
    seen = Hash.new(0)

    if pattern.is_a?(String)
      pattern = /\A#{Regexp.quote(pattern)}/  # 接頭辞として扱う
    end

    words.each do |word|
      next if word.empty?
      word.size.downto(1) { |len|
        abbrev = word[0...len]

        next if pattern && pattern !~ abbrev

        case seen[abbrev] += 1
        when 1
          table[abbrev] = word
        when 2
          table.delete(abbrev)
        else
          break
        end
      }
    end

    words.each do |word|
      next if pattern && pattern !~ word

      table[word] = word
    end

    table
  end
```

```ruby:line-numbers=74 [原文]
  def abbrev(words, pattern = nil)
    table = {}
    seen = Hash.new(0)

    if pattern.is_a?(String)
      pattern = /\A#{Regexp.quote(pattern)}/  # regard as a prefix
    end

    words.each do |word|
      next if word.empty?
      word.size.downto(1) { |len|
        abbrev = word[0...len]

        next if pattern && pattern !~ abbrev

        case seen[abbrev] += 1
        when 1
          table[abbrev] = word
        when 2
          table.delete(abbrev)
        else
          break
        end
      }
    end

    words.each do |word|
      next if pattern && pattern !~ word

      table[word] = word
    end

    table
  end
```

:::

## 前提知識

- **省略形（略語）**: 元の単語の先頭部分だけを残した形です。`cone` の `co` のように、先頭から何文字かを取ったものです。
- **ハッシュ**: キーと値の対応表です。ここでは省略形（キー）から、元の単語（値）を引けるようにします。
- **`downto(1)`**: 単語の長さから 1 まで、1 ずつ減らしながら繰り返します。
- **`case ... when`**: 回数に応じて処理を分けます。
- **`module_function`**: このメソッドを、モジュールの関数としても呼べるようにします。`Abbrev.abbrev(...)` の形で使えます。
- **`pattern`**: 省略形を絞り込むための条件です。文字列なら、その文字列で始まるものだけを対象にします。

## 何をしているか

### 1. 単語の先頭から、省略形の候補を作る

```ruby:line-numbers=82
    words.each do |word|
      next if word.empty?
      word.size.downto(1) { |len|
        abbrev = word[0...len]

        next if pattern && pattern !~ abbrev

```

各単語について、長さから 1 まで、先頭の部分（`word[0...len]`）を省略形の候補にします。条件（`pattern`）に合わない候補は `next` で飛ばします。

### 2. 出現回数で、一意かどうかを決める

```ruby:line-numbers=89
        case seen[abbrev] += 1
        when 1
          table[abbrev] = word
        when 2
          table.delete(abbrev)
        else
          break
        end
```

`seen` は、その省略形が何回出てきたかを数えます。

- 1 回目なら、その省略形は今のところ一意なので、`table` に元の単語を入れます。
- 2 回目なら、別の単語と混同されるので、`table` から消します。
- 3 回目以降は、ほかの単語と何度も重なるので、残りのより短い候補も同じ理由で使えません。そこで `break` して、この単語の調べを終えます。

### 3. 完全な単語は、そのまま登録する

```ruby:line-numbers=100
    words.each do |word|
      next if pattern && pattern !~ word

      table[word] = word
    end
```

完全な単語は、ほかの単語と同じ綴りになることはないので、`word → word` として必ず入れます。

### 4. 表を返す

```ruby:line-numbers=106
    table
```

ここまでで作った `table` を返します。

## ここがすごい

### 「2 回目に消す」で、混同を一度に除く

ある省略形を作れる単語が 2 つ以上あると、その省略形は一意ではありません。
このコードは、1 回目は登録して、2 回目に消すという単純な規則で、すべての混同を取り除いています。
単語の組み合わせを全部比べる方法より、ずっと少ない手間で済みます。

### 長い省略形から順に調べる

`downto(1)` で、長い方から順に調べます。ある省略形が重なって消えると、その短い省略形もほかの単語と重なっている可能性が高いため、`break` で打ち切れます。
「ここまで一意」という境目を、単語ごとに 1 回の走査で決めています。

### 完全な単語も一緒に登録する

省略形の表に完全な単語を入れておくと、利用者は省略しても、完全に書いても、同じ表で答えを引けます。

## まとめ

- 一意性は、「同じものを何回見たか」を数えると、簡単に判定できます。
- 長い候補から調べると、重なりが生じた時点で打ち切れます。
- 補完や省略名を作るときは、元の単語も表に残しておくと、完全な入力にも対応できます。
