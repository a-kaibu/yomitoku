---
title: "入れ子の集合を平らにする、循環検出つきの再帰"
description: "集合の中の集合を再帰的にたどって、1 つの集合にまとめる内部メソッド。処理中と処理済みの印で、循環と重複を見分けている。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [359, 378]
function: "Set#flatten_merge"
difficulty: 2
format: 2
tags: ["データ構造", "再帰", "防御的プログラミング"]
---
## ひとことで

`Set#flatten_merge` は、集合（Set）の中に入っている別の集合を、外側の集合へ **再帰的に取り出してまとめる** 内部メソッドです。
`Set[1, Set[2, Set[3]]]` のような入れ子を平らにして、`Set[1, 2, 3]` にします。
自分自身を含むような循環した入れ子は、無限ループせずにエラーで止めます。

## コード

::: code-group

```ruby:line-numbers=359 [日本語訳]
  def flatten_merge(set, seen = {}) # 内部用（ドキュメントには載せない）
    set.each { |e|
      if e.is_a?(Set)
        case seen[e_id = e.object_id]
        when true
          raise ArgumentError, "tried to flatten recursive Set"
        when false
          next
        end

        seen[e_id] = true
        flatten_merge(e, seen)
        seen[e_id] = false
      else
        add(e)
      end
    }

    self
  end
```

```ruby:line-numbers=359 [原文]
  def flatten_merge(set, seen = {}) # :nodoc:
    set.each { |e|
      if e.is_a?(Set)
        case seen[e_id = e.object_id]
        when true
          raise ArgumentError, "tried to flatten recursive Set"
        when false
          next
        end

        seen[e_id] = true
        flatten_merge(e, seen)
        seen[e_id] = false
      else
        add(e)
      end
    }

    self
  end
```

:::

## 前提知識

- **Set（集合）**: 同じ要素を 2 つ持たず、順番を気にしないコレクションです。`require "set"` で読み込んで使います。
- **`each { |e| ... }`**: 集合の要素を 1 つずつ取り出し、ブロックの中で処理します。`|e|` は今の要素につける名前です。
- **`case ... when`**: 値に応じて処理を分ける構文です。`when true` は、値が `true` のときの枝を表します。
- **ハッシュ**: キーと値の対応表です。ここでは `seen[キー]` で「その集合を今どうしているか」を覚えておく記録に使っています。
- **`object_id`**: オブジェクトごとに 1 つ付く番号です。同じ実体のオブジェクトなら、同じ番号になります。
- **`protected`**: 同じクラスの中からだけ呼べるメソッドにする指定です。外のコードからは呼べません。

## 何をしているか

### 1. 要素が集合かどうかを見る

```ruby:line-numbers=360
    set.each { |e|
      if e.is_a?(Set)
```

要素が集合（`Set`）なら、その中身も取り出す対象になります。集合でなければ、ふつうの要素として扱います。

### 2. 「処理中」と「処理済み」で重複と循環を見分ける

```ruby:line-numbers=362
        case seen[e_id = e.object_id]
        when true
          raise ArgumentError, "tried to flatten recursive Set"
        when false
          next
        end
```

`seen` には、集合ごとの `object_id` を鍵にして状態を書き込みます。

- `true` は「今まさに中身を調べている途中」です。ここでもう一度同じ集合に出会ったら、自分の中に自分が入っている循環です。そこで `raise` して止めます。
- `false` は「中身を全部取り込み済み」です。同じ集合が 2 回出てきても、2 回目は `next` で飛ばします。
- 記録がない（`nil`）ものは、まだ調べていない集合なので、そのまま次の処理に進みます。

### 3. 中身は再帰で取り込み、ふつうの要素は追加する

```ruby:line-numbers=369
        seen[e_id] = true
        flatten_merge(e, seen)
        seen[e_id] = false
      else
        add(e)
      end
```

中に入っている集合は、同じ `flatten_merge` に渡して、さらに奥まで取り込みます。ここで作っているのは新しい集合ではなく、今の集合（`self`）への追加です。

### 4. 自分自身を返す

```ruby:line-numbers=377
    self
```

`self` を返すので、`flatten` は `self.class.new.flatten_merge(self)` のように、新しい集合に続けて呼び出せます。

## ここがすごい

### 循環を「途中」の印で見つける

もし「見たかどうか」だけを記録すると、同じ集合が 2 回出てきたときに「循環」と「重複」を区別できません。
このコードは `true`（途中）と `false`（完了）を分けているので、

- 途中で再び出会ったら循環 → エラー
- 完了していたら重複 → 飛ばす

と、2 つの場合を 1 つの表で正しく扱えます。

### 途中の結果を配列で持たない

素直に書くと、中間の配列を作って何度も結合したくなります。
このコードは、結果を直接 `self` に追加していくので、余分な配列を作りません。

### 内部用だけを `protected` にする

`flatten_merge` は `flatten` を支えるための道具で、利用者が直接呼ぶものではありません。`protected` にして、外から触れないようにしています。

## まとめ

- 入れ子の構造を再帰でたどるときは、「途中」と「完了」の印を分けると、循環と重複を同時に扱えます。
- ハッシュを記録に使うと、同じものかどうかを素早く確かめられます。
- 中間の結果を作らず、1 つの集合へ直接たくわえると、書く量も無駄な処理も減ります。
- 利用者に見せなくてよいメソッドは `protected` や `private` で隠せます。
